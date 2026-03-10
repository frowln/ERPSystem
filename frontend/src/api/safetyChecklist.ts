import type { SafetyChecklistItem } from '@/types';

const STORAGE_KEY = 'privod-safety-checklist';

function getLocal(projectId: string): SafetyChecklistItem[] {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return data[projectId] || [];
  } catch { return []; }
}

function saveLocal(projectId: string, items: SafetyChecklistItem[]) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    data[projectId] = items;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

// TODO: No backend endpoint exists for safety checklist. Using localStorage fallback.
export const safetyChecklistApi = {
  getChecklist: async (projectId: string): Promise<SafetyChecklistItem[]> => {
    const items = getLocal(projectId);
    // Validate categories — if stale data with old categories, re-initialize
    if (items.length > 0) {
      const validCategories = new Set(['PPE', 'SITE_SECURITY', 'EMERGENCY', 'TRAINING', 'HAZARD_ASSESSMENT', 'FIRE_PROTECTION']);
      const allValid = items.every(i => validCategories.has(i.category));
      if (!allValid) {
        return safetyChecklistApi.initializeChecklist(projectId);
      }
    }
    return items;
  },

  updateItem: async (projectId: string, itemId: string, data: Partial<SafetyChecklistItem>): Promise<SafetyChecklistItem> => {
    const items = getLocal(projectId);
    const idx = items.findIndex(i => i.id === itemId);
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...data } as SafetyChecklistItem;
      saveLocal(projectId, items);
      return items[idx];
    }
    return { id: itemId, ...data } as SafetyChecklistItem;
  },

  addItem: async (projectId: string, item: Omit<SafetyChecklistItem, 'id' | 'completed'>): Promise<SafetyChecklistItem> => {
    const items = getLocal(projectId);
    const newItem: SafetyChecklistItem = {
      id: `sc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...item,
      completed: false,
    } as SafetyChecklistItem;
    items.push(newItem);
    saveLocal(projectId, items);
    return newItem;
  },

  deleteItem: async (projectId: string, itemId: string): Promise<void> => {
    const items = getLocal(projectId);
    saveLocal(projectId, items.filter(i => i.id !== itemId));
  },

  initializeChecklist: async (projectId: string): Promise<SafetyChecklistItem[]> => {
    const existing = getLocal(projectId);
    const validCategories = new Set(['PPE', 'SITE_SECURITY', 'EMERGENCY', 'TRAINING', 'HAZARD_ASSESSMENT', 'FIRE_PROTECTION']);
    const hasValidItems = existing.length > 0 && existing.every(i => validCategories.has(i.category));
    if (hasValidItems) return existing;

    const now = Date.now();
    const defaultItems: SafetyChecklistItem[] = [
      // PPE — СИЗ
      { id: `sc-${now}-1`, category: 'PPE', description: 'Каски, жилеты, очки, перчатки, обувь', completed: false, required: true },
      { id: `sc-${now}-2`, category: 'PPE', description: 'Страховочные привязи для работ на высоте', completed: false, required: true },
      // SITE_SECURITY — Охрана площадки
      { id: `sc-${now}-3`, category: 'SITE_SECURITY', description: 'Ограждение строительной площадки', completed: false, required: true },
      { id: `sc-${now}-4`, category: 'SITE_SECURITY', description: 'Пропускной режим и контроль доступа', completed: false, required: true },
      { id: `sc-${now}-5`, category: 'SITE_SECURITY', description: 'Информационные щиты и знаки безопасности', completed: false, required: false },
      // EMERGENCY — Аварийные планы
      { id: `sc-${now}-6`, category: 'EMERGENCY', description: 'План эвакуации и точки сбора', completed: false, required: true },
      { id: `sc-${now}-7`, category: 'EMERGENCY', description: 'Аптечки первой помощи', completed: false, required: true },
      { id: `sc-${now}-8`, category: 'EMERGENCY', description: 'Аварийные контакты и схема оповещения', completed: false, required: true },
      // TRAINING — Обучение
      { id: `sc-${now}-9`, category: 'TRAINING', description: 'Вводный инструктаж для всех работников', completed: false, required: true },
      { id: `sc-${now}-10`, category: 'TRAINING', description: 'Инструктаж по электробезопасности', completed: false, required: true },
      { id: `sc-${now}-11`, category: 'TRAINING', description: 'Обучение работе на высоте', completed: false, required: false },
      // HAZARD_ASSESSMENT — Оценка опасных факторов
      { id: `sc-${now}-12`, category: 'HAZARD_ASSESSMENT', description: 'Оценка рисков строительной площадки', completed: false, required: true },
      { id: `sc-${now}-13`, category: 'HAZARD_ASSESSMENT', description: 'Проверка состояния грунта и котлована', completed: false, required: false },
      // FIRE_PROTECTION — Пожарная защита
      { id: `sc-${now}-14`, category: 'FIRE_PROTECTION', description: 'Огнетушители на площадке', completed: false, required: true },
      { id: `sc-${now}-15`, category: 'FIRE_PROTECTION', description: 'Пожарные щиты и гидранты', completed: false, required: true },
      { id: `sc-${now}-16`, category: 'FIRE_PROTECTION', description: 'Пожарные проезды свободны', completed: false, required: true },
    ] as SafetyChecklistItem[];

    saveLocal(projectId, defaultItems);
    return defaultItems;
  },
};
