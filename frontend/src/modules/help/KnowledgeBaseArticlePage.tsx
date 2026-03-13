import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Clock, BookOpen, ThumbsUp, ThumbsDown, ChevronRight, X,
} from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { KB_CATEGORY_MAP } from '@/config/kbCategories';
import './kb-article.css';

interface KbArticle {
  slug: string;
  title: string;
  category: string;
  type: string;
  excerpt: string;
  readTime: number;
  tags: string[];
  related: string[];
  html: string;
}

export default function KnowledgeBaseArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<KbArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<{ slug: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState('');

  // Intercept clicks on images inside the article to open lightbox
  const articleRef = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
        e.stopPropagation();
        const img = target as HTMLImageElement;
        setLightboxSrc(img.src);
        setLightboxAlt(img.alt || '');
      }
      // Also handle clicks on <a> wrapping images
      if (target.tagName === 'A' && (target as HTMLAnchorElement).querySelector('img')) {
        e.preventDefault();
        const img = (target as HTMLAnchorElement).querySelector('img')!;
        setLightboxSrc(img.src);
        setLightboxAlt(img.alt || '');
      }
    };
    node.addEventListener('click', handler);
    return () => node.removeEventListener('click', handler);
  }, []);

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxSrc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxSrc(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightboxSrc]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(false);
    setFeedback(null);

    fetch(`/kb/articles/${slug}.json`)
      .then(r => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((data: KbArticle) => {
        setArticle(data);
        setLoading(false);

        // Load related article titles
        if (data.related?.length) {
          Promise.all(
            data.related.slice(0, 5).map(rs =>
              fetch(`/kb/articles/${rs}.json`)
                .then(r => r.ok ? r.json() : null)
                .catch(() => null)
            )
          ).then(results => {
            setRelatedArticles(
              results.filter(Boolean).map((r: KbArticle) => ({ slug: r.slug, title: r.title }))
            );
          });
        }
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto animate-pulse space-y-4">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-48" />
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-96" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center py-20">
        <BookOpen className="w-12 h-12 text-gray-300 dark:text-neutral-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-neutral-400">
          {t('knowledgeBase.noResults')}
        </p>
        <Link
          to="/help"
          className="inline-flex items-center gap-2 mt-4 text-primary-600 dark:text-primary-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('knowledgeBase.backToKb')}
        </Link>
      </div>
    );
  }

  const cat = KB_CATEGORY_MAP[article.category];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-neutral-400">
        <Link to="/help" className="hover:text-primary-600 dark:hover:text-primary-400">
          {t('knowledgeBase.title')}
        </Link>
        <ChevronRight className="w-3 h-3" />
        {cat && (
          <>
            <Link
              to={`/help/category/${article.category}`}
              className="hover:text-primary-600 dark:hover:text-primary-400"
            >
              {t(`knowledgeBase.categories.${article.category}` as any)}
            </Link>
            <ChevronRight className="w-3 h-3" />
          </>
        )}
        <span className="text-gray-900 dark:text-white truncate">{article.title}</span>
      </nav>

      {/* Article Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {article.title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-neutral-400">
          {cat && (
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', cat.bgColor, cat.darkBgColor, cat.color)}>
              {t(`knowledgeBase.categories.${article.category}` as any)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" /> {article.readTime} {t('knowledgeBase.readTime')}
          </span>
        </div>
      </div>

      {/* Article Content */}
      <article
        ref={articleRef}
        className="kb-article max-w-none"
        dangerouslySetInnerHTML={{ __html: article.html }}
      />

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="border-t border-gray-200 dark:border-neutral-700 pt-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('knowledgeBase.relatedArticles')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {relatedArticles.map(ra => (
              <Link
                key={ra.slug}
                to={`/help/article/${ra.slug}`}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm',
                  'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700',
                  'hover:border-primary-300 dark:hover:border-primary-600 transition-colors',
                  'text-gray-700 dark:text-neutral-300',
                )}
              >
                <BookOpen className="w-3.5 h-3.5" />
                {ra.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      <div className={cn(
        'border-t border-gray-200 dark:border-neutral-700 pt-6',
        'flex items-center gap-4',
      )}>
        <span className="text-sm text-gray-500 dark:text-neutral-400">
          {t('knowledgeBase.feedbackTitle')}
        </span>
        {feedback === null ? (
          <div className="flex gap-2">
            <button
              onClick={() => setFeedback('yes')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors',
                'border-gray-200 dark:border-neutral-700 hover:bg-green-50 dark:hover:bg-green-900/20',
                'hover:border-green-300 dark:hover:border-green-600 text-gray-600 dark:text-neutral-400',
              )}
            >
              <ThumbsUp className="w-4 h-4" /> {t('knowledgeBase.feedbackYes')}
            </button>
            <button
              onClick={() => setFeedback('no')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors',
                'border-gray-200 dark:border-neutral-700 hover:bg-red-50 dark:hover:bg-red-900/20',
                'hover:border-red-300 dark:hover:border-red-600 text-gray-600 dark:text-neutral-400',
              )}
            >
              <ThumbsDown className="w-4 h-4" /> {t('knowledgeBase.feedbackNo')}
            </button>
          </div>
        ) : (
          <span className="text-sm text-green-600 dark:text-green-400">
            {t('knowledgeBase.feedbackThanks')}
          </span>
        )}
      </div>

      {/* Back link */}
      <div className="pt-4">
        <Link
          to="/help"
          className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('knowledgeBase.backToKb')}
        </Link>
      </div>

      {/* Lightbox overlay */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label={t('common.close')}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxSrc}
            alt={lightboxAlt}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {lightboxAlt && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/50 px-4 py-2 rounded-lg">
              {lightboxAlt}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
