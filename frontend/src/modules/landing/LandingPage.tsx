import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  BarChart3,
  FileText,
  Shield,
  Users,
  Truck,
  CheckCircle,
  ArrowRight,
  Zap,
  Globe,
  Lock,
  Layers,
} from 'lucide-react';
import { t } from '@/i18n';

const features = [
  { icon: Building2, titleKey: 'landing.features.projects.title', descKey: 'landing.features.projects.desc' },
  { icon: BarChart3, titleKey: 'landing.features.finance.title', descKey: 'landing.features.finance.desc' },
  { icon: FileText, titleKey: 'landing.features.documents.title', descKey: 'landing.features.documents.desc' },
  { icon: Shield, titleKey: 'landing.features.safety.title', descKey: 'landing.features.safety.desc' },
  { icon: Users, titleKey: 'landing.features.hr.title', descKey: 'landing.features.hr.desc' },
  { icon: Truck, titleKey: 'landing.features.procurement.title', descKey: 'landing.features.procurement.desc' },
];

const advantages = [
  { icon: Zap, titleKey: 'landing.advantages.speed.title', descKey: 'landing.advantages.speed.desc' },
  { icon: Globe, titleKey: 'landing.advantages.cloud.title', descKey: 'landing.advantages.cloud.desc' },
  { icon: Lock, titleKey: 'landing.advantages.security.title', descKey: 'landing.advantages.security.desc' },
  { icon: Layers, titleKey: 'landing.advantages.modules.title', descKey: 'landing.advantages.modules.desc' },
];

const plans = [
  {
    nameKey: 'landing.pricing.starter.name',
    priceKey: 'landing.pricing.starter.price',
    periodKey: 'landing.pricing.perMonth',
    featuresKeys: [
      'landing.pricing.starter.f1',
      'landing.pricing.starter.f2',
      'landing.pricing.starter.f3',
      'landing.pricing.starter.f4',
    ],
    highlighted: false,
  },
  {
    nameKey: 'landing.pricing.professional.name',
    priceKey: 'landing.pricing.professional.price',
    periodKey: 'landing.pricing.perMonth',
    featuresKeys: [
      'landing.pricing.professional.f1',
      'landing.pricing.professional.f2',
      'landing.pricing.professional.f3',
      'landing.pricing.professional.f4',
      'landing.pricing.professional.f5',
    ],
    highlighted: true,
  },
  {
    nameKey: 'landing.pricing.enterprise.name',
    priceKey: 'landing.pricing.enterprise.price',
    periodKey: '',
    featuresKeys: [
      'landing.pricing.enterprise.f1',
      'landing.pricing.enterprise.f2',
      'landing.pricing.enterprise.f3',
      'landing.pricing.enterprise.f4',
      'landing.pricing.enterprise.f5',
    ],
    highlighted: false,
  },
];

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold text-neutral-900 tracking-wide">{t('landing.brand')}</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
              {t('landing.nav.features')}
            </a>
            <a href="#pricing" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
              {t('landing.nav.pricing')}
            </a>
            <a href="#advantages" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
              {t('landing.nav.advantages')}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900 px-4 py-2 transition-colors"
            >
              {t('landing.nav.login')}
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 px-5 py-2 rounded-lg transition-colors"
            >
              {t('landing.nav.tryFree')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <Zap size={14} />
            {t('landing.hero.badge')}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight mb-6">
            {t('landing.hero.title')}
          </h1>
          <p className="text-lg sm:text-xl text-neutral-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('landing.hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 px-8 py-3.5 rounded-xl transition-colors shadow-lg shadow-primary-600/20"
            >
              {t('landing.hero.cta')}
              <ArrowRight size={18} />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 text-base font-medium text-neutral-700 hover:text-neutral-900 px-8 py-3.5 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors"
            >
              {t('landing.hero.learnMore')}
            </a>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[
              { value: '500+', label: t('landing.stats.projects') },
              { value: '12 млрд ₽', label: t('landing.stats.budget') },
              { value: '2 000+', label: t('landing.stats.users') },
              { value: '99.9%', label: t('landing.stats.uptime') },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold text-neutral-900">{stat.value}</p>
                <p className="text-sm text-neutral-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-neutral-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.titleKey}
                className="bg-white rounded-xl p-6 border border-neutral-100 hover:border-primary-200 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon size={24} className="text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">{t(feature.titleKey)}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section id="advantages" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              {t('landing.advantages.title')}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {advantages.map((adv) => (
              <div key={adv.titleKey} className="text-center">
                <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <adv.icon size={28} className="text-primary-600" />
                </div>
                <h3 className="text-base font-semibold text-neutral-900 mb-2">{t(adv.titleKey)}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{t(adv.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-neutral-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
              {t('landing.pricing.subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.nameKey}
                className={`rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'bg-primary-600 text-white ring-4 ring-primary-600/20 scale-105'
                    : 'bg-white border border-neutral-200'
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-2 ${plan.highlighted ? 'text-white' : 'text-neutral-900'}`}
                >
                  {t(plan.nameKey)}
                </h3>
                <div className="mb-6">
                  <span
                    className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-neutral-900'}`}
                  >
                    {t(plan.priceKey)}
                  </span>
                  {plan.periodKey && (
                    <span className={`text-sm ml-1 ${plan.highlighted ? 'text-primary-100' : 'text-neutral-500'}`}>
                      {t(plan.periodKey)}
                    </span>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.featuresKeys.map((fk) => (
                    <li key={fk} className="flex items-start gap-2">
                      <CheckCircle
                        size={16}
                        className={`mt-0.5 flex-shrink-0 ${
                          plan.highlighted ? 'text-primary-200' : 'text-primary-500'
                        }`}
                      />
                      <span
                        className={`text-sm ${plan.highlighted ? 'text-primary-50' : 'text-neutral-600'}`}
                      >
                        {t(fk)}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block text-center text-sm font-semibold py-3 rounded-lg transition-colors ${
                    plan.highlighted
                      ? 'bg-white text-primary-600 hover:bg-primary-50'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {t('landing.pricing.cta')}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
            {t('landing.cta.title')}
          </h2>
          <p className="text-lg text-neutral-500 mb-8 max-w-xl mx-auto">
            {t('landing.cta.subtitle')}
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 px-8 py-3.5 rounded-xl transition-colors shadow-lg shadow-primary-600/20"
          >
            {t('landing.cta.button')}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold text-neutral-900">{t('landing.brand')}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-neutral-500">
            <Link to="/terms" className="hover:text-neutral-900 transition-colors">
              {t('landing.footer.terms')}
            </Link>
            <Link to="/privacy" className="hover:text-neutral-900 transition-colors">
              {t('landing.footer.privacy')}
            </Link>
            <Link to="/dpa" className="hover:text-neutral-900 transition-colors">
              {t('landing.footer.dpa')}
            </Link>
            <Link to="/sla" className="hover:text-neutral-900 transition-colors">
              {t('landing.footer.sla')}
            </Link>
            <span>&copy; {new Date().getFullYear()} {t('landing.footer.copyright')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
