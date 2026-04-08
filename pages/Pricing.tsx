
import React from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Shield, Wrench, Truck, Phone, ArrowRight, Star } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';

interface PageProps {
  onNavigate: (path: string) => void;
}

const Pricing: React.FC<PageProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const t = translations[language];

  const plans = t.pricing.plans.map((plan: any, index: number) => ({
    ...plan,
    icon: index === 0 ? <Zap size={20} /> : index === 1 ? <Shield size={20} /> : <Star size={20} />,
    ctaPath: index === 2 ? '/support' : '/product',
    highlight: index === 1
  }));

  const services = t.pricing.services.map((service: any, index: number) => ({
    ...service,
    icon: index === 0 ? <Truck size={24} /> : index === 1 ? <Wrench size={24} /> : index === 2 ? <Shield size={24} /> : <Phone size={24} />
  }));

  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen">

      {/* Header */}
      <motion.div {...fadeUp} transition={{ duration: 0.6 }} className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-6">
          <span className="flex h-2 w-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[11px] font-bold text-red-400 tracking-widest uppercase">{t.pricing.badge}</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
          {t.pricing.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-200">{t.pricing.titleSpan}</span>
        </h1>
        <p className="text-slate-400 text-base md:text-lg leading-relaxed">
          {t.pricing.subtitle}
        </p>
      </motion.div>

      {/* Pricing Tiers */}
      <div className="grid md:grid-cols-3 gap-6 mb-20">
        {plans.map((plan, index) => (
          <motion.div
            key={index}
            {...fadeUp}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`relative flex flex-col p-6 md:p-8 rounded-2xl transition-all duration-500 ${
              plan.highlight
                ? 'glass-heavy ring-1 ring-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.1)]'
                : 'glass-card'
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-red-900/40">
                {t.pricing.popular}
              </div>
            )}

            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${plan.highlight ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
              {plan.icon}
            </div>

            <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
            <p className="text-slate-500 text-sm mb-4">{plan.tagline}</p>

            <div className="mb-6">
              <span className="text-3xl font-extrabold text-white">{plan.power}</span>
              <span className="text-slate-500 text-sm ml-2">{t.pricing.range}</span>
            </div>

            <div className="flex-1 space-y-3 mb-8">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? 'text-red-500' : 'text-slate-500'}`} />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate(plan.ctaPath)}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                plan.highlight
                  ? 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-900/30 hover:-translate-y-0.5'
                  : 'glass text-slate-200 hover:text-white hover:border-red-500/20'
              }`}
            >
              {plan.cta} <ArrowRight size={16} />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Services Grid */}
      <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.3 }} className="mb-16">
        <h2 className="text-2xl font-bold text-white text-center mb-10">
          {t.pricing.included} <span className="text-red-500">{t.pricing.includedSpan}</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {services.map((s, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 md:p-6 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/10">
                {s.icon}
              </div>
              <h3 className="font-bold text-white text-sm">{s.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA Banner */}
      <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.4 }} className="glass-heavy rounded-2xl p-8 md:p-12 text-center max-w-3xl mx-auto">
        <h3 className="font-bold text-white text-xl mb-3">{t.pricing.ctaBannerTitle}</h3>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          {t.pricing.ctaBannerDesc}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="tel:+251966330309"
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-red-900/30 flex items-center justify-center gap-2"
          >
            <Phone size={16} /> {t.pricing.callUs}
          </a>
          <button
            onClick={() => onNavigate('/support')}
            className="px-6 py-3 glass text-slate-200 hover:text-white font-bold rounded-xl text-sm transition-all"
          >
            {t.pricing.contactSupport}
          </button>
        </div>
      </motion.div>
    </section>
  );
};

export default Pricing;
