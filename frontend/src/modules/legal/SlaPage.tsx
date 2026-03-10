import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';
import { t } from '@/i18n';

const SlaPage: React.FC = () => {
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
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">{t('legal.sla.title')}</h1>
        <p className="text-sm text-neutral-500 mb-8">{t('legal.sla.lastUpdated')}</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-neutral-700 dark:text-neutral-300 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('legal.sla.s1title')}</h2>
            <p>{t('legal.sla.s1text')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('legal.sla.s2title')}</h2>
            <p>{t('legal.sla.s2text')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('legal.sla.s3title')}</h2>
            <p>{t('legal.sla.s3text')}</p>
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-800">
                    <th className="px-4 py-2 text-left font-semibold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700">{t('legal.sla.tablePlan')}</th>
                    <th className="px-4 py-2 text-left font-semibold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700">{t('legal.sla.tableResponseTime')}</th>
                    <th className="px-4 py-2 text-left font-semibold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700">{t('legal.sla.tableResolutionTime')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-neutral-100 dark:border-neutral-700">
                    <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">Starter</td>
                    <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">{t('legal.sla.starterResponse')}</td>
                    <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">{t('legal.sla.starterResolution')}</td>
                  </tr>
                  <tr className="border-b border-neutral-100 dark:border-neutral-700">
                    <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">Professional</td>
                    <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">{t('legal.sla.professionalResponse')}</td>
                    <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">{t('legal.sla.professionalResolution')}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">Enterprise</td>
                    <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">{t('legal.sla.enterpriseResponse')}</td>
                    <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">{t('legal.sla.enterpriseResolution')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('legal.sla.s4title')}</h2>
            <p>{t('legal.sla.s4text')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('legal.sla.s5title')}</h2>
            <p>{t('legal.sla.s5text')}</p>
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-800">
                    <th className="px-4 py-2 text-left font-semibold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700">{t('legal.sla.tableUptime')}</th>
                    <th className="px-4 py-2 text-left font-semibold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700">{t('legal.sla.tableCompensation')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-neutral-100 dark:border-neutral-700">
                    <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">&lt; 99.9%</td>
                    <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">{t('legal.sla.comp10')}</td>
                  </tr>
                  <tr className="border-b border-neutral-100 dark:border-neutral-700">
                    <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">&lt; 99.5%</td>
                    <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">{t('legal.sla.comp25')}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">&lt; 99.0%</td>
                    <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">{t('legal.sla.comp50')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('legal.sla.s6title')}</h2>
            <p>{t('legal.sla.s6text')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('legal.sla.s7title')}</h2>
            <p>{t('legal.sla.s7text')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('legal.sla.s8title')}</h2>
            <p>{t('legal.sla.s8text')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SlaPage;
