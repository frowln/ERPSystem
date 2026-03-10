import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';
import { t } from '@/i18n';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="border-b border-neutral-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/welcome" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold text-neutral-900 tracking-wide">{t('landing.brand')}</span>
          </Link>
          <Link to="/welcome" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900">
            <ArrowLeft size={16} />
            {t('auth.backToLogin')}
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">{t('legal.terms.title')}</h1>
        <p className="text-sm text-neutral-500 mb-8">{t('legal.terms.lastUpdated')}</p>

        <div className="prose prose-neutral max-w-none space-y-6 text-neutral-700 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">{t('legal.terms.s1title')}</h2>
            <p>{t('legal.terms.s1text')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">{t('legal.terms.s2title')}</h2>
            <p>{t('legal.terms.s2text')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">{t('legal.terms.s3title')}</h2>
            <p>{t('legal.terms.s3text')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">{t('legal.terms.s4title')}</h2>
            <p>{t('legal.terms.s4text')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">{t('legal.terms.s5title')}</h2>
            <p>{t('legal.terms.s5text')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">{t('legal.terms.s6title')}</h2>
            <p>{t('legal.terms.s6text')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">{t('legal.terms.s7title')}</h2>
            <p>{t('legal.terms.s7text')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
