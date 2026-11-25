import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';
import { assetUrl } from '../lib/assetUtils';

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
    const resolvedSrc = assetUrl(src);
    const resolvedPoster = poster ? assetUrl(poster) : undefined;
    const [isLoaded, setIsLoaded] = useState(false);
    const [showSpinner, setShowSpinner] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Only show brief subtle buffering hint after 350ms, auto-clear after 2.5s if connection is slow
        const spinnerDelay = setTimeout(() => {
            if (!isLoaded) setShowSpinner(true);
        }, 350);
        const maxWait = setTimeout(() => setShowSpinner(false), 2500);

        if (video.readyState >= 3) {
            setIsLoaded(true);
            setShowSpinner(false);
        }

        const handleCanPlay = () => {
            setShowSpinner(false);
            setIsLoaded(true);
        };
        const handleError = () => {
            setShowSpinner(false);
        };

        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('playing', handleCanPlay);
        video.addEventListener('error', handleError);

        const safePlay = () => {
            try {
                const res = video.play();
                if (res && typeof res.catch === 'function') {
                    res.catch(() => { /* Auto-play or playback blocked */ });
                }
            } catch {
                /* Silently ignore */
            }
        };

        if (resolvedSrc.endsWith('.m3u8')) {
            if (Hls.isSupported()) {
                const hls = new Hls({
                    capLevelToPlayerSize: true,
                    autoStartLoad: true,
                    startLevel: -1,
                    debug: false,
                });
                hls.loadSource(resolvedSrc);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    safePlay();
                });
                hlsRef.current = hls;
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = resolvedSrc;
            }
        } else {
            if (!video.src.includes(resolvedSrc)) {
                video.src = resolvedSrc;
            }
            safePlay();
        }

        const tryPlay = () => {
            safePlay();
        };

        document.addEventListener('touchstart', tryPlay, { once: true });
        document.addEventListener('click', tryPlay, { once: true });

        return () => {
            clearTimeout(spinnerDelay);
            clearTimeout(maxWait);
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('playing', handleCanPlay);
            video.removeEventListener('error', handleError);
            document.removeEventListener('touchstart', tryPlay);
            document.removeEventListener('click', tryPlay);
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, [resolvedSrc]);

    return (
        <div className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 bg-slate-950 ${className}`}>
            {/* Dynamic Industrial Ambient Fallback Backdrop (instant LCP, never blank even before video streams) */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(239,68,68,0.16),transparent_60%),radial-gradient(ellipse_at_bottom_right,_rgba(59,130,246,0.12),transparent_60%)]" />
            {resolvedPoster && !isLoaded && (
                <img
                    src={resolvedPoster}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover opacity-35 scale-105 blur-sm"
                />
            )}

            {/* Non-blocking subtle spinner while initial stream handshakes */}
            <AnimatePresence>
                {!isLoaded && showSpinner && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        className="absolute top-28 right-8 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10"
                    >
                        <div className="w-3.5 h-3.5 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Video Element */}
            <motion.video
                ref={videoRef}
                src={!resolvedSrc.endsWith('.m3u8') ? resolvedSrc : undefined}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoaded ? overlayOpacity : 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="absolute top-0 left-0 w-full h-full object-cover"
            />

            {/* Polish Layers */}
            <div className="absolute inset-0 bg-slate-950/25 z-10 mix-blend-multiply" />
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent z-20" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-950 to-transparent z-20" />
        </div>
    );
};

export default StreamingVideo;

