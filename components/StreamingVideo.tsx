import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';

interface StreamingVideoProps {
    src: string;
    poster?: string;
    className?: string;
    overlayOpacity?: number;
}

const StreamingVideo: React.FC<StreamingVideoProps> = ({
    src,
    poster,
    className = "",
    overlayOpacity = 0.6
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isBuffering, setIsBuffering] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (video.readyState >= 3) {
            setIsLoaded(true);
            setIsBuffering(false);
        }

        const handleLoadStart = () => setIsBuffering(true);
        const handleCanPlay = () => {
            setIsBuffering(false);
            setIsLoaded(true);
        };
        const handleWaiting = () => setIsBuffering(true);
        const handlePlaying = () => setIsBuffering(false);

        video.addEventListener('loadstart', handleLoadStart);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('playing', handlePlaying);

        if (src.endsWith('.m3u8')) {
            if (Hls.isSupported()) {
                const hls = new Hls({
                    capLevelToPlayerSize: true,
                    autoStartLoad: true,
                    startLevel: -1,
                    debug: false,
                });
                hls.loadSource(src);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(() => { /* Auto-play blocked */ });
                });
                hlsRef.current = hls;
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support (Safari)
                video.src = src;
            }
        } else {
            // Fallback to standard MP4
            if (!video.src.includes(src)) {
                video.src = src;
            }
            video.play().catch(() => { /* silently fail */ });
        }

        // Force play on interaction for restrictive browsers
        const tryPlay = () => {
            video.play().catch(() => { /* silently fail */ });
        };

        document.addEventListener('touchstart', tryPlay, { once: true });
        document.addEventListener('click', tryPlay, { once: true });

        return () => {
            video.removeEventListener('loadstart', handleLoadStart);
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('waiting', handleWaiting);
            video.removeEventListener('playing', handlePlaying);
            document.removeEventListener('touchstart', tryPlay);
            document.removeEventListener('click', tryPlay);
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, [src]);

    return (
        <div className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 bg-slate-950 ${className}`}>
            {/* YouTube-style Buffering/Loading Overlay */}
            <AnimatePresence>
                {(!isLoaded || isBuffering) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
                    >
                        {/* Shimmer Effect / Poster Fallback */}
                        {!isLoaded && poster && (
                            <motion.img
                                src={poster}
                                alt="Video Placeholder"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.3 }}
                                className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110"
                            />
                        )}

                        {/* Subtle Loading Spinner (YouTube Style) */}
                        <div className="relative w-12 h-12">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="w-full h-full border-2 border-red-500/20 border-t-red-500 rounded-full"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Video Element */}
            <motion.video
                ref={videoRef}
                src={!src.endsWith('.m3u8') ? src : undefined}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{
                    opacity: isLoaded ? overlayOpacity : 0,
                    filter: isLoaded ? 'blur(0px)' : 'blur(10px)',
                    scale: isLoaded ? 1 : 1.1
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute top-0 left-0 w-full h-full object-cover"
            />

            {/* Polish Layers */}
            <div className="absolute inset-0 bg-slate-950/20 z-10 mix-blend-multiply" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent z-20" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-950 to-transparent z-20" />

            {/* Grain Overlay for Premium Feel */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
        </div>
    );
};

export default StreamingVideo;

