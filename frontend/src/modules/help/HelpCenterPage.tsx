import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Search,
  Rocket,
  FolderKanban,
  DollarSign,
  ListTodo,
  FileText,
  Package,
  Shield,
  Settings,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Data structures
// ---------------------------------------------------------------------------

interface Article {
  id: string;
  titleKey: string;
  contentKey: string;
}

interface Category {
  id: string;
  labelKey: string;
  icon: React.ElementType;
  articles: Article[];
}

const CATEGORIES: Category[] = [
  {
    id: 'gettingStarted',
    labelKey: 'help.categories.gettingStarted',
    icon: Rocket,
    articles: [
      { id: 'a1', titleKey: 'help.articles.a1.title', contentKey: 'help.articles.a1.content' },
      { id: 'a2', titleKey: 'help.articles.a2.title', contentKey: 'help.articles.a2.content' },
      { id: 'a3', titleKey: 'help.articles.a3.title', contentKey: 'help.articles.a3.content' },
      { id: 'a4', titleKey: 'help.articles.a4.title', contentKey: 'help.articles.a4.content' },
    ],
  },
  {
    id: 'projects',
    labelKey: 'help.categories.projects',
    icon: FolderKanban,
    articles: [
      { id: 'a5', titleKey: 'help.articles.a5.title', contentKey: 'help.articles.a5.content' },
      { id: 'a6', titleKey: 'help.articles.a6.title', contentKey: 'help.articles.a6.content' },
      { id: 'a7', titleKey: 'help.articles.a7.title', contentKey: 'help.articles.a7.content' },
    ],
  },
  {
    id: 'finance',
    labelKey: 'help.categories.finance',
    icon: DollarSign,
    articles: [
      { id: 'a8', titleKey: 'help.articles.a8.title', contentKey: 'help.articles.a8.content' },
      { id: 'a9', titleKey: 'help.articles.a9.title', contentKey: 'help.articles.a9.content' },
      { id: 'a10', titleKey: 'help.articles.a10.title', contentKey: 'help.articles.a10.content' },
    ],
  },
  {
    id: 'tasks',
    labelKey: 'help.categories.tasks',
    icon: ListTodo,
    articles: [
      { id: 'a11', titleKey: 'help.articles.a11.title', contentKey: 'help.articles.a11.content' },
      { id: 'a12', titleKey: 'help.articles.a12.title', contentKey: 'help.articles.a12.content' },
      { id: 'a13', titleKey: 'help.articles.a13.title', contentKey: 'help.articles.a13.content' },
    ],
  },
  {
    id: 'documents',
    labelKey: 'help.categories.documents',
    icon: FileText,
    articles: [
      { id: 'a14', titleKey: 'help.articles.a14.title', contentKey: 'help.articles.a14.content' },
      { id: 'a15', titleKey: 'help.articles.a15.title', contentKey: 'help.articles.a15.content' },
    ],
  },
  {
    id: 'procurement',
    labelKey: 'help.categories.procurement',
    icon: Package,
    articles: [
      { id: 'a16', titleKey: 'help.articles.a16.title', contentKey: 'help.articles.a16.content' },
      { id: 'a17', titleKey: 'help.articles.a17.title', contentKey: 'help.articles.a17.content' },
    ],
  },
  {
    id: 'safety',
    labelKey: 'help.categories.safety',
    icon: Shield,
    articles: [
      { id: 'a18', titleKey: 'help.articles.a18.title', contentKey: 'help.articles.a18.content' },
      { id: 'a19', titleKey: 'help.articles.a19.title', contentKey: 'help.articles.a19.content' },
    ],
  },
  {
    id: 'settings',
    labelKey: 'help.categories.settings',
    icon: Settings,
    articles: [
      { id: 'a20', titleKey: 'help.articles.a20.title', contentKey: 'help.articles.a20.content' },
      { id: 'a21', titleKey: 'help.articles.a21.title', contentKey: 'help.articles.a21.content' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type View =
  | { kind: 'categories' }
  | { kind: 'articleList'; categoryId: string }
  | { kind: 'article'; categoryId: string; articleId: string };

const HelpCenterPage: React.FC = () => {
  const [view, setView] = useState<View>({ kind: 'categories' });
  const [searchQuery, setSearchQuery] = useState('');

  // Flatten all articles for search
  const allArticles = useMemo(
    () =>
      CATEGORIES.flatMap((cat) =>
        cat.articles.map((a) => ({ ...a, categoryId: cat.id, categoryLabel: t(cat.labelKey) })),
      ),
    [],
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return allArticles.filter((a) => t(a.titleKey).toLowerCase().includes(q));
  }, [searchQuery, allArticles]);

  // --- helpers ---
  const currentCategory =
    view.kind !== 'categories' ? CATEGORIES.find((c) => c.id === view.categoryId) : undefined;
  const currentArticle =
    view.kind === 'article' && currentCategory
      ? currentCategory.articles.find((a) => a.id === view.articleId)
      : undefined;

  const goCategories = () => {
    setView({ kind: 'categories' });
    setSearchQuery('');
  };
  const goCategory = (categoryId: string) => {
    setView({ kind: 'articleList', categoryId });
    setSearchQuery('');
  };
  const goArticle = (categoryId: string, articleId: string) => {
    setView({ kind: 'article', categoryId, articleId });
    setSearchQuery('');
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderNav = () => (
    <nav className="border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/welcome" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
            <Building2 size={20} className="text-white" />
          </div>
          <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-wide">
            {t('landing.brand')}
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/welcome"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            <ArrowLeft size={16} />
            {t('common.home')}
          </Link>
        </div>
      </div>
    </nav>
  );

  const renderSearch = () => (
    <div className="relative max-w-xl mx-auto mb-10">
      <Search
        size={20}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
      />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t('help.searchPlaceholder')}
        className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
      />
    </div>
  );

  const renderSearchResults = () => {
    if (!searchResults) return null;
    if (searchResults.length === 0) {
      return (
        <p className="text-center text-neutral-500 dark:text-neutral-400 py-12 text-sm">
          {t('help.noResults')}
        </p>
      );
    }
    return (
      <div className="max-w-3xl mx-auto space-y-2">
        {searchResults.map((a) => (
          <button
            key={a.id}
            onClick={() => goArticle(a.categoryId, a.id)}
            className="w-full text-left px-5 py-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-primary-300 dark:hover:border-primary-600 transition-colors flex items-center justify-between group"
          >
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                {t(a.titleKey)}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {a.categoryLabel}
              </p>
            </div>
            <ChevronRight size={16} className="text-neutral-400 dark:text-neutral-500" />
          </button>
        ))}
      </div>
    );
  };

  const renderCategoryGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        return (
          <button
            key={cat.id}
            onClick={() => goCategory(cat.id)}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
              <Icon size={24} className="text-primary-600 dark:text-primary-400" />
            </div>
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {t(cat.labelKey)}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {cat.articles.length}{' '}
              {cat.articles.length === 1
                ? t('help.articleCount1')
                : cat.articles.length < 5
                  ? t('help.articleCount24')
                  : t('help.articleCount5')}
            </span>
          </button>
        );
      })}
    </div>
  );

  const renderArticleList = () => {
    if (!currentCategory) return null;
    const Icon = currentCategory.icon;
    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={goCategories}
          className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 mb-6"
        >
          <ArrowLeft size={16} />
          {t('help.backToCategories')}
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
            <Icon size={20} className="text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            {t(currentCategory.labelKey)}
          </h2>
        </div>

        <div className="space-y-2">
          {currentCategory.articles.map((article) => (
            <button
              key={article.id}
              onClick={() => goArticle(currentCategory.id, article.id)}
              className="w-full text-left px-5 py-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-primary-300 dark:hover:border-primary-600 transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <BookOpen
                  size={16}
                  className="text-neutral-400 dark:text-neutral-500 group-hover:text-primary-500"
                />
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  {t(article.titleKey)}
                </span>
              </div>
              <ChevronRight size={16} className="text-neutral-400 dark:text-neutral-500" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderArticle = () => {
    if (!currentCategory || !currentArticle) return null;
    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => goCategory(currentCategory.id)}
          className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 mb-6"
        >
          <ArrowLeft size={16} />
          {t(currentCategory.labelKey)}
        </button>

        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
          {t(currentArticle.titleKey)}
        </h2>

        <div className="prose prose-neutral dark:prose-invert max-w-none text-[15px] leading-relaxed">
          {t(currentArticle.contentKey)
            .split('\n\n')
            .map((paragraph, idx) => (
              <p key={idx} className="text-neutral-700 dark:text-neutral-300 mb-4">
                {paragraph}
              </p>
            ))}
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {renderNav()}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            {t('help.title')}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">{t('help.subtitle')}</p>
        </div>

        {/* Search */}
        {renderSearch()}

        {/* Content */}
        {searchResults ? (
          renderSearchResults()
        ) : view.kind === 'categories' ? (
          renderCategoryGrid()
        ) : view.kind === 'articleList' ? (
          renderArticleList()
        ) : (
          renderArticle()
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-8 mt-12">
        <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">
          {t('help.footer')}
        </p>
      </footer>
    </div>
  );
};

export default HelpCenterPage;
