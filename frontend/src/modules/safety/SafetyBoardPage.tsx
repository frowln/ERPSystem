import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, X, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { Input, Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

type SafetyStatus = 'REPORTED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';

interface SafetyCard {
  id: string;
  code: string;
  title: string;
  status: SafetyStatus;
  reporterName: string;
  assigneeName?: string;
  reportDate: string;
  projectName: string;
  severity: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  incidentType: string;
}

interface BoardColumn { id: SafetyStatus; title: string; color: string; headerBg: string; collapsed: boolean; }

const getDefaultColumns = (): BoardColumn[] => [
  { id: 'REPORTED', title: t('safety.board.columnReported'), color: 'bg-red-500', headerBg: 'bg-red-50', collapsed: false },
  { id: 'INVESTIGATING', title: t('safety.board.columnInvestigating'), color: 'bg-yellow-500', headerBg: 'bg-yellow-50', collapsed: false },
  { id: 'RESOLVED', title: t('safety.board.columnResolved'), color: 'bg-green-500', headerBg: 'bg-green-50', collapsed: false },
  { id: 'CLOSED', title: t('safety.board.columnClosed'), color: 'bg-neutral-400', headerBg: 'bg-neutral-50 dark:bg-neutral-800', collapsed: false },
];

const getSeverityLabels = (): Record<string, string> => ({
  low: t('safety.board.severityLow'), normal: t('safety.board.severityNormal'), high: t('safety.board.severityHigh'), critical: t('safety.board.severityCritical'),
});
const severityColors: Record<string, string> = { low: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600', normal: 'bg-blue-100 text-blue-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };

const SafetyBoardPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<SafetyCard[]>([]);
  const [columns, setColumns] = useState<BoardColumn[]>(getDefaultColumns());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<SafetyStatus | null>(null);

  const filtered = useMemo(() => {
    let r = items;
    if (filterStatus) r = r.filter((i) => i.status === filterStatus);
    if (searchQuery) { const q = searchQuery.toLowerCase(); r = r.filter((i) => i.title.toLowerCase().includes(q) || i.code.toLowerCase().includes(q)); }
    return r;
  }, [items, filterStatus, searchQuery]);

  const byColumn = useMemo(() => { const m: Record<string, SafetyCard[]> = {}; for (const c of columns) m[c.id] = filtered.filter((i) => i.status === c.id); return m; }, [filtered, columns]);
  const hasFilters = !!(filterStatus || searchQuery);

  const onDragStart = useCallback((e: React.DragEvent, id: string) => { e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; setDraggedId(id); }, []);
  const onDrop = useCallback((e: React.DragEvent, col: SafetyStatus) => { e.preventDefault(); if (!draggedId) return; setItems((p) => p.map((i) => (i.id === draggedId ? { ...i, status: col } : i))); setDraggedId(null); setDragOverCol(null); }, [draggedId]);
  const onDragEnd = useCallback(() => { setDraggedId(null); setDragOverCol(null); }, []);
  const toggleCol = useCallback((id: SafetyStatus) => { setColumns((p) => p.map((c) => (c.id === id ? { ...c, collapsed: !c.collapsed } : c))); }, []);

  return (
    <div className="animate-fade-in" onDragEnd={onDragEnd}>
      <PageHeader title={t('safety.board.title')} subtitle={`${items.length} ${t('safety.board.subtitleCount')}`} breadcrumbs={[{ label: t('safety.board.breadcrumbHome'), href: '/' }, { label: t('safety.board.breadcrumbSafety'), href: '/safety' }, { label: t('safety.board.breadcrumbBoard') }]} actions={<div className="flex items-center gap-2"><Button variant="secondary" size="sm" iconLeft={<Filter size={14} />} onClick={() => setShowFilters(!showFilters)} className={hasFilters ? 'border-primary-300 text-primary-600' : ''}>{t('safety.board.actionFilters')}</Button><Button iconLeft={<Plus size={16} />} onClick={() => navigate('/safety/incidents/new')}>{t('safety.board.actionReport')}</Button></div>} />
      {showFilters && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 animate-fade-in">
          <div className="relative flex-1 max-w-xs"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" /><Input placeholder={t('safety.board.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>
          <Select options={[{ value: '', label: t('safety.board.filterAllStatuses') }, ...columns.map((c) => ({ value: c.id, label: c.title }))]} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-48" />
          {hasFilters && <Button variant="ghost" size="sm" iconLeft={<X size={14} />} onClick={() => { setSearchQuery(''); setFilterStatus(''); }}>{t('safety.board.actionReset')}</Button>}
        </div>
      )}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 260px)' }}>
        {columns.map((col) => {
          const colItems = byColumn[col.id] ?? [];
          const isOver = dragOverCol === col.id;
          return (
            <div key={col.id} className={cn('flex flex-col min-w-[280px] w-[280px] rounded-xl border transition-all duration-200', isOver ? 'border-primary-400 bg-primary-50/30 shadow-md' : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50', col.collapsed && 'min-w-[48px] w-[48px]')} onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }} onDrop={(e) => onDrop(e, col.id)}>
              <div className={cn('flex items-center gap-2 px-3 py-2.5 rounded-t-xl cursor-pointer select-none', col.headerBg)} onClick={() => toggleCol(col.id)}>
                {col.collapsed ? <ChevronRight size={14} className="text-neutral-400" /> : <ChevronDown size={14} className="text-neutral-400" />}
                {!col.collapsed && (<><span className={cn('w-2 h-2 rounded-full flex-shrink-0', col.color)} /><span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex-1 truncate">{col.title}</span><span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full bg-neutral-200 text-neutral-600">{colItems.length}</span></>)}
              </div>
              {!col.collapsed && (
                <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]">
                  {colItems.length === 0 ? (<div className="flex flex-col items-center justify-center py-8 text-center"><p className="text-xs text-neutral-400">{t('safety.board.emptyColumn')}</p><p className="text-[10px] text-neutral-300 mt-0.5">{t('safety.board.emptyColumnHint')}</p></div>) : colItems.map((item) => (
                    <div key={item.id} draggable onDragStart={(e) => onDragStart(e, item.id)} onClick={() => navigate(`/safety/incidents/${item.id}`)} className={cn('bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 cursor-pointer hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600 transition-all', draggedId === item.id && 'opacity-50 shadow-lg')}>
                      <div className="flex items-center justify-between mb-1.5"><span className="text-[10px] font-mono text-neutral-400">{item.code}</span><span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', severityColors[item.severity])}>{getSeverityLabels()[item.severity]}</span></div>
                      <h4 className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-2 line-clamp-2">{item.title}</h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{item.projectName}</p>
                      <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 mb-2">{item.incidentType}</span>
                      <div className="flex items-center justify-between">
                        {item.assigneeName ? (<div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-bold">{item.assigneeName.charAt(0)}</div><span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate max-w-[100px]">{item.assigneeName}</span></div>) : <div />}
                        <span className="text-[10px] text-neutral-400">{item.reportDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {col.collapsed && (<div className="flex-1 flex items-center justify-center py-4"><span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 whitespace-nowrap" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>{col.title} ({colItems.length})</span></div>)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SafetyBoardPage;
