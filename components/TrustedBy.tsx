
import React from 'react';
import { Hammer, Tractor, HardHat, Warehouse, Truck } from 'lucide-react';

const TrustedBy: React.FC = () => {
  return (
    <section className="py-10 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p className="text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest">Powering industry leaders</p>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-40 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0">
           {/* Fake Logo 1 */}
           <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
             <Hammer className="w-6 h-6" /> BuildRight
           </div>
           {/* Fake Logo 2 */}
           <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
             <Tractor className="w-6 h-6" /> AgriGrow
           </div>
           {/* Fake Logo 3 */}
           <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
             <HardHat className="w-6 h-6" /> CoreConstruct
           </div>
           {/* Fake Logo 4 */}
           <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
             <Warehouse className="w-6 h-6" /> ProStorage
           </div>
           {/* Fake Logo 5 */}
           <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
             <Truck className="w-6 h-6" /> HaulFast
           </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;
