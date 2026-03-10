import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft, Rocket, Sparkles, Bug, ArrowUpCircle, Calendar } from 'lucide-react';
import { t } from '@/i18n';

type ChangeTag = 'new' | 'improvement' | 'fix';

interface ChangeEntry {
  tag: ChangeTag;
  textKey: string;
}

interface Release {
  version: string;
  dateKey: string;
  changes: ChangeEntry[];
}

const releases: Release[] = [
  {
    version: 'v3.2.0',
    dateKey: 'changelog.releases.v320.date',
    changes: [
      { tag: 'new', textKey: 'changelog.releases.v320.c1' },
      { tag: 'new', textKey: 'changelog.releases.v320.c2' },
      { tag: 'new', textKey: 'changelog.releases.v320.c3' },
      { tag: 'improvement', textKey: 'changelog.releases.v320.c4' },
    ],
  },
  {
    version: 'v3.1.0',
    dateKey: 'changelog.releases.v310.date',
    changes: [
      { tag: 'new', textKey: 'changelog.releases.v310.c1' },
      { tag: 'improvement', textKey: 'changelog.releases.v310.c2' },
      { tag: 'new', textKey: 'changelog.releases.v310.c3' },
      { tag: 'improvement', textKey: 'changelog.releases.v310.c4' },
    ],
  },
  {
    version: 'v3.0.0',
    dateKey: 'changelog.releases.v300.date',
    changes: [
      { tag: 'new', textKey: 'changelog.releases.v300.c1' },
      { tag: 'new', textKey: 'changelog.releases.v300.c2' },
      { tag: 'new', textKey: 'changelog.releases.v300.c3' },
      { tag: 'new', textKey: 'changelog.releases.v300.c4' },
    ],
  },
  {
    version: 'v2.5.0',
    dateKey: 'changelog.releases.v250.date',
    changes: [
      { tag: 'new', textKey: 'changelog.releases.v250.c1' },
      { tag: 'new', textKey: 'changelog.releases.v250.c2' },
      { tag: 'improvement', textKey: 'changelog.releases.v250.c3' },
    ],
  },
  {
    version: 'v2.0.0',
    dateKey: 'changelog.releases.v200.date',
    changes: [
      { tag: 'new', textKey: 'changelog.releases.v200.c1' },
      { tag: 'improvement', textKey: 'changelog.releases.v200.c2' },
      { tag: 'new', textKey: 'changelog.releases.v200.c3' },
      { tag: 'fix', textKey: 'changelog.releases.v200.c4' },
    ],
  },
  {
    version: 'v1.0.0',
    dateKey: 'changelog.releases.v100.date',
    changes: [
      { tag: 'new', textKey: 'changelog.releases.v100.c1' },
      { tag: 'new', textKey: 'changelog.releases.v100.c2' },
      { tag: 'new', textKey: 'changelog.releases.v100.c3' },
      { tag: 'new', textKey: 'changelog.releases.v100.c4' },
    ],
  },
];

const tagConfig: Record<ChangeTag, { icon: React.FC<{ size?: number; className?: string }>; labelKey: string; color: string }> = {
  new: { icon: Rocket, labelKey: 'changelog.tagNew', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  improvement: { icon: ArrowUpCircle, labelKey: 'changelog.tagImprovement', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  fix: { icon: Bug, labelKey: 'changelog.tagFix', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
};

const ChangelogPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Header */}
      <nav className="border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/welcome" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-wide">
              {t('landing.brand')}
            </span>
          </Link>
          <Link
            to="/welcome"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            <ArrowLeft size={16} />
            {t('changelog.backToSite')}
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page title */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles size={28} className="text-primary-500" />
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              {t('changelog.title')}
            </h1>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 text-base">
            {t('changelog.description')}
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-neutral-200 dark:bg-neutral-700" />

          <div className="space-y-10">
            {releases.map((release, idx) => (
              <div key={release.version} className="relative pl-12">
                {/* Timeline dot */}
                <div
                  className={`absolute left-2.5 top-1.5 w-4 h-4 rounded-full border-2 ${
                    idx === 0
                      ? 'bg-primary-500 border-primary-500 shadow-md shadow-primary-500/30'
                      : 'bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-600'
                  }`}
                />

                {/* Release card */}
                <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
                  {/* Version header */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
                        idx === 0
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                          : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                      }`}
                    >
                      {release.version}
                      {idx === 0 && (
                        <span className="text-xs font-medium ml-1">
                          {t('changelog.latest')}
                        </span>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                      <Calendar size={14} />
                      {t(release.dateKey as never)}
                    </span>
                  </div>

                  {/* Changes list */}
                  <ul className="space-y-2.5">
                    {release.changes.map((change, cIdx) => {
                      const cfg = tagConfig[change.tag];
                      const Icon = cfg.icon;
                      return (
                        <li key={cIdx} className="flex items-start gap-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap mt-0.5 ${cfg.color}`}
                          >
                            <Icon size={12} />
                            {t(cfg.labelKey as never)}
                          </span>
                          <span className="text-sm text-neutral-700 dark:text-neutral-300">
                            {t(change.textKey as never)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangelogPage;
