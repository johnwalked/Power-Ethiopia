import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { LiveServerMessage } from "@google/genai";
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Volume2, Loader2, MessageSquare, Minimize2, Pause, Play, Key, Settings, Check, ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { GENERATORS, PUMPS } from '../lib/productData';
import { assetUrl } from '../lib/assetUtils';

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
    const [activeGlimpse, setActiveGlimpse] = useState<{ id: string; name: string; image: string } | null>(null);
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

    const { loading } = useAuth();
    const { language } = useLanguage();

    // Audio & Barge-in Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const highpassFilterRef = useRef<BiquadFilterNode | null>(null);
    const lowpassFilterRef = useRef<BiquadFilterNode | null>(null);
    const silentGainRef = useRef<GainNode | null>(null);
    
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

    // Helper: Find product by ID from local data
    const findProductById = useCallback((id: string) => {
        const gen = GENERATORS.find(g => g.id === id);
        if (gen) return { name: gen.name, image: gen.image };
        const pump = PUMPS.find(p => p.id === id);
        if (pump) return { name: pump.name, image: pump.image };

        // Fallback: loose search
        const searchStr = id.toLowerCase();
        const looseGen = GENERATORS.find(g => g.id.toLowerCase().includes(searchStr) || g.name.toLowerCase().includes(searchStr));
        if (looseGen) return { name: looseGen.name, image: looseGen.image };
        const loosePump = PUMPS.find(p => p.id.toLowerCase().includes(searchStr) || p.name.toLowerCase().includes(searchStr));
        if (loosePump) return { name: loosePump.name, image: loosePump.image };

        return null;
    }, []);

    // Helper: Decode Audio
    const decodeAudioData = async (
        data: Uint8Array,
        ctx: AudioContext,
        sampleRate: number = 24000,
        numChannels: number = 1
    ): Promise<AudioBuffer> => {
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length / numChannels;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
            }
        }
        return buffer;
    };

    // Helper: Decode Base64
    const decodeBase64 = (base64: string) => {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    };

    // Helper: Encode to Base64 (for Input)
    const encodeBase64 = (bytes: Uint8Array) => {
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    };

    const createPcmBlob = (data: Float32Array) => {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            int16[i] = Math.max(-1, Math.min(1, data[i])) * 32768;
        }
        return {
            data: encodeBase64(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000',
        };
    };

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
    const handleAudioFrame = useCallback((data: Float32Array) => {
        const len = data.length;
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

        // Update live visual audio level
        setMicAudioLevel(Math.min(1.0, rms * 6.0));

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
            const { GoogleGenAI, Modality } = await import("@google/genai");

            const ai = new GoogleGenAI({ apiKey });

            // Setup Audio Contexts
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass({ sampleRate: 24000 }); // Output rate

            // Input Context (Mic)
            const inputContext = new AudioContextClass({ sampleRate: 16000 });

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
                    systemInstruction: `You are CE Assistant (ሲኢ ረዳት), the official Senior Technical Consultant at CE Generator and Pump Factory in Addis Ababa, Ethiopia (ቃሊቲ ገብርኤል / Kality Gabriel).

COMPANY & FACTORY HERITAGE:
- Company: CE Power (branch of Guangdong MINDONG Electric Co., Ltd., established in 1958, over 65 years of electrical machinery excellence).
- Standards: ISO9001, ISO14001, CE, TUV Rheinland, and IEC certified.
- Physical Facility: Located in Kality Gabriel (ቃሊቲ ገብርኤል), Addis Ababa, Ethiopia. Direct factory assembly, sales, spare parts warehouse, and engineering service center.
- Direct Sales Hotline: 09 66 33 03 09 (ዜሮ ዘጠኝ ስልሳ ስድስት ሰላሳ ሶስት ዜሮ ሶስት ዜሮ ዘጠኝ).
- Email: info@cepower.et | Web: cepower.et.

EXACT VERIFIED IN-STOCK GENERATORS (KALITY WAREHOUSE):
• Weichai (ከባድ ኢንዱስትሪ): 200kW, 300kW, 400kW, 500kW, 600kW (Heavy duty silent canopy, 3-phase 400V, low RPM water-cooled industrial diesel engines, built for continuous heavy loading).
• Yuchai (ዩቻይ): 60kW, 80kW, 100kW, 120kW, 150kW, 200kW, 250kW, 300kW, 360kW, 400kW, 450kW (High thermal efficiency, electronic governors, low fuel consumption, long maintenance intervals).
• Yunnei (ዩኔይ): 15kW, 20kW, 30kW, 50kW, 60kW, 80kW, 100kW, 120kW (Commercial workhorse, highly affordable prime power, readily available replacement parts).
• KOFO (ኮፎ): 200kW (Robust, heavy industrial silent generator).
• Weifang (ዌይፋንግ): 50kW, 100kW, 120kW, 150kW (Proven industrial diesel generators, cost-effective prime power).
• United Power (ዩናይትድ ፓወር): 2.2kW, 3kW, 3.5kW, 5kW, 5.5kW, 6kW, 6.5kW, 7.5kW, 8.5kW, 11kW (Portable single-phase 220V with wheels/handles & compact silent 3-phase 380V models).
• Mega Power (Custom Order): Cummins KTA50 series up to 1120kW (10kV High Voltage) and 3000kW containerized power stations.

WATER PUMPS CATALOG (SPECIALIZED 80kW TO 250kW RANGE & IRRIGATION):
• Heavy-Duty Water Pumps (80kW to 250kW Range):
  - 80kW (Yuchai / Yunnei): 4" to 6" inlet/outlet, 80m max head, ~350 m³/h flow rate. Ideal for commercial agriculture, coffee and tea plantations, sugarcane irrigation, and construction dewatering.
  - 100kW (Yunnei / Weifang): 6" inlet/outlet, 85m max head, ~450 m³/h flow rate. Robust prime pump for municipal water booster stations, quarry drainage, and large irrigation canals.
  - 120kW (Yunnei): 4" to 6" inlet/outlet, 85m max head, ~380 m³/h flow rate. Heavy-duty diesel irrigation set for farmer cooperatives and large-scale farming.
  - 150kW (Weifang / Yuchai): 6" inlet/outlet, 95m max head, ~500 m³/h flow rate. High-head river water lifting, municipal distribution, and flood mitigation.
  - 180kW (Kefo / Yunnei): 6" inlet/outlet, 85m max head, ~550 m³/h flow rate. Handles heavy slurries, silt, flood control, and emergency dewatering.
  - 200kW (Weichai / Last): 6" to 8" inlet/outlet, 100m max head, ~650 m³/h flow rate. Extreme reliability for high-lift elevation transfer across Ethiopian highlands and Rift Valley.
  - 250kW (Weichai / Yuchai): 8" to 10" inlet/outlet, 110m max head, ~750-800 m³/h flow rate. Flagship high-capacity pumping for mega agricultural schemes (Awash River basin, Omo Valley), large dam sites, and industrial flood control.
• Other Available Pump Capacities:
  - Deep-well submersible pumps for boreholes (30m to 200m depth, high head for Ethiopian highlands and Rift Valley).
  - Compact portable & farm irrigation pumps: 2-inch to 4-inch (United Power 11kW, Kefo 30HP, Yunnei 40HP, Yuchai 50HP).
  - Ultra-high industrial pumps up to 600kW (Yunnei 334kW, 400kW, 600kW).

TECHNICAL SIZING & ETHIOPIAN LOCAL EXPERTISE:
• Addis Ababa Altitude Derating: Addis Ababa is at ~2,355 meters elevation. Because of thinner atmospheric air, diesel engines naturally derate by ~10-12%. Always factor in a 20-25% safety margin so the generator never trips or overheats.
• Sizing Guidance:
  - Residential Homes & Villas: United Power 2.2kW to 8.5kW (runs lights, TV, fridges, water pump).
  - Bakeries, Clinics, Coffee Shops, Supermarkets: Yunnei 15kW – 50kW, Weifang 50kW.
  - Hotels, Mid-sized Factories, Fuel Stations, Commercial Buildings: Yunnei/Yuchai/Weifang 60kW – 150kW.
  - Large Manufacturing, Hospitals, Universities, Mining, Construction: Weichai/Yuchai/KOFO 200kW – 600kW.
• Water Pump Sizing & Generator Pairing (80kW to 250kW):
  - Direct Diesel Engine Pump Sets: Our 80kW to 250kW diesel pumps can be driven directly by dedicated industrial diesel engines without requiring a separate generator, saving ~30% in capital and operating fuel costs for off-grid irrigation.
  - Electric Pump to Generator Matching (Starting Inrush Surge): When powering electric pumps from a generator, inductive motor inrush draws 2.5x to 3x running watts (or 1.5x to 2x with soft starters/VFDs):
    * 80kW Electric Pump: Pair with 150kW – 200kW generator.
    * 100kW – 120kW Electric Pump: Pair with 200kW – 250kW generator.
    * 150kW Electric Pump: Pair with 300kW – 360kW generator.
    * 180kW – 200kW Electric Pump: Pair with 400kW – 500kW generator (e.g., Weichai 400kW or 500kW).
    * 250kW Electric Pump: Pair with 500kW – 600kW generator (e.g., Weichai 500kW or 600kW).

WARRANTY, LOGISTICS & TERMS:
• Warranty: 1-year or 1000 operating hours comprehensive factory warranty covering engine and alternator.
• Delivery: FREE delivery within Addis Ababa. Fast, reliable transport arranged across all Ethiopian regional states (Oromia, Amhara, Tigray, Sidama/Hawassa, Dire Dawa, Afar, Somali, Benishangul).
• Genuine Spare Parts: 100% stocked in Kality Gabriel (filters, AVRs, injectors, controllers, gaskets).
• Automatic Transfer Switch (ATS): Optional smart ATS panels available for automatic start within 8 seconds of grid power failure.
• Payment: Bank transfer (CBE, Dashen, Awash, Telebirr), cash at Kality factory, LC for bulk distributor orders.

CONVERSATIONAL PERSONA & RULES:
- NAME: CE Assistant (ሲኢ ረዳት).
- TONE: Warm, courteous, consultative, authoritative yet natural and friendly.
- TURN-TAKING: Keep answers concise (1 to 3 short sentences per turn). Do not lecture or recite giant lists. Invite back-and-forth dialogue by asking a friendly follow-up question.
- BARGE-IN: If the customer interrupts while you are speaking, stop immediately, listen carefully, and answer their new question.
- PRIMARY FOCUS: Focus only on the person talking to you into the microphone. Ignore ambient chatter in the room.
- LANGUAGES:
  • Fluent Amharic (አማርኛ): Use polite, warm phrasing (e.g. "እንኳን ደህና መጡ! እኔ የሲኢ ፓወር ረዳት ነኝ። በምን ላግዝዎት?").
  • Fluent English.
  • Naturally match user if they speak Afaan Oromoo, Tigrinya, or Chinese.
  • Current UI Language: ${language}.

GLIMPSE FEATURE:
- Whenever the user asks to see a product or expresses interest in a specific generator or pump model, call the "show_product_image" tool. 
- This will show a 10-second floating glimpse of the product on their screen while you introduce it.`,
                    tools: [{
                        googleSearch: {}
                    }, {
                        functionDeclarations: [
                            {
                                name: "show_product_image",
                                description: "Display a 10-second floating glimpse of a specific product image.",
                                parameters: {
                                    type: "object" as any,
                                    properties: {
                                        productId: {
                                            type: "string" as any,
                                            description: "The unique ID of the product to show (e.g., 'weichai-500kw', 'yuchai-80kw-pump')."
                                        },
                                        productName: {
                                            type: "string" as any,
                                            description: "The display name of the product."
                                        },
                                        imageUrl: {
                                            type: "string" as any,
                                            description: "The relative path to the image (e.g., '/images/yuchai-200kw-md200.webp')."
                                        }
                                    },
                                    required: ["productId", "productName", "imageUrl"]
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
                                const workletCode = `
                                    class LiveMicProcessor extends AudioWorkletProcessor {
                                        process(inputs) {
                                            const input = inputs[0];
                                            if (input && input[0]) {
                                                this.port.postMessage(input[0]);
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
                    onmessage: async (msg: LiveServerMessage) => {
                        // Handle Audio Output from Gemini Live
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData && audioContextRef.current) {
                            isTalkingRef.current = true;
                            setIsTalking(true);
                            const ctx = audioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

                            const buffer = await decodeAudioData(
                                decodeBase64(audioData),
                                ctx,
                                24000
                            );

                            const source = ctx.createBufferSource();
                            source.buffer = buffer;
                            source.connect(ctx.destination);

                            // Natural 1.0x human cadence
                            const playbackRate = 1.0;
                            source.playbackRate.value = playbackRate;

                            source.onended = () => {
                                const idx = audioQueueRef.current.indexOf(source);
                                if (idx > -1) {
                                    audioQueueRef.current.splice(idx, 1);
                                }
                                if (audioQueueRef.current.length === 0 || (ctx && ctx.currentTime >= nextStartTimeRef.current - 0.08)) {
                                    isTalkingRef.current = false;
                                    setIsTalking(false);
                                }
                            };

                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += buffer.duration / playbackRate;
                            audioQueueRef.current.push(source);
                        }

                        // Handle Tool Calls (Glimpse Feature)
                        const toolCallMsg = (msg as any).toolCall;
                        if (toolCallMsg) {
                            console.log('[CE Assistant] Tool call received:', JSON.stringify(toolCallMsg));
                            const functionCalls = toolCallMsg.functionCalls || [];
                            const showImageCall = functionCalls.find((fc: any) => fc.name === 'show_product_image');
                            if (showImageCall) {
                                const { productId, productName, imageUrl } = showImageCall.args || {};
                                console.log('[CE Assistant] Showing glimpse for:', productId, productName, imageUrl);

                                // Prefer verified local catalog data & image when matched
                                const localProduct = findProductById(productId);
                                const finalName = localProduct?.name || productName || productId;
                                const finalImage = localProduct?.image || imageUrl || '/images/yuchai-200kw-md200.webp';

                                // Clear any previous timer
                                if (glimpseTimerRef.current) clearTimeout(glimpseTimerRef.current);

                                setActiveGlimpse({ id: productId, name: finalName, image: finalImage });

                                // 10-second auto-dismiss
                                glimpseTimerRef.current = setTimeout(() => {
                                    setActiveGlimpse(null);
                                    glimpseTimerRef.current = null;
                                }, 10000);

                                // Send tool response to let the model continue speaking
                                sessionPromiseRef.current?.then(session => {
                                    session.sendToolResponse({
                                        functionResponses: [{
                                            name: 'show_product_image',
                                            response: { displayed: true, productId },
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
        if (loading) return;

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

        // Cleanup Mic & Audio Streams
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
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

    if (loading) return null;

    return (
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

            {/* Full-Screen Centered Glimpse Overlay */}
            <AnimatePresence>
                {activeGlimpse && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 md:p-12 pointer-events-none"
                    >
                        <motion.div
                            key={activeGlimpse.id}
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-5xl max-h-full flex flex-col overflow-hidden rounded-3xl bg-slate-900/50 backdrop-blur-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] pointer-events-auto inner-glow"
                        >
                            {/* Shimmer sweep */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_ease-in-out_infinite] pointer-events-none z-10" />

                            {/* Close Glimpse Button */}
                            <button
                                onClick={() => setActiveGlimpse(null)}
                                className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/40 hover:bg-red-600 text-white transition-all backdrop-blur-md"
                                title="Close Glimpse"
                            >
                                <X size={20} />
                            </button>

                            <div className="p-4 md:p-8 flex-1 flex items-center justify-center bg-slate-800/20">
                                <img
                                    src={assetUrl(activeGlimpse.image)}
                                    alt={activeGlimpse.name}
                                    className="w-full h-auto max-h-[65vh] object-contain drop-shadow-2xl"
                                />
                            </div>

                            <div className="px-6 py-6 md:py-8 bg-gradient-to-t from-red-900/90 to-red-800/80 text-white flex flex-col items-center text-center">
                                <p className="text-xs md:text-sm font-extrabold uppercase tracking-[0.3em] text-red-300/80 mb-2 md:mb-3">⚡ Live Product Glimpse</p>
                                <h4 className="font-bold text-2xl md:text-4xl leading-tight mb-4">{activeGlimpse.name}</h4>

                                <div className="flex items-center gap-3 mb-5">
                                    <button
                                        onClick={() => {
                                            setActiveGlimpse(null);
                                            window.location.hash = '#/product';
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
    );
};

export default VoiceAssistant;
