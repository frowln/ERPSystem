import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, BookOpen, ChevronRight, Clock, Map, HelpCircle,
  Users, GitBranch, ArrowRight,
} from 'lucide-react';
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
  related: string[];
}

interface SearchItem {
  slug: string;
  title: string;
  category: string;
  type: string;
  excerpt: string;
  readTime: number;
  searchText: string;
}

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<KbArticleMeta[]>([]);
  const [searchIndex, setSearchIndex] = useState<SearchItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/kb/index.json').then(r => r.json()),
      fetch('/kb/search-index.json').then(r => r.json()),
    ]).then(([idx, si]) => {
      setArticles(idx);
      setSearchIndex(si);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const terms = q.split(/\s+/);
    return searchIndex
      .filter(item => terms.every(term => item.searchText.includes(term)))
      .slice(0, 15);
  }, [query, searchIndex]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of articles) {
      counts[a.category] = (counts[a.category] || 0) + 1;
    }
    return counts;
  }, [articles]);

  const isSearching = query.trim().length > 0;

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-64" />
        <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <BookOpen className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('knowledgeBase.title')}
          </h1>
        </div>
        <p className="text-gray-500 dark:text-neutral-400">
          {t('knowledgeBase.subtitle')}
        </p>
        <p className="text-sm text-gray-400 dark:text-neutral-500">
          {articles.length} {t('knowledgeBase.articles').toLowerCase()}
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('knowledgeBase.searchPlaceholder')}
          className={cn(
            'w-full pl-12 pr-4 py-3 rounded-xl border bg-white dark:bg-neutral-800',
            'border-gray-200 dark:border-neutral-700',
            'text-gray-900 dark:text-white placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'text-base',
          )}
        />
      </div>

      {/* Search Results */}
      {isSearching && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('knowledgeBase.searchResults')} ({searchResults.length})
          </h2>
          {searchResults.length === 0 ? (
            <p className="text-gray-500 dark:text-neutral-400 text-center py-8">
              {t('knowledgeBase.noResults')}
            </p>
          ) : (
            <div className="space-y-2">
              {searchResults.map(item => {
                const cat = KB_CATEGORY_MAP[item.category];
                return (
                  <Link
                    key={item.slug}
                    to={`/help/article/${item.slug}`}
                    className={cn(
                      'block p-4 rounded-xl border',
                      'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700',
                      'hover:border-primary-300 dark:hover:border-primary-600 transition-colors',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1 line-clamp-2">
                          {item.excerpt}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
                        {cat && (
                          <span className={cn('px-2 py-0.5 rounded-full text-xs', cat.bgColor, cat.darkBgColor, cat.color)}>
                            {t(`knowledgeBase.categories.${item.category}` as any)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {item.readTime} {t('knowledgeBase.readTime')}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Categories Grid */}
      {!isSearching && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {KB_CATEGORIES.filter(c => (categoryCounts[c.id] || 0) > 0).map(cat => {
              const Icon = cat.icon;
              const count = categoryCounts[cat.id] || 0;
              return (
                <Link
                  key={cat.id}
                  to={`/help/category/${cat.id}`}
                  className={cn(
                    'p-5 rounded-xl border transition-all',
                    'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700',
                    'hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600',
                    'group',
                  )}
                >
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', cat.bgColor, cat.darkBgColor)}>
                    <Icon className={cn('w-5 h-5', cat.color)} />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {t(`knowledgeBase.categories.${cat.id}` as any)}
                  </h3>
                  <p className="text-sm text-gray-400 dark:text-neutral-500 mt-1">
                    {count} {t('knowledgeBase.articles').toLowerCase()}
                  </p>
                </Link>
              );
            })}
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('knowledgeBase.quickLinks')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <QuickLink to="/help/article/00-system-map" icon={Map} label={t('knowledgeBase.systemMap')} />
              <QuickLink to="/help/article/faq" icon={HelpCircle} label={t('knowledgeBase.faq')} />
              <QuickLink to="/help/article/by-role-navigator" icon={Users} label={t('knowledgeBase.byRole')} />
              <QuickLink to="/help/category/workflows" icon={GitBranch} label={t('knowledgeBase.workflows')} />
            </div>
          </div>

          {/* Popular Articles */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('knowledgeBase.popularArticles')}
            </h2>
            <div className="space-y-2">
              {articles
                .filter(a => ['onboarding', 'budgets', 'ks2', 'projects', 'estimates', 'employees'].includes(a.slug))
                .map(a => (
                  <Link
                    key={a.slug}
                    to={`/help/article/${a.slug}`}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg',
                      'hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{a.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-3 h-3" /> {a.readTime} {t('knowledgeBase.readTime')}
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: typeof Map; label: string }) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border',
        'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700',
        'hover:border-primary-300 dark:hover:border-primary-600 transition-colors',
      )}
    >
      <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
      <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
      <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
    </Link>
  );
}
