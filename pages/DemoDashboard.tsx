
import React from 'react';

interface DemoDashboardProps {
  onNavigate: (path: string) => void;
}

const DemoDashboard: React.FC<DemoDashboardProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 pt-44 min-h-screen">
      <div className="text-center p-10 bg-slate-900/50 rounded-2xl border border-white/10 backdrop-blur-sm animate-in fade-in zoom-in-95">
        <h2 className="text-2xl font-bold text-white mb-2">Demo Dashboard</h2>
        <p className="text-slate-400">This demo dashboard is currently in maintenance mode while we upgrade our database.</p>
        <button 
          onClick={() => onNavigate('/')} 
          className="mt-6 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
        >
          Return Home
        </button>
      </div>
    </div>
  );
};

export default DemoDashboard;
