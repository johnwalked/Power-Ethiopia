
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Phone, MapPin, MessageCircle, Mail, ChevronDown, ChevronUp, Wrench, Truck, Shield, Clock, Zap } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';

interface PageProps {
  onNavigate: (path: string) => void;
}

const Support: React.FC<PageProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const t = translations[language];

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = t.support.faqs;
  const supportCards = [
    {
      icon: <Phone size={22} />,
      title: t.support.supportCards[0].title,
      desc: t.support.supportCards[0].desc,
      action: "09 66 33 03 09",
      href: "tel:+251966330309",
      color: "red"
    },
    {
      icon: <MessageCircle size={22} />,
      title: t.support.supportCards[1].title,
      desc: t.support.supportCards[1].desc,
      action: t.support.action,
      href: "https://wa.me/251966330309",
      color: "green"
    },
    {
      icon: <Mail size={22} />,
      title: t.support.supportCards[2].title,
      desc: t.support.supportCards[2].desc,
      action: "info@cepower.et",
      href: "mailto:info@cepower.et",
      color: "blue"
    },
  ];

  const services = t.support.servicesData.map((s: any, i: number) => ({
    ...s,
    icon: i === 0 ? <Wrench size={20} /> : i === 1 ? <Truck size={20} /> : i === 2 ? <Shield size={20} /> : <Clock size={20} />
  }));

  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <section className="pt-32 pb-20 px-6 max-w-6xl mx-auto min-h-screen">

      {/* Header */}
      <motion.div {...fadeUp} transition={{ duration: 0.6 }} className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-6">
          <Zap size={14} className="text-red-400" />
          <span className="text-[11px] font-bold text-red-400 tracking-widest uppercase">{t.support.badge}</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
          {t.support.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-200">{t.support.titleSpan}</span>
        </h1>
        <div className="max-w-xl mx-auto relative mt-8">
          <input
            type="text"
            placeholder={t.support.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl glass-input text-white placeholder:text-slate-500 outline-none text-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
        </div>
      </motion.div>

      {/* Contact Cards */}
      <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.1 }} className="grid md:grid-cols-3 gap-4 mb-16">
        {supportCards.map((card, i) => (
          <a
            key={i}
            href={card.href}
            target={card.href.startsWith('http') ? '_blank' : undefined}
            rel={card.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="glass-card rounded-2xl p-6 group cursor-pointer flex flex-col"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 border transition-colors ${
              card.color === 'red' ? 'bg-red-500/10 text-red-400 border-red-500/10 group-hover:bg-red-500 group-hover:text-white' :
              card.color === 'green' ? 'bg-green-500/10 text-green-400 border-green-500/10 group-hover:bg-green-500 group-hover:text-white' :
              'bg-blue-500/10 text-blue-400 border-blue-500/10 group-hover:bg-blue-500 group-hover:text-white'
            }`}>
              {card.icon}
            </div>
            <h3 className="font-bold text-white mb-1">{card.title}</h3>
            <p className="text-sm text-slate-500 mb-4 flex-1">{card.desc}</p>
            <span className={`text-sm font-bold ${
              card.color === 'red' ? 'text-red-400' : card.color === 'green' ? 'text-green-400' : 'text-blue-400'
            }`}>
              {card.action} →
            </span>
          </a>
        ))}
      </motion.div>

      {/* Services */}
      <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.2 }} className="mb-16">
        <h2 className="text-xl font-bold text-white text-center mb-8">{t.support.servicesTitle} <span className="text-red-500">{t.support.servicesTitleSpan}</span></h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {services.map((s, i) => (
            <div key={i} className="glass rounded-xl p-4 md:p-5 text-center flex flex-col items-center gap-2">
              <div className="text-red-400">{s.icon}</div>
              <h3 className="font-bold text-white text-sm">{s.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* FAQs */}
      <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.3 }} className="max-w-3xl mx-auto mb-16">
        <h2 className="text-xl font-bold text-white text-center mb-8">
          {t.support.faqTitle} <span className="text-red-500">{t.support.faqTitleSpan}</span>
        </h2>
        <div className="space-y-3">
          {filteredFaqs.map((faq, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
              >
                <h3 className="font-bold text-white text-sm flex-1">{faq.q}</h3>
                {openFaq === i ? <ChevronUp size={18} className="text-red-500 shrink-0" /> : <ChevronDown size={18} className="text-slate-500 shrink-0" />}
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-3">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          {filteredFaqs.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Search size={32} className="mx-auto mb-3 opacity-50" />
              <p>{t.support.noQuestions}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Location */}
      <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.4 }} className="glass-heavy rounded-2xl p-8 md:p-12 text-center max-w-3xl mx-auto">
        <MapPin size={28} className="text-red-500 mx-auto mb-4" />
        <h3 className="font-bold text-white text-xl mb-2">{t.support.visitFactory}</h3>
        <p className="text-slate-400 text-sm mb-2">
          {t.support.factoryAddress}
        </p>
        <p className="text-slate-500 text-xs mb-6">{t.support.factoryHours}</p>
        <a
          href="tel:+251966330309"
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-red-900/30"
        >
          <Phone size={16} /> Call 09 66 33 03 09
        </a>
      </motion.div>
    </section>
  );
};

export default Support;
