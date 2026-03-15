import React, { useState } from 'react';
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
  Calculator,
  Clock,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { t } from '@/i18n';
import { apiClient } from '@/api/client';
import toast from 'react-hot-toast';

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
    isEnterprise: true,
  },
];

const employeeOptions = ['1-10', '10-50', '50-200', '200+'];

const LandingPage: React.FC = () => {
  const [demoForm, setDemoForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    employeeCount: '',
  });
  const [demoSubmitting, setDemoSubmitting] = useState(false);

  const [roiEmployees, setRoiEmployees] = useState(30);
  const [roiProjects, setRoiProjects] = useState(5);
  const [roiBudget, setRoiBudget] = useState(50);

  const timeSavedHours = roiEmployees * 4;
  const costSavedMonth = timeSavedHours * 800;
  const riskReduction = roiProjects * roiBudget * 1_000_000 * 0.02;
  const annualRoi = costSavedMonth * 12 + riskReduction - 9900 * 12;
  const roiPercent = Math.round((annualRoi / (9900 * 12)) * 100);

  const formatNumber = (n: number): string =>
    n.toLocaleString('ru-RU', { maximumFractionDigits: 0 });

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoSubmitting(true);
    try {
      await apiClient.post('/api/demo-requests', demoForm);
      toast.success(t('landing.demo.success'));
      setDemoForm({ name: '', email: '', phone: '', company: '', employeeCount: '' });
    } catch {
      toast.error(t('common.error'));
    } finally {
      setDemoSubmitting(false);
    }
  };

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

      {/* Screenshots */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              {t('landing.screenshots.title')}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              { src: '/kb/screenshots/dashboard/main-dashboard.png', captionKey: 'landing.screenshots.dashboard' },
              { src: '/kb/screenshots/projects/list-projects.png', captionKey: 'landing.screenshots.projects' },
              { src: '/kb/screenshots/estimates/list-estimates.png', captionKey: 'landing.screenshots.estimates' },
              { src: '/kb/screenshots/safety/dashboard.png', captionKey: 'landing.screenshots.safety' },
            ].map((item) => (
              <div key={item.captionKey} className="group">
                <div className="overflow-hidden rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700">
                  <img
                    src={item.src}
                    alt={t(item.captionKey)}
                    className="w-full h-auto object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <p className="text-center text-sm font-medium text-neutral-600 dark:text-neutral-400 mt-3">
                  {t(item.captionKey)}
                </p>
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
                {'isEnterprise' in plan && plan.isEnterprise ? (
                  <button
                    type="button"
                    onClick={() => document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' })}
                    className="block w-full text-center text-sm font-semibold py-3 rounded-lg transition-colors bg-primary-600 text-white hover:bg-primary-700"
                  >
                    {t('landing.pricing.cta')}
                  </button>
                ) : (
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
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section id="roi" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
              <Calculator size={14} />
              ROI
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              {t('landing.roi.title')}
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Inputs */}
            <div className="space-y-8 bg-white dark:bg-neutral-800 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-700 shadow-sm">
              {/* Employees */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {t('landing.roi.employees')}
                  </label>
                  <span className="text-sm font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2.5 py-0.5 rounded-lg">
                    {roiEmployees}
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={500}
                  step={5}
                  value={roiEmployees}
                  onChange={(e) => setRoiEmployees(Number(e.target.value))}
                  className="w-full h-2 bg-neutral-200 dark:bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-xs text-neutral-400 mt-1">
                  <span>5</span>
                  <span>500</span>
                </div>
              </div>

              {/* Projects */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {t('landing.roi.projects')}
                  </label>
                  <span className="text-sm font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2.5 py-0.5 rounded-lg">
                    {roiProjects}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  step={1}
                  value={roiProjects}
                  onChange={(e) => setRoiProjects(Number(e.target.value))}
                  className="w-full h-2 bg-neutral-200 dark:bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-xs text-neutral-400 mt-1">
                  <span>1</span>
                  <span>50</span>
                </div>
              </div>

              {/* Budget */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {t('landing.roi.budget')}
                  </label>
                  <span className="text-sm font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2.5 py-0.5 rounded-lg">
                    {roiBudget}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={500}
                  step={1}
                  value={roiBudget}
                  onChange={(e) => setRoiBudget(Number(e.target.value))}
                  className="w-full h-2 bg-neutral-200 dark:bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-xs text-neutral-400 mt-1">
                  <span>1</span>
                  <span>500</span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              {/* Time saved */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-xl flex items-center justify-center">
                    <Clock size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {t('landing.roi.timeSaved')}
                  </span>
                </div>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {formatNumber(timeSavedHours)} {t('landing.roi.hours')}
                </p>
              </div>

              {/* Cost saved */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 border border-green-100 dark:border-green-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-xl flex items-center justify-center">
                    <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    {t('landing.roi.costSaved')}
                  </span>
                </div>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {formatNumber(costSavedMonth)} &#8381;
                </p>
              </div>

              {/* Risk reduction */}
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-6 border border-amber-100 dark:border-amber-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-800 rounded-xl flex items-center justify-center">
                    <ShieldCheck size={20} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    {t('landing.roi.riskReduction')}
                  </span>
                </div>
                <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                  {formatNumber(riskReduction)} &#8381;
                </p>
              </div>

              {/* Annual ROI */}
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-6 border border-primary-200 dark:border-primary-800 ring-2 ring-primary-200 dark:ring-primary-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-800 rounded-xl flex items-center justify-center">
                    <BarChart3 size={20} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                    {t('landing.roi.annualRoi')}
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl font-bold text-primary-900 dark:text-primary-100">
                    {formatNumber(annualRoi)} &#8381;
                  </p>
                  <span className={`text-lg font-bold ${roiPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {roiPercent >= 0 ? '+' : ''}{formatNumber(roiPercent)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Request Form */}
      <section id="demo-form" className="py-20 px-4 sm:px-6 lg:px-8 bg-primary-50 dark:bg-primary-900/20">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              {t('landing.demo.title')}
            </h2>
            <p className="text-lg text-neutral-500 dark:text-neutral-400">
              {t('landing.demo.subtitle')}
            </p>
          </div>
          <form onSubmit={handleDemoSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('landing.demo.name')}
              </label>
              <input
                type="text"
                required
                value={demoForm.name}
                onChange={(e) => setDemoForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('landing.demo.email')}
              </label>
              <input
                type="email"
                required
                value={demoForm.email}
                onChange={(e) => setDemoForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('landing.demo.phone')}
              </label>
              <input
                type="tel"
                value={demoForm.phone}
                onChange={(e) => setDemoForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('landing.demo.company')}
              </label>
              <input
                type="text"
                required
                value={demoForm.company}
                onChange={(e) => setDemoForm((prev) => ({ ...prev, company: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('landing.demo.employees')}
              </label>
              <select
                required
                value={demoForm.employeeCount}
                onChange={(e) => setDemoForm((prev) => ({ ...prev, employeeCount: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
              >
                <option value="" disabled />
                {employeeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={demoSubmitting}
              className="w-full py-3 rounded-2xl text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-lg shadow-primary-600/20"
            >
              {demoSubmitting ? '...' : t('landing.demo.submit')}
            </button>
          </form>
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
