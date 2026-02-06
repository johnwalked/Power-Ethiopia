
import React, { useState, useRef, useEffect } from 'react';
import type { LiveServerMessage } from "@google/genai";
import { Mic, MicOff, X, Volume2, Loader2, MessageSquare, Lock, Minimize2, Pause, Play } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';

const VoiceAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isTalking, setIsTalking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [accessDenied, setAccessDenied] = useState(false);

    const { user, loading } = useAuth();
    const { language } = useLanguage();

    // Audio Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
    const gainNodeRef = useRef<GainNode | null>(null);

    // Control Refs
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const isPausedRef = useRef(false);

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

    const connect = async () => {
        if (!process.env.API_KEY) {
            setError("API Key missing");
            return;
        }

        setError(null);
        setIsConnected(true); // Optimistic UI
        setIsPaused(false);
        isPausedRef.current = false;

        // Reset audio timing cursors for new session
        nextStartTimeRef.current = 0;
        audioQueueRef.current = [];

        try {
            // Dynamic Import for Performance Optimization
            const { GoogleGenAI, Modality } = await import("@google/genai");

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            // Setup Audio Contexts
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass({ sampleRate: 24000 }); // Output rate

            // Setup Output Gain (to increase volume)
            const gainNode = audioContextRef.current.createGain();
            gainNode.gain.value = 1.5; // Adjusted to 1.5x based on user feedback (previous was 2.0x)
            gainNode.connect(audioContextRef.current.destination);
            gainNodeRef.current = gainNode;

            // Input Context (Mic)
            const inputContext = new AudioContextClass({ sampleRate: 16000 });

            // Get Mic Stream with explicit noise suppression
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
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }
                    },
                    systemInstruction: `You are the Lead Technical Sales Engineer for "CE Generator and Pump factory".
                    Our factory is in Kality Gabriel (ቃሊቲ ገብርኤል).
                    We also sell all kind of pumps.
                    
                    CORE PERSONA:
                    - **WORLD'S #1 SALES EXPERT**: You are the smooth, confident, and highly persuasive expert. You don't just answer questions; you *close deals* with charm.
                    - **AUTHORITY**: You are the "Engine Expert". You know every bolt and wire. Speak with absolute confidence.
                    - **VIBE**: Professional but relaxed, like a wealthy and successful business partner.
                    - **CRITICAL**: Keep your introduction **EXTREMELY SHORT** and **ON POINT**. Do not ramble.
                    - **CONTACT**: Phone: 09 66 33 03 09 (ዜሮ ዘጠኝ ስልሳ ስድስት ሰላሳ ሶስት ዜሮ ሶስት ዜሮ ዘጠኝ).
                    
                    [DISTRIBUTOR PORTAL]
                    - The **Distributor Login** (የአከፋፋይ መግቢያ) in our navigation menu is the primary portal for our partners.
                    - Partners can login there to access detailed technical specifications, wholesale pricing, and availability records.
                    - If asked about logins or partnerships, refer them to the "Distributor Login" button in the navigation.

                    [PRODUCT INVENTORY KNOWLEDGE - LIVE STOCK JAN 2026]
                    - **Yunnei**: 600kW(2), 400kW(1), 334kW(1), 120kW(4), 100kW(100), 80kW(5), 77kW(2), 60kW(7), 55kW(2), 38kW(2), 25kW(3), 23.1kW(1), 20kW(3).
                    - **Weichai**: 400kW(2), 353kW(4), 330kW(2), 275kW(1).
                    - **Last**: 200kW(2), 160kW(2), 100kW(10), 75kW(6), 40kW(1), 25kW(4).
                    - **Kefo**: 180kW(2), 150kW(1), 120kW(4).
                    - **Yuchai**: 250kW(1), 200kW(2), 150kW(12), 120kW(15), 92kW(15).
                    - **United Power**: 11kW Silent(18), 8kW(5), 7kW(5).
                    
                    [TECHNICAL FOUNDATION]
                    - Established in 1958, CE Power (branch of Guangdong MINDONG Electric Co., Ltd.) has over 60 years of history.
                    - Manufacturing Standards: ISO9001, ISO14001, CE, TUV Rheinland, and IEC certified.
                    
                    [GOLD REFINEMENT SPECIALIZATION]
                    - Recommend **Yuchai 6-Piston** series and **Yunnei** for extreme durability in mining conditions.
                    - Recommend **Gold Refinement Slurry Pumps** (High Head) for gold washing processes.
                    
                    [LANGUAGE PROTOCOL]
                    - **SEAMLESS SWITCHING**: You MUST automatically detect the language the user is speaking and respond in that SAME language immediately.
                    - **MULTI-LINGUAL**: Be perfectly fluent in Amharic, English, Tigrinya, Afaan Oromoo, and Chinese.
                    - **NO FRICTION**: Never ask the user to switch languages. Simply adapt and follow their lead.
                    - Current UI Context: ${language} (Use this as a starting point, but let the user's voice lead).
                    - If speaking Amharic, use natural, flowing native terms. No robotic translation.`,
                },
                callbacks: {
                    onopen: () => {
                        console.log("Session Opened");
                        // Start Mic Stream processing
                        sourceRef.current = inputContext.createMediaStreamSource(stream);
                        processorRef.current = inputContext.createScriptProcessor(4096, 1, 1);

                        processorRef.current.onaudioprocess = (e) => {
                            // Skip sending audio if paused
                            if (isPausedRef.current) return;

                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcmBlob = createPcmBlob(inputData);

                            sessionPromiseRef.current?.then(session => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };

                        sourceRef.current.connect(processorRef.current);
                        processorRef.current.connect(inputContext.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        // Handle Audio Output
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData && audioContextRef.current) {
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

                            // Connect to GainNode for volume boost
                            if (gainNodeRef.current) {
                                source.connect(gainNodeRef.current);
                            } else {
                                source.connect(ctx.destination);
                            }

                            // Apply 1.05x Speed (Slightly faster but natural)
                            const playbackRate = 1.05;
                            source.playbackRate.value = playbackRate;

                            source.onended = () => {
                                if (ctx.currentTime >= nextStartTimeRef.current - 0.1) {
                                    setIsTalking(false);
                                }
                            };

                            source.start(nextStartTimeRef.current);
                            // Adjust duration calculation for playback rate
                            nextStartTimeRef.current += buffer.duration / playbackRate;
                            audioQueueRef.current.push(source);
                        }

                        // Handle Interruption
                        if (msg.serverContent?.interrupted) {
                            audioQueueRef.current.forEach(s => {
                                try { s.stop(); } catch (e) { }
                            });
                            audioQueueRef.current = [];
                            nextStartTimeRef.current = 0;
                            setIsTalking(false);
                        }
                    },
                    onclose: () => {
                        console.log("Session Closed");
                        setIsConnected(false);
                        setIsTalking(false);
                        setIsPaused(false);
                        isPausedRef.current = false;
                    },
                    onerror: (err) => {
                        console.error("Session Error", err);
                        setError("Service unavailable. Please try again.");
                        setIsConnected(false);
                        setIsPaused(false);
                    }
                }
            });

            sessionPromiseRef.current = sessionPromise;
            // Wait for connection to actually establish to catch initial errors
            await sessionPromise;

        } catch (err) {
            console.error("Connection failed", err);
            setError("Connection failed. Please check your network.");
            disconnect();
        }
    };

    const handleActivation = () => {
        if (loading) return;

        if (!user) {
            // Trigger Access Denied Behavior
            setAccessDenied(true);

            // Native Text-to-Speech
            const utterance = new SpeechSynthesisUtterance("Only registered users can access Digital John.");
            utterance.rate = 1.1;
            utterance.pitch = 0.8; // Lower pitch for access denied message too
            window.speechSynthesis.speak(utterance);

            // Reset visual state after 3 seconds
            setTimeout(() => setAccessDenied(false), 3000);
            return;
        }

        // If connected but minimized, just open UI
        if (isConnected) {
            setIsOpen(true);
            return;
        }

        setIsOpen(true);
        // Automatically start the session upon opening the UI
        connect();
    };

    const togglePause = async () => {
        const newState = !isPaused;
        setIsPaused(newState);
        isPausedRef.current = newState;

        // Also suspend/resume the output context to stop/start AI voice immediately
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
        setIsPaused(false);
        isPausedRef.current = false;

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

        // Cleanup Audio
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
        gainNodeRef.current = null;

        // Reset queues and timers
        nextStartTimeRef.current = 0;
        audioQueueRef.current = [];
    };

    if (loading) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">

            {/* Expanded Interface (Authenticated Only) */}
            {isOpen && user && (
                <div className="bg-slate-900/30 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 w-80 overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
                    <div className="bg-white/5 p-4 flex justify-between items-center text-white border-b border-white/10">
                        <h3 className="font-bold flex items-center gap-2">
                            <MessageSquare size={16} className="text-emerald-400" />
                            Digital John (ዲጂታል ጆን)
                        </h3>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded" title="Minimize">
                                <Minimize2 size={16} />
                            </button>
                            <button onClick={() => { setIsOpen(false); disconnect(); }} className="text-slate-400 hover:text-red-400 p-1 hover:bg-white/10 rounded" title="Close & Disconnect">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 flex flex-col items-center justify-center min-h-[200px] gap-6 relative">

                        {/* Visualizer Circle */}
                        <div className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${isConnected
                            ? (isPaused ? 'bg-amber-500/10 shadow-[0_0_30px_rgba(245,158,11,0.2)]' : 'bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]')
                            : 'bg-slate-800'
                            }`}>
                            {isConnected && !isPaused && (
                                <>
                                    <div className={`absolute inset-0 border-2 border-emerald-500 rounded-full ${isTalking ? 'animate-ping opacity-20' : 'opacity-0'}`} />
                                    <div className={`absolute inset-0 border-2 border-emerald-500 rounded-full ${isTalking ? 'animate-[ping_1.5s_infinite] opacity-10' : 'opacity-0'}`} />
                                </>
                            )}

                            {isConnected && isPaused && (
                                <div className="absolute inset-0 border-2 border-amber-500/50 rounded-full opacity-50" />
                            )}

                            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isConnected
                                ? (isPaused ? 'bg-amber-600 scale-95' : (isTalking ? 'bg-emerald-500 scale-110' : 'bg-emerald-600'))
                                : 'bg-slate-700'
                                }`}>
                                {isConnected ? (
                                    isPaused ? <Pause className="text-white w-8 h-8" fill="currentColor" /> : <Volume2 className="text-white w-8 h-8" />
                                ) : <MicOff className="text-slate-400 w-8 h-8" />}
                            </div>
                        </div>

                        <div className="text-center">
                            {error ? (
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-red-400 text-sm font-medium">{error}</p>
                                    <button
                                        onClick={connect}
                                        className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-white transition-colors"
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : isConnected ? (
                                <div className="flex flex-col gap-1">
                                    <p className={`text-sm font-medium ${isPaused ? 'text-amber-400' : 'text-emerald-400 animate-pulse'}`}>
                                        {isPaused ? "Session Paused" : (isTalking ? "Speaking..." : "Listening...")}
                                    </p>
                                    <p className="text-slate-500 text-xs flex items-center justify-center gap-1.5">
                                        <span>Mode: {language}</span>
                                        <span className="w-1 h-1 bg-slate-500 rounded-full" />
                                        <span>Consultative AI</span>
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                                    <p className="text-slate-400 text-sm">
                                        Connecting to Digital John...
                                    </p>
                                </div>
                            )}
                        </div>

                        {isConnected && (
                            <div className="flex gap-2 w-full mt-2">
                                <button
                                    onClick={togglePause}
                                    className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold border px-3 py-2.5 rounded-xl transition-all ${isPaused
                                        ? 'bg-amber-500 text-white border-amber-400 hover:bg-amber-400'
                                        : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20'
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
                    </div>
                </div>
            )}

            {/* Access Denied Bubble */}
            {accessDenied && (
                <div className="absolute bottom-20 right-0 bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl whitespace-nowrap animate-in fade-in slide-in-from-right-4 flex items-center gap-2 z-[110] border border-red-500/50">
                    <Lock size={12} className="text-red-400" />
                    Only registered users can access Digital John.
                    <div className="absolute -bottom-1 right-6 w-3 h-3 bg-slate-800 rotate-45 border-r border-b border-red-500/50" />
                </div>
            )}

            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    onClick={handleActivation}
                    className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 group relative
                ${accessDenied ? 'bg-red-600 hover:bg-red-500 animate-shake' :
                            isConnected
                                ? (isPaused ? 'bg-amber-500 hover:bg-amber-400 border border-amber-300/50' : 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.5)]')
                                : 'bg-slate-800 hover:bg-slate-700 border border-white/10'
                        }
            `}
                >
                    {/* Pulsing effect when connected but minimized */}
                    {isConnected && !isPaused && !accessDenied && (
                        <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-30" />
                    )}

                    <div className={`absolute inset-0 rounded-full opacity-20 animate-ping group-hover:opacity-30 ${accessDenied ? 'bg-red-500' : (isPaused ? 'bg-amber-500' : 'bg-emerald-500')}`} />

                    {accessDenied ? (
                        <Lock size={24} className="text-white relative z-10" />
                    ) : isConnected && isPaused ? (
                        <Pause size={24} className="text-white relative z-10" fill="currentColor" />
                    ) : (
                        <Mic size={24} className={`relative z-10 ${isConnected ? 'text-white' : 'text-emerald-400'}`} />
                    )}
                </button>
            )}
        </div>
    );
};

export default VoiceAssistant;
