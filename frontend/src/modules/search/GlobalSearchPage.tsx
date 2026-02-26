import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/api/search';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';
import type { SearchResult, SearchFilters } from './types';
import type { Project, PaginatedResponse } from '@/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const getEntityTypes = () => [
  { value: 'PROJECT', label: t('search.entityProjects'), icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  { value: 'contract', label: t('search.entityContracts'), icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { value: 'RFI', label: 'RFI', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { value: 'ISSUE', label: t('search.entityIssues'), icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' },
  { value: 'DOCUMENT', label: t('search.entityDocuments'), icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { value: 'employee', label: t('search.entityEmployees'), icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { value: 'MATERIAL', label: t('search.entityMaterials'), icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { value: 'TASK', label: t('search.entityTasks'), icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
] as const;

const getSuggestions = () => [
  t('search.suggestion1'),
  t('search.suggestion2'),
  t('search.suggestion3'),
  t('search.suggestion4'),
  t('search.suggestion5'),
];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-success-100 text-success-700',
  open: 'bg-primary-100 text-primary-700',
  closed: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600',
  draft: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600',
  in_progress: 'bg-primary-100 text-primary-700',
  completed: 'bg-success-100 text-success-700',
  overdue: 'bg-danger-100 text-danger-700',
};

const getStatusLabels = (): Record<string, string> => ({
  active: t('search.statusActive'),
  open: t('search.statusOpen'),
  closed: t('search.statusClosed'),
  draft: t('search.statusDraft'),
  in_progress: t('search.statusInProgress'),
  completed: t('search.statusCompleted'),
  overdue: t('search.statusOverdue'),
});

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const GlobalSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [projectId, setProjectId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: projectsData } = useQuery<PaginatedResponse<Project>>({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects({ page: 0, size: 100 }),
  });

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    setDebouncedQuery(q);
  }, [searchParams]);

  // Debounce the query input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (query) {
        setSearchParams({ q: query }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, setSearchParams]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filters: SearchFilters = {
    query: debouncedQuery,
    entityTypes: Array.from(selectedTypes),
    projectId: projectId || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery, filters.entityTypes, projectId, dateFrom, dateTo],
    queryFn: () => searchApi.search(debouncedQuery, filters),
    enabled: debouncedQuery.length >= 2,
  });

  const ENTITY_TYPES = getEntityTypes();
  const PROJECT_OPTIONS = [
    { value: '', label: t('search.allProjects') },
    ...(projectsData?.content ?? []).map((p) => ({ value: p.id, label: p.name })),
  ];
  const SUGGESTIONS = getSuggestions();
  const STATUS_LABELS = getStatusLabels();

  const results: SearchResult[] = data?.content ?? [];

  const toggleType = useCallback((value: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }, []);

  // Group results by entity type
  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, item) => {
    if (!acc[item.entityType]) acc[item.entityType] = [];
    acc[item.entityType].push(item);
    return acc;
  }, {});

  const entityMeta = (type: string) => ENTITY_TYPES.find((e) => e.value === type);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
  };

  const showEmpty = debouncedQuery.length >= 2 && results.length === 0 && !isLoading;
  const showSuggestions = debouncedQuery.length < 2;

  return (
    <div className="space-y-6">
      {/* Search header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t('search.title')}</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('search.subtitle')}</p>
      </div>

      {/* Large search input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search.inputPlaceholder')}
          className="w-full pl-12 pr-4 py-4 text-lg border border-neutral-300 dark:border-neutral-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
        />
        {query && (
            <button
              onClick={() => setQuery('')}
              aria-label={t('search.clearInput')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600"
            >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-6">
          {/* Entity type filters */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">{t('search.entityTypeFilter')}</h3>
            <div className="space-y-1.5">
              {ENTITY_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selectedTypes.has(type.value)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.has(type.value)}
                    onChange={() => toggleType(type.value)}
                    className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500"
                  />
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={type.icon} />
                  </svg>
                  <span className="text-sm">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Project filter */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('search.projectFilter')}</h3>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {PROJECT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Date range filter */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('search.periodFilter')}</h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400">{t('search.dateFrom')}</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400">{t('search.dateTo')}</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Clear filters */}
          {(selectedTypes.size > 0 || projectId || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setSelectedTypes(new Set());
                setProjectId('');
                setDateFrom('');
                setDateTo('');
              }}
              className="text-sm text-primary-600 hover:underline"
            >
              {t('search.clearFilters')}
            </button>
          )}
        </div>

        {/* Results area */}
        <div className="flex-1 min-w-0">
          {/* Loading skeleton */}
          {isLoading && debouncedQuery.length >= 2 && (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-neutral-200 rounded-lg" />
                    <div className="h-4 bg-neutral-200 rounded w-64" />
                  </div>
                  <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-full mt-2" />
                  <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-3/4 mt-1.5" />
                </div>
              ))}
            </div>
          )}

          {/* Search suggestions (when no query) */}
          {showSuggestions && (
            <div className="py-12 text-center">
              <svg className="w-16 h-16 text-neutral-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-medium text-neutral-600">{t('search.startTyping')}</h3>
              <p className="text-sm text-neutral-400 mt-1 mb-6">{t('search.startTypingDescription')}</p>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">{t('search.trySuggestions')}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSuggestionClick(s)}
                      className="px-3 py-1.5 text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-600 rounded-full hover:bg-primary-50 hover:text-primary-700 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {showEmpty && (
            <div className="py-12 text-center">
              <svg className="w-16 h-16 text-neutral-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <h3 className="text-lg font-medium text-neutral-600">{t('search.noResults')}</h3>
              <p className="text-sm text-neutral-400 mt-1">
                {t('search.noResultsFor', { query: debouncedQuery })}
              </p>
              <div className="mt-4">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">{t('search.recommendations')}</p>
                <ul className="text-sm text-neutral-500 dark:text-neutral-400 space-y-1">
                  <li>{t('search.recommendCheckSpelling')}</li>
                  <li>{t('search.recommendBroaderTerms')}</li>
                  <li>{t('search.recommendRemoveFilters')}</li>
                </ul>
              </div>
            </div>
          )}

          {/* Grouped results */}
          {!isLoading && Object.keys(groupedResults).length > 0 && (
            <div className="space-y-6">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {t('search.resultsFound', { count: results.length })}
              </p>

              {Object.entries(groupedResults).map(([type, items]) => {
                const meta = entityMeta(type);
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-3">
                      {meta && (
                        <svg className="w-5 h-5 text-neutral-500 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={meta.icon} />
                        </svg>
                      )}
                      <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{meta?.label || type}</h3>
                      <span className="text-xs text-neutral-400">({items.length})</span>
                    </div>
                    <div className="space-y-2">
                      {items.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className="w-full text-left border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 hover:border-primary-300 hover:shadow-sm transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 group-hover:bg-primary-50">
                              {meta && (
                                <svg className="w-4 h-4 text-neutral-500 dark:text-neutral-400 group-hover:text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={meta.icon} />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-primary-700">
                                  {result.title}
                                </h4>
                                {result.status && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[result.status] || 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600'}`}>
                                    {STATUS_LABELS[result.status] || result.status}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{result.subtitle}</p>
                              <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{result.snippet}</p>
                              <div className="flex items-center gap-3 mt-2">
                                {result.projectName && (
                                  <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded">
                                    {result.projectName}
                                  </span>
                                )}
                                <span className="text-xs text-neutral-400">{result.updatedAt}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchPage;
