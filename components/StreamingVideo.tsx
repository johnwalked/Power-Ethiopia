import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // If already loaded (cached), mark immediately
        if (video.readyState >= 3) {
            setIsLoaded(true);
            return;
        }

        // Force play on interaction for restrictive browsers
        const tryPlay = () => {
            video.play().catch(() => { /* silently fail */ });
        };

        video.addEventListener('canplaythrough', () => setIsLoaded(true));
        video.addEventListener('loadeddata', () => setIsLoaded(true));

        // Some mobile browsers require user interaction — try on first touch
        document.addEventListener('touchstart', tryPlay, { once: true });
        document.addEventListener('click', tryPlay, { once: true });

        // Trigger load explicitly
        video.load();

        return () => {
            document.removeEventListener('touchstart', tryPlay);
            document.removeEventListener('click', tryPlay);
        };
    }, []);

    return (
        <div className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 bg-slate-950 ${className}`}>
            {/* Static Placeholder / Poster */}
            <AnimatePresence>
                {!isLoaded && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 z-10 bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-950"
                    >
                        {poster && (
                            <img
                                src={poster}
                                alt="Video Placeholder"
                                className="w-full h-full object-cover blur-xl scale-110 opacity-50"
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Video Element */}
            <motion.video
                ref={videoRef}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                onLoadedData={() => setIsLoaded(true)}
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoaded ? overlayOpacity : 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute top-0 left-0 w-full h-full object-cover"
            >
                <source src={src} type="video/mp4" />
            </motion.video>

            {/* Polish Layers */}
            <div className="absolute inset-0 bg-slate-950/20 z-10 mix-blend-multiply" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent z-20" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-950 to-transparent z-20" />
        </div>
    );
};

export default StreamingVideo;
