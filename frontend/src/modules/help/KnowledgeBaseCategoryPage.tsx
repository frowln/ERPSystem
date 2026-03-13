import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, BookOpen, ChevronRight, Search } from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { KB_CATEGORIES, KB_CATEGORY_MAP } from '@/config/kbCategories';

interface KbArticleMeta {
  slug: string;
  title: string;
  category: string;
  type: string;
  excerpt: string;
  readTime: number;
  tags: string[];
}

export default function KnowledgeBaseCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [articles, setArticles] = useState<KbArticleMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetch('/kb/index.json')
      .then(r => r.json())
      .then(setArticles)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cat = categoryId ? KB_CATEGORY_MAP[categoryId] : null;
  const Icon = cat?.icon || BookOpen;

  const categoryArticles = useMemo(() => {
    let filtered = articles.filter(a => a.category === categoryId);
    if (filter.trim()) {
      const q = filter.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q)
      );
    }
    return filtered.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
  }, [articles, categoryId, filter]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto animate-pulse space-y-4">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-48" />
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-64" />
        {[1,2,3,4].map(i => (
          <div key={i} className="h-20 bg-neutral-200 dark:bg-neutral-700 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-neutral-400">
        <Link to="/help" className="hover:text-primary-600 dark:hover:text-primary-400">
          {t('knowledgeBase.title')}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-900 dark:text-white">
          {t(`knowledgeBase.categories.${categoryId}` as any)}
        </span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-4">
        {cat && (
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', cat.bgColor, cat.darkBgColor)}>
            <Icon className={cn('w-6 h-6', cat.color)} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t(`knowledgeBase.categories.${categoryId}` as any)}
          </h1>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            {categoryArticles.length} {t('knowledgeBase.articles').toLowerCase()}
          </p>
        </div>
      </div>

      {/* Filter */}
      {categoryArticles.length > 5 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder={t('knowledgeBase.searchPlaceholder')}
            className={cn(
              'w-full pl-10 pr-4 py-2 rounded-lg border text-sm',
              'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700',
              'text-gray-900 dark:text-white placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500',
            )}
          />
        </div>
      )}

      {/* Articles List */}
      <div className="space-y-2">
        {categoryArticles.map(article => (
          <Link
            key={article.slug}
            to={`/help/article/${article.slug}`}
            className={cn(
              'block p-4 rounded-xl border transition-colors',
              'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700',
              'hover:border-primary-300 dark:hover:border-primary-600',
              'group',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1 line-clamp-2">
                  {article.excerpt}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                <Clock className="w-3 h-3" /> {article.readTime} {t('knowledgeBase.readTime')}
                <ChevronRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {categoryArticles.length === 0 && (
        <p className="text-center text-gray-500 dark:text-neutral-400 py-8">
          {t('knowledgeBase.noResults')}
        </p>
      )}

      {/* Back */}
      <Link
        to="/help"
        className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('knowledgeBase.backToKb')}
      </Link>
    </div>
  );
}
