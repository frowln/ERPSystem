import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';
import { t } from '@/i18n';

const DpaPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      {/* Header */}
      <nav className="border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/welcome" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold text-neutral-900 dark:text-white tracking-wide">{t('landing.brand')}</span>
          </Link>
          <Link to="/welcome" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
            <ArrowLeft size={16} />
            {t('auth.backToLogin')}
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">{t('legal.dpa.title')}</h1>
        <p className="text-sm text-neutral-500 mb-8">{t('legal.dpa.lastUpdated')}</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-neutral-700 dark:text-neutral-300 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('legal.dpa.s1title')}</h2>
            <p>{t('legal.dpa.s1text')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('legal.dpa.s2title')}</h2>
            <p>{t('legal.dpa.s2text')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('legal.dpa.s3title')}</h2>
            <p>{t('legal.dpa.s3text')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('legal.dpa.s4title')}</h2>
            <p>{t('legal.dpa.s4text')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('legal.dpa.s5title')}</h2>
            <p>{t('legal.dpa.s5text')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('legal.dpa.s6title')}</h2>
            <p>{t('legal.dpa.s6text')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('legal.dpa.s7title')}</h2>
            <p>{t('legal.dpa.s7text')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('legal.dpa.s8title')}</h2>
            <p>{t('legal.dpa.s8text')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DpaPage;
