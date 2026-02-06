
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Wrench, Clock, Zap, Leaf, Award } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => {
  return (
    <div className={`group p-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 hover:border-emerald-500/30 ${delay}`}>
      <div className="w-12 h-12 mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-500 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.1)]">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-100 mb-3 group-hover:text-emerald-400 transition-colors">
        {title}
      </h3>
      <p className="text-slate-400 leading-relaxed text-sm font-medium">
        {description}
      </p>
    </div>
  );
};

const Features: React.FC = () => {
  const features = [
    {
      icon: <Award className="w-6 h-6" />,
      title: "Commercial Grade",
      description: "Built with reinforced steel frames and heavy-duty components to withstand the toughest jobsites.",
      delay: "delay-100"
    },
    {
      icon: <Leaf className="w-6 h-6" />,
      title: "Eco-Efficiency",
      description: "Our OHV engines are designed for maximum fuel efficiency and lower emissions.",
      delay: "delay-200"
    },
    {
      icon: <Wrench className="w-6 h-6" />,
      title: "Easy Maintenance",
      description: "Accessible oil drain points, air filters, and spark plugs make routine maintenance a breeze.",
      delay: "delay-300"
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "3-Year Warranty",
      description: "We stand behind our power equipment with a comprehensive bumper-to-bumper warranty.",
      delay: "delay-[400ms]"
    }
  ];

  return (
    <section id="features" className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Engineered for Endurance
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Whether you are pumping water from a basement or powering a construction site, CE Power delivers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <FeatureCard 
              key={idx}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={feature.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
