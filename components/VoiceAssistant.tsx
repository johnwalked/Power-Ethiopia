import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { LiveServerMessage } from "@google/genai";
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Volume2, Loader2, MessageSquare, Minimize2, Pause, Play, Key, Settings, Check, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { findCatalogProduct } from '../lib/productMatcher';
import { assetUrl } from '../lib/assetUtils';
import {
    decodeBase64Bytes,
    decodePcm16ToFloat32,
    downsampleFloat32,
    float32ToPcm16Base64
} from '../lib/audioUtils';

export type BargeInFilterMode = 'strict' | 'balanced';

const GEMINI_VOICES = [
    { id: 'Puck', name: 'Puck', desc: 'Friendly, upbeat & natural human tone (Male - Recommended)' },
    { id: 'Aoede', name: 'Aoede', desc: 'Warm, pleasant & natural conversational (Female - Recommended)' },
    { id: 'Kore', name: 'Kore', desc: 'Smooth, calm & engaging (Female)' },
    { id: 'Fenrir', name: 'Fenrir', desc: 'Deep & authoritative (Male)' },
    { id: 'Charon', name: 'Charon', desc: 'Mature & formal (Male)' }
];

const VoiceAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isTalking, setIsTalking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeGlimpse, setActiveGlimpse] = useState<{ id: string; name: string; image: string; category?: 'generator' | 'pump' } | null>(null);
    const [selectedVoice, setSelectedVoice] = useState<string>(() => {
        try {
            return localStorage.getItem('ce_voice_name') || 'Puck';
        } catch {
            return 'Puck';
        }
    });
    const [bargeInMode, setBargeInMode] = useState<BargeInFilterMode>(() => {
        try {
            return (localStorage.getItem('ce_barge_in_mode') as BargeInFilterMode) || 'strict';
        } catch {
            return 'strict';
        }
    });
    const [apiKeyInput, setApiKeyInput] = useState(() => {
        try {
            return localStorage.getItem('gemini_api_key') || '';
        } catch {
            return '';
        }
    });
    const [showSettings, setShowSettings] = useState(false);
    const [micAudioLevel, setMicAudioLevel] = useState<number>(0);

    const { language } = useLanguage();

    // Audio & Barge-in Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputGainRef = useRef<GainNode | null>(null);
    const compressorRef = useRef<DynamicsCompressorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const highpassFilterRef = useRef<BiquadFilterNode | null>(null);
    const lowpassFilterRef = useRef<BiquadFilterNode | null>(null);
    const silentGainRef = useRef<GainNode | null>(null);

    const inputSampleRateRef = useRef<number>(16000);
    const lastMicUiUpdateRef = useRef<number>(0);
    const ambientNoiseFloorRef = useRef<number>(0.012);
    const bargeInModeRef = useRef<BargeInFilterMode>('strict');
    const nextStartTimeRef = useRef<number>(0);
    const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
    const isTalkingRef = useRef<boolean>(false);
    const bargeInCounterRef = useRef<number>(0);

    // Control Refs
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const isPausedRef = useRef(false);
    const glimpseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync isTalkingRef with isTalking state
    useEffect(() => {
        isTalkingRef.current = isTalking;
    }, [isTalking]);

    // Sync bargeInModeRef with state
    useEffect(() => {
        bargeInModeRef.current = bargeInMode;
    }, [bargeInMode]);

    // Helper: Resolve product query / ID to a verified local catalog photo & title
    const findProductForGlimpse = useCallback((query?: string, fallbackName?: string, category?: string) => {
        return findCatalogProduct(query, fallbackName, category);
    }, []);

    // Synchronously schedule decoded Gemini 24kHz PCM chunk with jitter lookahead to eliminate crackling
    const schedulePcmAudioChunk = useCallback((base64Audio: string) => {
        const ctx = audioContextRef.current;
        if (!ctx) return;

        const bytes = decodeBase64Bytes(base64Audio);
        const samples = decodePcm16ToFloat32(bytes);
        if (samples.length === 0) return;

        const JITTER_LOOKAHEAD_SEC = 0.085; // 85ms smooth network buffer cushion
        const now = ctx.currentTime;
        let startTime = nextStartTimeRef.current;
        const isFreshOrUnderrun = startTime < now + 0.015;

        if (isFreshOrUnderrun) {
            startTime = now + JITTER_LOOKAHEAD_SEC;
            // Apply a 2ms fade-in only after silence/underrun so edges never click
            const fadeSamples = Math.min(48, Math.floor(samples.length / 4));
            for (let i = 0; i < fadeSamples; i++) {
                samples[i] *= i / fadeSamples;
            }
        }

        const buffer = ctx.createBuffer(1, samples.length, 24000);
        buffer.getChannelData(0).set(samples);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(compressorRef.current || outputGainRef.current || ctx.destination);

        isTalkingRef.current = true;
        setIsTalking(true);

        source.onended = () => {
            const idx = audioQueueRef.current.indexOf(source);
            if (idx > -1) {
                audioQueueRef.current.splice(idx, 1);
            }
            if (audioQueueRef.current.length === 0) {
                isTalkingRef.current = false;
                setIsTalking(false);
            }
        };

        source.start(startTime);
        nextStartTimeRef.current = startTime + buffer.duration;
        audioQueueRef.current.push(source);
    }, []);

    const createPcmBlob = (data: Float32Array) => ({
        data: float32ToPcm16Base64(data),
        mimeType: 'audio/pcm;rate=16000',
    });

    // Stop playback immediately for barge-in / interruption
    const stopPlayback = useCallback(() => {
        audioQueueRef.current.forEach(source => {
            try {
                source.stop();
                source.disconnect();
            } catch (e) {
                // Ignore already stopped sources
            }
        });
        audioQueueRef.current = [];

        if (audioContextRef.current) {
            nextStartTimeRef.current = audioContextRef.current.currentTime;
        } else {
            nextStartTimeRef.current = 0;
        }

        isTalkingRef.current = false;
        setIsTalking(false);
    }, []);

    // Intelligent Vocal Barge-in Detection (Distinguishes intentional human interruption from room noise)
    const checkAndHandleBargeIn = useCallback((rms: number, zcr: number): boolean => {
        // Only run barge-in detection if the assistant is currently speaking or audio is queued
        if (!isTalkingRef.current && audioQueueRef.current.length === 0) {
            bargeInCounterRef.current = 0;
            return false;
        }

        const mode = bargeInModeRef.current;
        // Strict mode (Default): Requires intentional vocal speech, ignoring room noise, coughs, and speaker bleed
        // Balanced mode: Moderate threshold
        const minRms = mode === 'strict' ? 0.038 : 0.026;
        const dynamicThreshold = Math.max(minRms, ambientNoiseFloorRef.current * 2.6);

        // Human vocal phonation has vocal cord periodicity with ZCR between 0.018 and 0.38
        // Mechanical clicks, fan rumble, desk taps, and rustles fall outside this band
        const isHumanVocal = (rms >= dynamicThreshold) && (zcr >= 0.018 && zcr <= 0.38);

        if (isHumanVocal) {
            bargeInCounterRef.current += 1;
            // 4 consecutive frames (~160-220ms) of sustained voice to confirm user interruption
            const requiredConsecutive = mode === 'strict' ? 4 : 3;
            if (bargeInCounterRef.current >= requiredConsecutive) {
                console.log('[CE Assistant] Intentional human interruption verified (RMS:', rms.toFixed(4), 'ZCR:', zcr.toFixed(3), ')');
                stopPlayback();
                bargeInCounterRef.current = 0;
                return true;
            }
        } else {
            bargeInCounterRef.current = Math.max(0, bargeInCounterRef.current - 1);
        }

        return false;
    }, [stopPlayback]);

    // Audio Frame Dispatcher
    const handleAudioFrame = useCallback((rawFrame: Float32Array) => {
        const data = inputSampleRateRef.current !== 16000
            ? downsampleFloat32(rawFrame, inputSampleRateRef.current, 16000)
            : rawFrame;

        const len = data.length;
        if (len === 0) return;

        let sum = 0;
        let zeroCrossings = 0;
        for (let i = 0; i < len; i++) {
            sum += data[i] * data[i];
            if (i > 0 && ((data[i] >= 0 && data[i - 1] < 0) || (data[i] < 0 && data[i - 1] >= 0))) {
                zeroCrossings++;
            }
        }
        const rms = Math.sqrt(sum / len);
        const zcr = zeroCrossings / len;

        // Track ambient noise floor only when assistant is quiet
        if (!isTalkingRef.current) {
            if (ambientNoiseFloorRef.current <= 0) {
                ambientNoiseFloorRef.current = Math.max(0.006, rms);
            } else if (rms < ambientNoiseFloorRef.current) {
                ambientNoiseFloorRef.current = ambientNoiseFloorRef.current * 0.90 + rms * 0.10;
            } else if (rms < ambientNoiseFloorRef.current * 1.5) {
                ambientNoiseFloorRef.current = ambientNoiseFloorRef.current * 0.99 + rms * 0.01;
            }
        }

        // Throttle React meter updates (~15fps) so main-thread UI re-renders never starve audio playback
        const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
        if (nowMs - lastMicUiUpdateRef.current >= 65) {
            lastMicUiUpdateRef.current = nowMs;
            setMicAudioLevel(Math.min(1.0, rms * 6.0));
        }

        // Check if user is intentionally interrupting the assistant
        const isInterrupted = checkAndHandleBargeIn(rms, zcr);

        // Echo Attenuation during Assistant Output:
        // While CE Assistant is speaking, if the user is NOT speaking, we attenuate the mic buffer
        // so speaker audio bleed and room noise don't trigger server-side barge-in on Gemini Live!
        // As soon as the user speaks intentionally, full audio is streamed immediately.
        let frameToSend = data;
        if (isTalkingRef.current && !isInterrupted && bargeInCounterRef.current === 0) {
            const attenuated = new Float32Array(len);
            for (let i = 0; i < len; i++) {
                attenuated[i] = data[i] * 0.02; // Attenuate speaker bleed
            }
            frameToSend = attenuated;
        }

        // Send to Gemini Live
        const pcmBlob = createPcmBlob(frameToSend);
        sessionPromiseRef.current?.then(session => {
            session.sendRealtimeInput({ media: pcmBlob });
        }).catch(() => {});
    }, [checkAndHandleBargeIn]);

    const getApiKey = () => {
        let storedKey = '';
        try {
            storedKey = localStorage.getItem('gemini_api_key') || '';
        } catch {}
        if (storedKey) return storedKey;

        // Direct un-chained token reads so Vite statically replaces them in production builds
        try {
            const viteKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (viteKey) return viteKey;
        } catch {}

        try {
            const envGeminiKey = process.env.GEMINI_API_KEY;
            if (envGeminiKey) return envGeminiKey;
        } catch {}

        try {
            const envApiKey = process.env.API_KEY;
            if (envApiKey) return envApiKey;
        } catch {}

        try {
            if (typeof __CE_GEMINI_API_KEY__ !== 'undefined' && __CE_GEMINI_API_KEY__) {
                return __CE_GEMINI_API_KEY__;
            }
        } catch {}

        return '';
    };

    const handleSaveApiKey = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const cleaned = apiKeyInput.trim();
        if (!cleaned) return;
        try {
            localStorage.setItem('gemini_api_key', cleaned);
        } catch {}
        setError(null);
        setShowSettings(false);
        setTimeout(() => {
            connect();
        }, 100);
    };

    const handleSelectVoice = (voiceId: string) => {
        setSelectedVoice(voiceId);
        try {
            localStorage.setItem('ce_voice_name', voiceId);
        } catch {}
        if (isConnected) {
            disconnect();
            setTimeout(() => {
                connect();
            }, 200);
        }
    };

    const handleSelectBargeInMode = (mode: BargeInFilterMode) => {
        setBargeInMode(mode);
        try {
            localStorage.setItem('ce_barge_in_mode', mode);
        } catch {}
    };

    const connect = async () => {
        const apiKey = getApiKey();
        if (!apiKey) {
            setError("Gemini API Key missing. Paste your key below or set GEMINI_API_KEY in environment variables.");
            return;
        }

        setError(null);
        setIsConnected(true); // Optimistic UI
        setIsPaused(false);
        isPausedRef.current = false;

        // Reset audio timing cursors for new session
        nextStartTimeRef.current = 0;
        audioQueueRef.current = [];
        bargeInCounterRef.current = 0;

        try {
            // Dynamic Import for Performance Optimization
            const { GoogleGenAI, Modality, Type } = await import("@google/genai");

            const ai = new GoogleGenAI({ apiKey });

            // Setup Audio Contexts (use native hardware output rate with 'playback' hint to avoid OS SRC crackling)
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const outputContext = new AudioContextClass({ latencyHint: 'playback' });
            if (outputContext.state === 'suspended') {
                await outputContext.resume();
            }
            audioContextRef.current = outputContext;

            // Smooth vocal dynamics compressor + master gain stage to prevent digital clipping
            const compressor = outputContext.createDynamicsCompressor();
            compressor.threshold.value = -8;
            compressor.knee.value = 12;
            compressor.ratio.value = 3;
            compressor.attack.value = 0.003;
            compressor.release.value = 0.15;
            const outputGain = outputContext.createGain();
            outputGain.gain.value = 1.0;
            compressor.connect(outputGain);
            outputGain.connect(outputContext.destination);
            compressorRef.current = compressor;
            outputGainRef.current = outputGain;

            // Input Context (Mic)
            const inputContext = new AudioContextClass({ sampleRate: 16000 });
            if (inputContext.state === 'suspended') {
                await inputContext.resume();
            }
            inputAudioContextRef.current = inputContext;
            inputSampleRateRef.current = inputContext.sampleRate;

            // Get Mic Stream with noise suppression and AGC enabled for proper voice pickup
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1
                }
            });
            mediaStreamRef.current = stream;

            // Establish Live Connection
            const liveModel = import.meta.env.VITE_GEMINI_VOICE_MODEL ||
                              'gemini-2.5-flash-native-audio-preview-12-2025';

            const sessionPromise = ai.live.connect({
                model: liveModel,
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } }
                    },
                    systemInstruction: `You are CE Assistant (ሲኢ ረዳት), the Senior Diesel Power & Pumping Engineer at CE Power Ethiopia (Kality Gabriel / ቃሊቲ ገብርኤል, Addis Ababa).

COMPANY & KALITY FACILITY:
- CE Power is the Ethiopian branch of Guangdong MINDONG Electric Co., Ltd. (founded 1958). Certified to ISO 9001, ISO 14001, CE, IEC, and TÜV Rheinland.
- Addis Ababa Factory Compound (Kality Gabriel): Showroom, load-bank testing, ATS panel assembly, genuine spare parts warehouse, and field engineering support.
- Direct Sales & Engineering Hotline: 09 66 33 03 09 (ዜሮ ዘጠኝ ስልሳ ስድስት ሰላሳ ሶስት ዜሮ ሶስት ዜሮ ዘጠኝ) | Email: info@cepower.et | Web: cepower.et.
- Pricing Policy: Never guess ETB/USD prices; explain that factory quotes depend on model, ATS, and delivery, and direct callers to 09 66 33 03 09 or the catalog Request Quote button.

REAL-WORLD ENGINE PLATFORMS & VERIFIED KALITY GENERATOR INVENTORY:
• Electrical Standards in Ethiopia: Industrial units run at 1,500 RPM (4-pole brushless alternator with AVR, ±1% voltage regulation, Class H insulation, IP23) outputting 50 Hz, 400V 3-phase / 230V single-phase. Portable models run at 220V single-phase (or 220/380V dual option on 7.5–11kW silent units).
• Weichai (ከባድ ኢንዱስትሪ):
  - Warehouse focus: 200kW, 300kW, 400kW, 500kW, 600kW Silent (catalog also includes 80kW, 275kW, 330kW, 353kW, and custom 3000kW CW16V200ZD).
  - Engines: WP4.1 / WP10 / WP12 / WP13 (inline-4 & inline-6 turbocharged-intercooled). High torque reserve for sudden block loads (crushers, mining, batching plants, heavy elevators); electronic governor holds ±0.5% frequency stability. ~51 L/hr @ 200kW, ~105 L/hr @ 500kW at full load.
• Yuchai (ዩቻይ):
  - Warehouse focus: 60kW, 80kW, 100kW, 120kW, 150kW, 200kW, 250kW, 300kW, 360kW, 400kW, 450kW Silent (catalog also includes 24.5kW, 92kW, 1000kW, 2000kW).
  - Engines: YC4D (60kW), YC4A (80–100kW), YC6A (120–150kW), YC6MK (200–450kW heavy 10.3L inline-6), YC12VC/YC16VC (1000–2000kW V-series). Clean combustion, low fuel burn (~15 L/hr @ 60kW, ~24 L/hr @ 100kW, ~63.6 L/hr @ 200kW, ~86 L/hr @ 360kW at rated load), reliable cold starting at highland altitude.
• Yunnei (ዩኔይ):
  - Warehouse focus: 15kW, 20kW, 30kW, 50kW, 60kW, 80kW, 100kW, 120kW (plus heavy catalog units 334kW, 400kW, 600kW).
  - Engines: YN38GBZ (15–38kW), YN490D (50–55kW), YN4EL (60–120kW). Economical commercial workhorses for clinics, bakeries, hotels, and fuel stations with affordable, abundant Kality spare parts (~4 L/hr @ 15kW, ~12 L/hr @ 50kW, ~22 L/hr @ 100kW).
• Weifang (ዌይፋንግ):
  - Warehouse focus: 50kW, 100kW, 120kW, 150kW (R4105ZD / R6105ZD). Proven Ricardo-architecture mechanical fuel systems — easy for local technicians across regional Ethiopia to maintain without laptop diagnostics.
• KOFO / Kefo (ኮፎ / ኬፎ):
  - Warehouse focus: KOFO 200kW Silent (K6126ZLD-200, ~48 L/hr), plus Kefo 50kW, 120kW, 150kW, 180kW industrial units.
• United Power (ዩናይትድ ፓወር):
  - Warehouse focus: 2.2kW, 3kW, 3.5kW, 5kW, 5.5kW, 6kW, 6.5kW, 7kW, 7.5kW, 8kW, 8.5kW (available in BOTH Open-frame and Silent canopy variants, 220V / 220-380V, ~0.9–2.6 L/hr), plus 11kW Silent canopy only (220V/380V, ~2.7 L/hr).
• Cummins & Last (Heavy / Multi-brand):
  - Cummins 24kW, 100kW, 220kW, 1000kW, and custom 1120kW (KTA50-G3, 10kV High Voltage) plus Last 25kW–200kW units.

REAL-WORLD GENERATOR ENGINEERING, FUEL & MAINTENANCE RULES:
• kW vs kVA: Real active power is kW = kVA × 0.8 power factor (e.g., 250kVA = 200kW; 625kVA = 500kW).
• Altitude & Heat Derating (ISO 8528):
  - Addis Ababa sits at ~2,355m elevation, where thinner air reduces air mass and combustion oxygen by ~10–15% on turbocharged-intercooled engines (higher on small naturally aspirated units). Lowland heat above 35–40°C (e.g., Afar, Dire Dawa, Semera, Gambella) also reduces cooling and power output by ~5–8%.
  - Always size continuous running load to ~70–80% of rated Prime power (keep ~20–25% headroom). Never run a diesel generator continuously below ~25–30% load, as low exhaust temperatures cause unburnt fuel "wet stacking", carbon glazing, and turbo fouling.
• Motor Starting Surge & Phase Balance:
  - Direct-On-Line (DOL) electric motors draw 5×–6× locked-rotor amps (~2.5×–3.5× starting kVA surge). Star-Delta starters cut surge to ~1.8×–2.2×; Soft-Starters or VFDs cut surge to ~1.2×–1.5× (dramatically shrinking required genset size). Stagger heavy motor starts by 10–15 seconds and keep 3-phase loads balanced within ~15–20% per phase.
• Real Diesel Maintenance Schedule:
  - Typical brake-specific fuel consumption is ~0.22–0.26 L/kWh at 75–100% load.
  - Break-in oil/filter service at 50 operating hours, then every 250 hours (15W-40 CI-4/CH-4 oil, coolant/antifreeze checks, and draining water separators regularly). Check air filters more often in dusty construction or quarry sites.

REAL-WORLD WATER PUMP HYDRAULICS & KALITY IN-STOCK PUMP RANGE:
• All 23 catalog pumps at CE Power are surface diesel centrifugal / high-pressure pump sets (3" to 8" flanges, 7m–9m max suction rating, electric or recoil start).
• Critical Suction & Borehole Physics (Be 100% honest with customers!):
  - Surface centrifugal diesel pumps draw water via atmospheric pressure: practical vertical suction lift is max ~7–8m at low elevation and ~5.5–6.5m at Addis Ababa altitude (2,355m), using airtight suction hose + submerged foot valve/strainer.
  - Surface diesel pumps CANNOT pull water out of a deep borehole (>8–9m water depth). For deep boreholes (30m–200m+), customers need an electric submersible borehole pump powered by a properly sized CE Power diesel generator (ideally with a VFD or soft starter).
• Pump Curves & Total Dynamic Head (TDH):
  - A pump's rated "max head" (shutoff/peak lift) and "max flow rate" are opposite ends of its Q–H curve — they do NOT happen at the exact same time. Actual flow depends on TDH = vertical discharge elevation + suction lift + pipe friction loss. Using undersized discharge pipe over long horizontal runs spikes friction loss and cuts flow; match flange diameter (4", 6", 8") with HDPE/steel pipe.
• Verified In-Stock Yuchai Pumps (Full 60kW to 250kW Range + 50HP):
  - Yuchai 50HP / 37kW (4", up to 70m max head / 320 m³/h peak flow), plus Yuchai 60kW (4", 75m / 300 m³/h), 80kW (6", 80m / 350 m³/h), 100kW (6", 85m / 450 m³/h), 120kW (6", 90m / 480 m³/h), 150kW (6", 95m / 520 m³/h), 180kW (6", 98m / 580 m³/h), 200kW (8", 105m / 680 m³/h), and 250kW (8", 110m / 780 m³/h). Ideal for river lifting, Awash/Omo irrigation schemes, coffee/tea/sugarcane farms, quarries, and municipal booster stations.
• Verified Other Multi-Brand Pumps in Stock:
  - Small/Medium: United Power 11kW (3", 45m / 15 m³/h), Kefo 30HP/22kW (3", 40m / 180 m³/h), Yunnei 40HP/30kW (4", 50m / 280 m³/h), Cummins 100HP/75kW High-Pressure Fire Pump (6", 100m / 500 m³/h).
  - Heavy 100kW–600kW: Yunnei 100kW (6", 85m / 450 m³/h), Yunnei 120kW (4", 85m / 160 m³/h), Weifang 150kW (6", 95m / 500 m³/h), Kefo 180kW (6", 85m / 550 m³/h), Last 200kW (6", 100m / 650 m³/h), Weichai 250kW (8", 110m / 750 m³/h), Yunnei 334kW/400kW/600kW, and Weichai 400kW (6", 105m / 530 m³/h).
• Direct Diesel Pump vs Electric Pump + Generator:
  - Direct-drive diesel pump sets eliminate alternator + cable + motor conversion losses (~15–20% efficiency gain) and avoid motor inrush oversizing, cutting off-grid irrigation equipment and fuel costs by ~20–30%.
  - If pairing an electric pump with a generator: with DOL start size ~2.5× running kW (or ~1.5× with a VFD/soft starter) — e.g., an 80kW electric pump pairs with a 120–150kW genset on VFD or 200kW genset on DOL.

WARRANTY, LOGISTICS & SERVICES:
• Warranty: 1-year or 1,000 operating hours (whichever comes first) factory warranty covering engine and alternator.
• Delivery & Installation: Free delivery within Addis Ababa; fast regional transport across Oromia, Amhara, Tigray, Sidama, Dire Dawa, Afar, Somali, and Benishangul. SmartGen/DeepSea ATS panels (~8–10 sec auto transfer) and load-bank testing available.
• Payment: Bank transfer (CBE, Dashen, Awash, Telebirr), factory cash at Kality, or LC for bulk orders.

CONVERSATIONAL PERSONA & CONSULTATIVE STYLE:
- NAME: CE Assistant (ሲኢ ረዳት). Keep replies natural, warm, practical, and concise (2–3 sentences max per turn unless asked for full details). Never recite giant tables aloud.
- ASK SMART ENGINEERING QUESTIONS FIRST:
  • For generators: ask what equipment/motors they run, single vs 3-phase (220V vs 400V), and site city/elevation.
  • For pumps: ask if the water source is surface (river/canal/pond ≤6–7m below pump) or a deep borehole, plus elevation lift & pipe distance.
- BARGE-IN & FOCUS: Stop immediately if interrupted; listen only to the primary speaker.
- LANGUAGES: Fluent Amharic (e.g., "እንኳን ደህና መጡ! እኔ የሲኢ ፓወር ረዳት ነኝ። በምን ላግዝዎት?"), English, and natural support for Afaan Oromoo, Tigrinya, and Chinese. Current UI Language: ${language}.

GLIMPSE FEATURE (DISPLAYING PRODUCT PHOTOS ON SCREEN):
- Whenever the user asks to see a product photo, picture, visual, or explores a specific generator or pump model (in English, Amharic e.g. "ፎቶ አሳየኝ", or any language), ALWAYS call the "show_product_image" tool immediately BEFORE finishing your spoken answer.
- Pass a concise English query with brand, kW rating, and type (e.g. "weichai 500kw generator", "yuchai 200kw generator", "yuchai 120kw pump", "yuchai 80kw pump"). Never invent external URLs.
- Key verified catalog IDs:
  Generators: weichai-500kw, weichai-400kw-new, weichai-300kw, weichai-200kw, weichai-80kw, yuchai-200kw-md200, yuchai-150kw-md150, yuchai-100kw, yuchai-60kw, yunnei-15kw, yunnei-50kw, yunnei-100kw, weifang-100kw, kofo-200kw, united-11kw, cummins-100kw.
  Water Pumps: yc-50p, yuchai-60kw-pump, yuchai-80kw-pump, yuchai-100kw-pump, yuchai-120kw-pump, yuchai-150kw-pump, yuchai-180kw-pump, yuchai-200kw-pump, yuchai-250kw-pump, yunnei-pump-100kw, yunnei-120kw-pump-new, weifang-150kw-pump, kefo-180kw-pump, last-200kw-pump, weichai-250kw-pump, weichai-400kw-pump, cum-pump-100, united-11kw-pump.
- Once show_product_image runs, briefly summarize the key real-world specs of that unit in 1–2 sentences.`,
                    tools: [{
                        googleSearch: {}
                    }, {
                        functionDeclarations: [
                            {
                                name: "show_product_image",
                                description: "Display a 10-second floating glimpse photo of a specific CE Power generator or water pump on the user's screen.",
                                parameters: {
                                    type: Type.OBJECT,
                                    properties: {
                                        productQuery: {
                                            type: Type.STRING,
                                            description: "Catalog ID or natural brand + kW + type query (e.g. 'weichai-500kw', 'yuchai-80kw-pump', 'yunnei 100kw generator')."
                                        },
                                        category: {
                                            type: Type.STRING,
                                            description: "Optional category hint: 'generator' or 'pump'."
                                        }
                                    },
                                    required: ["productQuery"]
                                }
                            }
                        ]
                    }]
                },
                callbacks: {
                    onopen: async () => {
                        console.log("[CE Assistant] Live Session Opened with voice:", selectedVoice);
                        
                        // Setup Audio Nodes
                        sourceRef.current = inputContext.createMediaStreamSource(stream);

                        // 1. High-Pass Filter (cuts low-frequency rumbles, table thumps, floor vibrations)
                        const highpass = inputContext.createBiquadFilter();
                        highpass.type = 'highpass';
                        highpass.frequency.value = 80;
                        highpass.Q.value = 0.707;
                        highpassFilterRef.current = highpass;

                        // 2. Low-Pass Filter (cuts ultrasonic hiss outside vocal range)
                        const lowpass = inputContext.createBiquadFilter();
                        lowpass.type = 'lowpass';
                        lowpass.frequency.value = 7500;
                        lowpass.Q.value = 0.707;
                        lowpassFilterRef.current = lowpass;

                        // 3. Silent Gain (keeps Web Audio clock active without speaker feedback)
                        const silentGain = inputContext.createGain();
                        silentGain.gain.value = 0.0;
                        silentGain.connect(inputContext.destination);
                        silentGainRef.current = silentGain;

                        // Connect Hardware Filter Chain
                        sourceRef.current.connect(highpass);
                        highpass.connect(lowpass);

                        let workletDone = false;
                        if (inputContext.audioWorklet && typeof inputContext.audioWorklet.addModule === 'function') {
                            try {
                                const batchSize = inputContext.sampleRate >= 40000 ? 2048 : 1024;
                                const workletCode = `
                                    class LiveMicProcessor extends AudioWorkletProcessor {
                                        constructor() {
                                            super();
                                            this._buffer = new Float32Array(${batchSize});
                                            this._offset = 0;
                                        }
                                        process(inputs) {
                                            const input = inputs[0];
                                            if (input && input[0]) {
                                                const ch = input[0];
                                                for (let i = 0; i < ch.length; i++) {
                                                    this._buffer[this._offset++] = ch[i];
                                                    if (this._offset >= this._buffer.length) {
                                                        this.port.postMessage(this._buffer.slice());
                                                        this._offset = 0;
                                                    }
                                                }
                                            }
                                            return true;
                                        }
                                    }
                                    registerProcessor('live-mic-processor', LiveMicProcessor);
                                `;
                                const blob = new Blob([workletCode], { type: 'application/javascript' });
                                const url = URL.createObjectURL(blob);
                                await inputContext.audioWorklet.addModule(url);
                                URL.revokeObjectURL(url);

                                const workletNode = new AudioWorkletNode(inputContext, 'live-mic-processor');
                                workletNode.port.onmessage = (e) => {
                                    if (isPausedRef.current) return;
                                    handleAudioFrame(e.data);
                                };
                                lowpass.connect(workletNode);
                                workletNode.connect(silentGain);
                                workletNodeRef.current = workletNode;
                                workletDone = true;
                            } catch (e) {
                                console.warn('[CE Assistant] AudioWorklet init error, using fallback:', e);
                            }
                        }

                        if (!workletDone) {
                            processorRef.current = inputContext.createScriptProcessor(4096, 1, 1);
                            processorRef.current.onaudioprocess = (e) => {
                                if (isPausedRef.current) return;
                                const inputData = e.inputBuffer.getChannelData(0);
                                handleAudioFrame(inputData);
                            };
                            lowpass.connect(processorRef.current);
                            processorRef.current.connect(silentGain);
                        }
                    },
                    onmessage: (msg: LiveServerMessage) => {
                        // Synchronously decode and schedule all PCM chunks in order to eliminate overlaps/crackling
                        const parts = msg.serverContent?.modelTurn?.parts || [];
                        for (const part of parts) {
                            const audioData = (part as any)?.inlineData?.data;
                            if (audioData) {
                                schedulePcmAudioChunk(audioData);
                            }
                        }

                        // Handle Tool Calls (Glimpse Feature)
                        const inlineFunctionCalls = parts
                            .map((p: any) => p.functionCall)
                            .filter(Boolean);
                        const toolCallMsg = (msg as any).toolCall;
                        const functionCalls = [
                            ...(toolCallMsg?.functionCalls || []),
                            ...inlineFunctionCalls
                        ];
                        if (functionCalls.length > 0) {
                            console.log('[CE Assistant] Tool call received:', JSON.stringify(functionCalls));
                            const showImageCall = functionCalls.find((fc: any) => fc.name === 'show_product_image');
                            if (showImageCall) {
                                const args = showImageCall.args || {};
                                const queryArg = args.productQuery || args.productId || '';
                                const nameArg = args.productName || '';
                                const categoryArg = args.category || '';
                                console.log('[CE Assistant] Resolving glimpse for:', queryArg, nameArg, categoryArg);

                                const localProduct = findProductForGlimpse(queryArg, nameArg, categoryArg);
                                const isPumpQuery = /pump/i.test(categoryArg) || /pump|ፓምፕ|irrigation/i.test(`${queryArg} ${nameArg}`);
                                const fallbackImage = isPumpQuery ? '/images/perkins-pump-80.webp' : '/images/yuchai-200kw-md200.webp';

                                const finalId = localProduct?.id || queryArg || (isPumpQuery ? 'yuchai-80kw-pump' : 'yuchai-200kw-md200');
                                const finalName = localProduct?.name || nameArg || queryArg || 'CE Power Equipment';
                                const finalImage = localProduct?.image || fallbackImage;
                                const finalCategory: 'generator' | 'pump' = localProduct?.category || (isPumpQuery ? 'pump' : 'generator');

                                // Clear any previous timer
                                if (glimpseTimerRef.current) clearTimeout(glimpseTimerRef.current);

                                setActiveGlimpse({ id: finalId, name: finalName, image: finalImage, category: finalCategory });

                                // 10-second auto-dismiss
                                glimpseTimerRef.current = setTimeout(() => {
                                    setActiveGlimpse(null);
                                    glimpseTimerRef.current = null;
                                }, 10000);

                                // Send tool response with matched product info so the model continues smoothly
                                sessionPromiseRef.current?.then(session => {
                                    session.sendToolResponse({
                                        functionResponses: [{
                                            name: 'show_product_image',
                                            response: {
                                                output: {
                                                    displayed: true,
                                                    productId: finalId,
                                                    productName: finalName,
                                                    category: finalCategory,
                                                    powerKW: localProduct?.powerKW
                                                }
                                            },
                                            id: showImageCall.id
                                        }]
                                    });
                                }).catch(err => console.warn('[CE Assistant] Tool response error:', err));
                            }
                        }

                        // Handle Server-Signaled Interruption (Barge-in confirmation)
                        if (msg.serverContent?.interrupted || (msg as any).interrupted || (msg as any).serverContent?.modelTurn?.interrupted) {
                            console.log('[CE Assistant] Interruption received from Gemini Live, clearing audio queue.');
                            stopPlayback();
                        }
                    },
                    onclose: () => {
                        console.log("[CE Assistant] Session Closed");
                        setIsConnected(false);
                        setIsTalking(false);
                        isTalkingRef.current = false;
                        setIsPaused(false);
                        isPausedRef.current = false;
                        setMicAudioLevel(0);
                    },
                    onerror: (err) => {
                        console.error("[CE Assistant] Session Error", err);
                        setError("Service unavailable. Please try again.");
                        setIsConnected(false);
                        setIsPaused(false);
                        setMicAudioLevel(0);
                    }
                }
            });

            sessionPromiseRef.current = sessionPromise;
            await sessionPromise;

        } catch (err: any) {
            console.error("Connection failed", err);
            if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
                setError("Microphone permission was denied. Please allow microphone access in your browser settings.");
            } else {
                setError("Connection failed. Please check your network and API key.");
            }
            disconnect();
        }
    };

    const handleActivation = () => {
        // If connected but minimized, just open UI
        if (isConnected) {
            setIsOpen(true);
            return;
        }

        setIsOpen(true);
        connect();
    };

    const togglePause = async () => {
        const newState = !isPaused;
        setIsPaused(newState);
        isPausedRef.current = newState;

        if (newState) {
            stopPlayback();
            setMicAudioLevel(0);
        }

        if (audioContextRef.current) {
            if (newState) {
                await audioContextRef.current.suspend();
            } else {
                await audioContextRef.current.resume();
            }
        }
    };

    const disconnect = async () => {
        setIsConnected(false);
        setIsTalking(false);
        isTalkingRef.current = false;
        setIsPaused(false);
        isPausedRef.current = false;
        setActiveGlimpse(null);
        setMicAudioLevel(0);
        if (glimpseTimerRef.current) { clearTimeout(glimpseTimerRef.current); glimpseTimerRef.current = null; }

        stopPlayback();

        // Close the session properly to release resources
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.warn("Error closing session:", e);
            }
            sessionPromiseRef.current = null;
        }

        // Cleanup Audio chain
        if (highpassFilterRef.current) {
            highpassFilterRef.current.disconnect();
            highpassFilterRef.current = null;
        }
        if (lowpassFilterRef.current) {
            lowpassFilterRef.current.disconnect();
            lowpassFilterRef.current = null;
        }
        if (silentGainRef.current) {
            silentGainRef.current.disconnect();
            silentGainRef.current = null;
        }
        if (compressorRef.current) {
            compressorRef.current.disconnect();
            compressorRef.current = null;
        }
        if (outputGainRef.current) {
            outputGainRef.current.disconnect();
            outputGainRef.current = null;
        }

        // Cleanup Mic & Audio Streams
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (workletNodeRef.current) {
            workletNodeRef.current.port.onmessage = null;
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        if (inputAudioContextRef.current) {
            try {
                inputAudioContextRef.current.close();
            } catch (e) {
                // Ignore if already closed
            }
            inputAudioContextRef.current = null;
        }
        if (audioContextRef.current) {
            try {
                audioContextRef.current.close();
            } catch (e) {
                // Ignore if already closed
            }
            audioContextRef.current = null;
        }

        nextStartTimeRef.current = 0;
        audioQueueRef.current = [];
    };

    return (
        <>
        <div className="fixed bottom-6 right-6 z-[95] flex flex-col items-end gap-4">

            {/* Expanded Interface */}
            {isOpen && (
                <div className="bg-slate-900/95 backdrop-blur-3xl rounded-2xl shadow-2xl border border-white/10 w-[calc(100vw-2rem)] sm:w-[356px] overflow-hidden animate-in slide-in-from-bottom-5 duration-200 inner-glow">
                    <div className="bg-white/5 backdrop-blur-sm p-4 flex justify-between items-center text-white border-b border-white/10">
                        <h3 className="font-bold flex items-center gap-2 text-sm">
                            <MessageSquare size={16} className="text-red-400" />
                            CE Assistant (ሲኢ ረዳት)
                        </h3>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'text-red-400 bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                                title="Live Voice & Settings"
                            >
                                <Settings size={15} />
                            </button>
                            <button 
                                onClick={() => setIsOpen(false)} 
                                className="text-slate-400 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors" 
                                title="Minimize"
                            >
                                <Minimize2 size={16} />
                            </button>
                            <button 
                                onClick={() => { setIsOpen(false); disconnect(); }} 
                                className="text-slate-400 hover:text-red-400 p-1.5 hover:bg-white/10 rounded-lg transition-colors" 
                                title="Close & Disconnect"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 flex flex-col items-center justify-center min-h-[220px] gap-5 relative">

                        {/* Settings & Voice Drawer */}
                        {showSettings ? (
                            <div className="w-full bg-slate-950/80 p-3.5 rounded-xl border border-white/10 space-y-3.5 text-left animate-in fade-in zoom-in-95 duration-150">
                                
                                {/* Interruption / Barge-in Resistance Filter */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <ShieldCheck size={13} className="text-emerald-400" />
                                            Interruption Filter
                                        </label>
                                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                            {bargeInMode === 'strict' ? 'Voice Only' : 'Balanced'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => handleSelectBargeInMode('strict')}
                                            className={`p-2 rounded-lg text-left transition-all ${
                                                bargeInMode === 'strict'
                                                    ? 'bg-emerald-600/25 border border-emerald-500 text-white font-medium'
                                                    : 'bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                                            }`}
                                        >
                                            <div className="text-[11px] font-semibold flex items-center justify-between mb-0.5">
                                                <span>Strict (Voice Only)</span>
                                                {bargeInMode === 'strict' && <Check size={13} className="text-emerald-400" />}
                                            </div>
                                            <p className="text-[9px] text-slate-400 leading-tight">Ignores ambient room noise & coughs</p>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSelectBargeInMode('balanced')}
                                            className={`p-2 rounded-lg text-left transition-all ${
                                                bargeInMode === 'balanced'
                                                    ? 'bg-emerald-600/25 border border-emerald-500 text-white font-medium'
                                                    : 'bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                                            }`}
                                        >
                                            <div className="text-[11px] font-semibold flex items-center justify-between mb-0.5">
                                                <span>Balanced</span>
                                                {bargeInMode === 'balanced' && <Check size={13} className="text-emerald-400" />}
                                            </div>
                                            <p className="text-[9px] text-slate-400 leading-tight">Easier to interrupt with soft voice</p>
                                        </button>
                                    </div>
                                </div>

                                {/* Live Voice Selection */}
                                <div className="pt-2 border-t border-white/10">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <Volume2 size={13} className="text-red-400" />
                                            Select Voice
                                        </label>
                                        <span className="text-[10px] text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                                            {selectedVoice}
                                        </span>
                                    </div>
                                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                        {GEMINI_VOICES.map((v) => (
                                            <button
                                                key={v.id}
                                                type="button"
                                                onClick={() => handleSelectVoice(v.id)}
                                                className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left text-xs transition-all ${
                                                    selectedVoice === v.id
                                                        ? 'bg-red-600/20 border border-red-500 text-white font-medium'
                                                        : 'bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                                                }`}
                                            >
                                                <div className="flex-1 pr-2">
                                                    <p className="font-semibold text-white text-xs">{v.name}</p>
                                                    <p className="text-[10px] text-slate-400 leading-tight">{v.desc}</p>
                                                </div>
                                                {selectedVoice === v.id && (
                                                    <Check size={14} className="text-red-400 shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <form onSubmit={handleSaveApiKey} className="space-y-2 pt-2 border-t border-white/10">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Gemini API Key
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="password"
                                            placeholder="Paste new key (AIzaSy...)"
                                            value={apiKeyInput}
                                            onChange={(e) => setApiKeyInput(e.target.value)}
                                            className="flex-1 px-2.5 py-1.5 text-xs bg-slate-900 border border-white/15 rounded-lg text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-red-500"
                                        />
                                        <button
                                            type="submit"
                                            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition-colors"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </form>

                                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                                    <span className="flex items-center gap-1 text-emerald-400">
                                        <ShieldCheck size={12} />
                                        Vocal-Only Interruption Active
                                    </span>
                                    <button
                                        onClick={() => setShowSettings(false)}
                                        className="text-red-400 hover:text-red-300 font-bold"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Visualizer Circle */}
                                <div className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${isConnected
                                    ? (isPaused ? 'bg-orange-500/10 shadow-[0_0_30px_rgba(249,115,22,0.2)]' : (isTalking ? 'bg-emerald-500/15 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.2)]'))
                                    : 'bg-slate-800'
                                    }`}>
                                    {isConnected && !isPaused && (
                                        <>
                                            <div className={`absolute inset-0 border-2 rounded-full ${isTalking ? 'border-emerald-500 animate-ping opacity-25' : 'border-red-500 animate-[pulse_2s_infinite] opacity-20'}`} />
                                            <div className={`absolute inset-0 border-2 rounded-full ${isTalking ? 'border-emerald-500 animate-[ping_1.5s_infinite] opacity-15' : 'border-red-500 opacity-10'}`} />
                                        </>
                                    )}

                                    {isConnected && isPaused && (
                                        <div className="absolute inset-0 border-2 border-orange-500/50 rounded-full opacity-50" />
                                    )}

                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isConnected
                                        ? (isPaused ? 'bg-orange-600 scale-95' : (isTalking ? 'bg-emerald-600 scale-110 shadow-lg shadow-emerald-500/40' : (micAudioLevel > 0.08 ? 'bg-red-500 scale-105 shadow-md shadow-red-500/40' : 'bg-red-600')))
                                        : 'bg-slate-700'
                                        }`}>
                                        {isConnected ? (
                                            isPaused ? <Pause className="text-white w-8 h-8" fill="currentColor" /> : <Volume2 className="text-white w-8 h-8" />
                                        ) : <MicOff className="text-slate-400 w-8 h-8" />}
                                    </div>
                                </div>

                                <div className="text-center w-full">
                                    {error ? (
                                        <div className="flex flex-col items-center gap-2 w-full">
                                            <p className="text-red-400 text-xs font-medium text-center leading-relaxed">{error}</p>
                                            
                                            {error.toLowerCase().includes('api key') && !showSettings ? (
                                                <div className="w-full space-y-2 mt-1">
                                                    <form onSubmit={handleSaveApiKey} className="space-y-2">
                                                        <input
                                                            type="password"
                                                            placeholder="Paste Gemini API Key (AIzaSy...)"
                                                            value={apiKeyInput}
                                                            onChange={(e) => setApiKeyInput(e.target.value)}
                                                            className="w-full px-2.5 py-1.5 text-xs bg-slate-800 border border-white/10 rounded-lg text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-red-500"
                                                        />
                                                        <button
                                                            type="submit"
                                                            className="w-full text-xs bg-red-600 hover:bg-red-500 font-bold py-1.5 rounded-lg text-white transition-colors shadow-md shadow-red-900/30"
                                                        >
                                                            Save & Connect Now
                                                        </button>
                                                    </form>
                                                    <a 
                                                        href="https://aistudio.google.com/apikey" 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="text-[10px] text-slate-400 hover:text-red-400 underline block text-center"
                                                    >
                                                        Get a free Gemini API key →
                                                    </a>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={connect}
                                                    className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-white transition-colors"
                                                >
                                                    Retry
                                                </button>
                                            )}
                                        </div>
                                    ) : isConnected ? (
                                        <div className="flex flex-col gap-1.5">
                                            <p className={`text-xs font-bold ${
                                                isPaused 
                                                    ? 'text-orange-400' 
                                                    : (isTalking ? 'text-emerald-400' : 'text-red-400 animate-pulse')
                                            }`}>
                                                {isPaused 
                                                    ? "Session Paused" 
                                                    : (isTalking 
                                                        ? "Speaking... (speak to interrupt)" 
                                                        : "Listening... (ask me anything)")}
                                            </p>
                                            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Volume2 size={11} className="text-red-400" />
                                                    {selectedVoice}
                                                </span>
                                                <span className="w-1 h-1 bg-slate-600 rounded-full" />
                                                <span className="flex items-center gap-1 text-emerald-400">
                                                    <ShieldCheck size={11} />
                                                    Smart Noise Immunity
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                                            <p className="text-slate-400 text-sm">
                                                Connecting to CE Assistant...
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {isConnected && (
                                    <div className="flex gap-2 w-full mt-1">
                                        <button
                                            onClick={togglePause}
                                            className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold border px-3 py-2.5 rounded-xl transition-all ${isPaused
                                                ? 'bg-orange-500 text-white border-orange-400 hover:bg-orange-400'
                                                : 'bg-red-600 border-red-500 text-white hover:bg-red-500 shadow-lg shadow-red-900/20'
                                                }`}
                                        >
                                            {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
                                            {isPaused ? "Resume" : "Pause"}
                                        </button>
                                        <button
                                            onClick={disconnect}
                                            className="flex-1 flex items-center justify-center gap-2 text-xs text-red-400 hover:text-red-300 font-bold border border-red-500/30 px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors"
                                        >
                                            <X size={14} />
                                            End
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    onClick={handleActivation}
                    className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 group relative
                        ${isConnected
                            ? (isPaused ? 'bg-orange-500 hover:bg-orange-400 border border-orange-300/50' : 'bg-red-600 hover:bg-red-500 border border-red-400/50 shadow-[0_0_20px_rgba(239,68,68,0.5)]')
                            : 'bg-slate-800 hover:bg-slate-700 border border-white/10'
                        }
            `}
                >
                    {/* Pulsing effect when connected but minimized */}
                    {isConnected && !isPaused && (
                        <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-30" />
                    )}

                    <div className={`absolute inset-0 rounded-full opacity-20 animate-ping group-hover:opacity-30 ${isPaused ? 'bg-orange-500' : 'bg-red-500'}`} />

                    {isConnected && isPaused ? (
                        <Pause size={24} className="text-white relative z-10" fill="currentColor" />
                    ) : (
                        <Mic size={24} className={`relative z-10 ${isConnected ? 'text-white' : 'text-red-400'}`} />
                    )}
                </button>
            )}
        </div>

        {/* Full-Screen Centered Glimpse Overlay (Rendered above floating panel stacking context) */}
        <AnimatePresence>
            {activeGlimpse && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/65 backdrop-blur-xl p-4 md:p-12 pointer-events-none"
                >
                    <motion.div
                        key={activeGlimpse.id}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-5xl max-h-full flex flex-col overflow-hidden rounded-3xl bg-slate-900/90 backdrop-blur-3xl border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.8)] pointer-events-auto inner-glow"
                    >
                        {/* Shimmer sweep */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_ease-in-out_infinite] pointer-events-none z-10" />

                        {/* Close Glimpse Button */}
                        <button
                            onClick={() => setActiveGlimpse(null)}
                            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/50 hover:bg-red-600 text-white transition-all backdrop-blur-md"
                            title="Close Glimpse"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-4 md:p-8 flex-1 flex items-center justify-center studio-stage">
                            <img
                                src={assetUrl(activeGlimpse.image)}
                                alt={activeGlimpse.name}
                                onError={(e) => {
                                    const img = e.currentTarget;
                                    const fallback = assetUrl(
                                        activeGlimpse.category === 'pump'
                                            ? '/images/perkins-pump-80.webp'
                                            : '/images/yuchai-200kw-md200.webp'
                                    );
                                    if (img.src !== fallback && !img.dataset.fallbackApplied) {
                                        img.dataset.fallbackApplied = '1';
                                        img.src = fallback;
                                    }
                                }}
                                className="w-full h-auto max-h-[60vh] object-contain drop-shadow-2xl"
                            />
                        </div>

                        <div className="px-6 py-6 md:py-8 bg-gradient-to-t from-red-900/90 to-red-800/80 text-white flex flex-col items-center text-center">
                            <p className="text-xs md:text-sm font-extrabold uppercase tracking-[0.3em] text-red-300/80 mb-2 md:mb-3">⚡ Live Product Glimpse</p>
                            <h4 className="font-bold text-2xl md:text-4xl leading-tight mb-4">{activeGlimpse.name}</h4>

                            <div className="flex items-center gap-3 mb-5">
                                <button
                                    onClick={() => {
                                        const targetHash = activeGlimpse.category === 'pump' ? '#/solutions' : '#/product';
                                        setActiveGlimpse(null);
                                        window.location.hash = targetHash;
                                    }}
                                    className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white text-slate-900 hover:bg-slate-200 transition-colors shadow-lg"
                                >
                                    View in Catalog →
                                </button>
                            </div>

                            <div className="h-1.5 w-full max-w-lg bg-black/40 rounded-full overflow-hidden">
                                <div className="h-full bg-red-400 rounded-full animate-progress" />
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
        </>
    );
};

export default VoiceAssistant;
