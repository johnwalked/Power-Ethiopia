import React from 'react';

const BackgroundEffects: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Dark Base */}
      <div className="absolute inset-0 bg-slate-950" />

      {/* Animated Gradient Orbs — they drift slowly, creating a living feel behind glass elements */}
      <div className="absolute top-[-15%] left-[40%] w-[700px] h-[500px] bg-red-500/8 blur-[140px] rounded-full opacity-50 mix-blend-screen animate-orb-1 will-change-transform" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/8 blur-[120px] rounded-full opacity-30 mix-blend-screen animate-orb-2 will-change-transform" />
      <div className="absolute top-[50%] right-[-10%] w-[400px] h-[400px] bg-orange-500/5 blur-[100px] rounded-full opacity-25 mix-blend-screen animate-orb-1 will-change-transform" style={{ animationDelay: '-8s' }} />

      {/* Grid Overlay — visible through glass elements */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />

      {/* Subtle Grain for Premium Texture */}
      <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.05\'/%3E%3C/svg%3E")' }} />
    </div>
  );
};

export default BackgroundEffects;