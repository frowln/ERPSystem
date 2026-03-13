import { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { X, BookOpen, Clock, ChevronRight, Search, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { findHelpSlug } from '@/config/helpMap';
import { KB_CATEGORY_MAP } from '@/config/kbCategories';
import '@/modules/help/kb-article.css';

interface KbArticle {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  readTime: number;
  html: string;
  related: string[];
}

interface HelpDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function HelpDrawer({ open, onClose }: HelpDrawerProps) {
  const { pathname } = useLocation();
  const [article, setArticle] = useState<KbArticle | null>(null);
  const [loading, setLoading] = useState(false);

  const slug = useMemo(() => findHelpSlug(pathname), [pathname]);

  useEffect(() => {
    if (!open || !slug) {
      setArticle(null);
      return;
    }
    setLoading(true);
    fetch(`/kb/articles/${slug}.json`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setArticle)
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [open, slug]);

  const cat = article ? KB_CATEGORY_MAP[article.category] : null;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-[9990] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-[480px] max-w-[90vw] z-[9991]',
          'bg-white dark:bg-neutral-900 shadow-2xl border-l border-neutral-200 dark:border-neutral-700',
          'flex flex-col transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              {t('knowledgeBase.contextHelp')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-5 space-y-3 animate-pulse">
              <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6" />
            </div>
          )}

          {!loading && article && (
            <div className="p-5 space-y-4">
              {/* Category badge */}
              {cat && (
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', cat.bgColor, cat.darkBgColor, cat.color)}>
                  {t(`knowledgeBase.categories.${article.category}` as any)}
                </span>
              )}

              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {article.title}
              </h3>

              <div className="flex items-center gap-1 text-xs text-neutral-400">
                <Clock className="w-3 h-3" /> {article.readTime} {t('knowledgeBase.readTime')}
              </div>

              {/* Article HTML */}
              <article
                className="kb-article-compact max-w-none"
                dangerouslySetInnerHTML={{ __html: article.html }}
              />

              {/* Full article link */}
              <Link
                to={`/help/article/${article.slug}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {t('knowledgeBase.openFullArticle')}
              </Link>
            </div>
          )}

          {!loading && !article && !slug && (
            <div className="p-5 text-center py-12">
              <BookOpen className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                {t('knowledgeBase.noContextArticle')}
              </p>
              <Link
                to="/help"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                {t('knowledgeBase.openFullKb')}
              </Link>
            </div>
          )}

          {!loading && !article && slug && (
            <div className="p-5 text-center py-12">
              <BookOpen className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                {t('knowledgeBase.articleNotFound')}
              </p>
              <Link
                to="/help"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                {t('knowledgeBase.openFullKb')}
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-200 dark:border-neutral-700 shrink-0">
          <Link
            to="/help"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            <Search className="w-4 h-4" />
            {t('knowledgeBase.openFullKb')}
          </Link>
        </div>
      </div>
    </>
  );
}
