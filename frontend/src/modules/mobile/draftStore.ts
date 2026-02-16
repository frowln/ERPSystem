import type { CreateFieldReportRequest } from './types';

const DRAFT_STORAGE_KEY = 'mobile_field_report_draft_v1';
const SUBMISSION_QUEUE_STORAGE_KEY = 'mobile_field_report_submission_queue_v1';
const SUBMISSION_QUEUE_UPDATED_EVENT = 'mobile_submission_queue_updated';
const PHOTO_DB_NAME = 'mobile_offline_assets_v1';
const PHOTO_STORE_NAME = 'field_report_photos';
const PHOTO_DB_VERSION = 1;

export type QueueItemStatus = 'QUEUED' | 'FAILED' | 'CONFLICT';

export interface StoredMobilePhotoRef {
  assetId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  lastModified: number;
}

export interface MobileReportDraftForm {
  title: string;
  description: string;
  projectId: string;
  location: string;
  weatherCondition: string;
  temperature: string;
  workersOnSite: string;
  reportDate: string;
  photos: StoredMobilePhotoRef[];
  remoteId?: string;
  savedAt: string;
}

export interface QueuedMobileSubmission {
  id: string;
  payload: CreateFieldReportRequest;
  photos: StoredMobilePhotoRef[];
  remoteId?: string;
  status: QueueItemStatus;
  attempts: number;
  lastError?: string;
  lastTriedAt?: string;
  queuedAt: string;
}

interface StoredPhotoAsset {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  lastModified: number;
  blob: Blob;
}

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function getRandomId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePhotos(raw: unknown): StoredMobilePhotoRef[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const candidate = item as Partial<StoredMobilePhotoRef>;
      if (!candidate.assetId || !candidate.fileName) return null;
      return {
        assetId: String(candidate.assetId),
        fileName: String(candidate.fileName),
        fileType: String(candidate.fileType ?? 'application/octet-stream'),
        fileSize: Number(candidate.fileSize ?? 0),
        lastModified: Number(candidate.lastModified ?? Date.now()),
      } satisfies StoredMobilePhotoRef;
    })
    .filter((item): item is StoredMobilePhotoRef => Boolean(item));
}

function normalizeQueueStatus(raw: unknown, fallbackError?: string): QueueItemStatus {
  if (raw === 'QUEUED' || raw === 'FAILED' || raw === 'CONFLICT') return raw;
  if (fallbackError) return 'FAILED';
  return 'QUEUED';
}

function openPhotoDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is unavailable'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PHOTO_DB_NAME, PHOTO_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE_NAME)) {
        db.createObjectStore(PHOTO_STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open photo DB'));
  });
}

function normalizeDraft(raw: unknown): MobileReportDraftForm | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<MobileReportDraftForm> & { photoNames?: unknown[] };
  const normalizedDraft: MobileReportDraftForm = {
    title: String(value.title ?? ''),
    description: String(value.description ?? ''),
    projectId: String(value.projectId ?? ''),
    location: String(value.location ?? ''),
    weatherCondition: String(value.weatherCondition ?? ''),
    temperature: String(value.temperature ?? ''),
    workersOnSite: String(value.workersOnSite ?? ''),
    reportDate: String(value.reportDate ?? ''),
    photos: normalizePhotos(value.photos),
    savedAt: String(value.savedAt ?? new Date().toISOString()),
  };
  if (value.remoteId) {
    normalizedDraft.remoteId = String(value.remoteId);
  }
  return normalizedDraft;
}

function normalizeQueue(raw: unknown): QueuedMobileSubmission[] {
  if (!Array.isArray(raw)) return [];
  return raw.reduce<QueuedMobileSubmission[]>((acc, item) => {
    if (!item || typeof item !== 'object') return acc;
    const value = item as Partial<QueuedMobileSubmission> & { photoNames?: unknown[] };
    if (!value.payload || typeof value.payload !== 'object') return acc;
    const lastError = value.lastError ? String(value.lastError) : undefined;

    const normalizedItem: QueuedMobileSubmission = {
      id: value.id ? String(value.id) : getRandomId('queue'),
      payload: value.payload as CreateFieldReportRequest,
      photos: normalizePhotos(value.photos),
      status: normalizeQueueStatus(value.status, lastError),
      attempts: Number.isFinite(Number(value.attempts)) ? Number(value.attempts) : 0,
      queuedAt: value.queuedAt ? String(value.queuedAt) : new Date().toISOString(),
      ...(value.remoteId ? { remoteId: String(value.remoteId) } : {}),
      ...(lastError ? { lastError } : {}),
      ...(value.lastTriedAt ? { lastTriedAt: String(value.lastTriedAt) } : {}),
    };

    acc.push(normalizedItem);
    return acc;
  }, []);
}

function notifyQueueUpdated(queue: QueuedMobileSubmission[]): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<QueuedMobileSubmission[]>(SUBMISSION_QUEUE_UPDATED_EVENT, {
    detail: queue,
  }));
}

export function loadMobileReportDraft(): MobileReportDraftForm | null {
  if (typeof window === 'undefined') return null;
  return normalizeDraft(safeParse<unknown>(window.localStorage.getItem(DRAFT_STORAGE_KEY)));
}

export function saveMobileReportDraft(draft: MobileReportDraftForm): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function clearMobileReportDraft(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DRAFT_STORAGE_KEY);
}

export function loadMobileSubmissionQueue(): QueuedMobileSubmission[] {
  if (typeof window === 'undefined') return [];
  return normalizeQueue(safeParse<unknown>(window.localStorage.getItem(SUBMISSION_QUEUE_STORAGE_KEY)));
}

export function saveMobileSubmissionQueue(queue: QueuedMobileSubmission[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SUBMISSION_QUEUE_STORAGE_KEY, JSON.stringify(queue));
  notifyQueueUpdated(queue);
}

export function enqueueMobileSubmission(item: Omit<QueuedMobileSubmission, 'id' | 'queuedAt' | 'status' | 'attempts'>): void {
  const queue = loadMobileSubmissionQueue();
  const queueItem: QueuedMobileSubmission = {
    id: getRandomId('queue'),
    status: 'QUEUED',
    attempts: 0,
    queuedAt: new Date().toISOString(),
    ...item,
  };
  queue.push(queueItem);
  saveMobileSubmissionQueue(queue);
}

export function removeMobileSubmissionQueueItem(id: string): QueuedMobileSubmission | null {
  const queue = loadMobileSubmissionQueue();
  const index = queue.findIndex((item) => item.id === id);
  if (index === -1) return null;
  const [removed] = queue.splice(index, 1);
  saveMobileSubmissionQueue(queue);
  return removed;
}

export function updateMobileSubmissionQueueItem(
  id: string,
  updater: (item: QueuedMobileSubmission) => QueuedMobileSubmission,
): void {
  const queue = loadMobileSubmissionQueue();
  const nextQueue = queue.map((item) => (item.id === id ? updater(item) : item));
  saveMobileSubmissionQueue(nextQueue);
}

export function subscribeMobileSubmissionQueue(
  onQueueChange: (queue: QueuedMobileSubmission[]) => void,
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleQueueUpdated = (event: Event) => {
    const customEvent = event as CustomEvent<QueuedMobileSubmission[]>;
    onQueueChange(normalizeQueue(customEvent.detail));
  };

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key !== SUBMISSION_QUEUE_STORAGE_KEY) return;
    onQueueChange(loadMobileSubmissionQueue());
  };

  window.addEventListener(SUBMISSION_QUEUE_UPDATED_EVENT, handleQueueUpdated as EventListener);
  window.addEventListener('storage', handleStorageChange);

  return () => {
    window.removeEventListener(SUBMISSION_QUEUE_UPDATED_EVENT, handleQueueUpdated as EventListener);
    window.removeEventListener('storage', handleStorageChange);
  };
}

export async function storeMobilePhotoFiles(files: File[]): Promise<StoredMobilePhotoRef[]> {
  if (!files.length) return [];
  const db = await openPhotoDb();

  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(PHOTO_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(PHOTO_STORE_NAME);
      const refs: StoredMobilePhotoRef[] = files.map((file) => ({
        assetId: getRandomId('photo'),
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        lastModified: file.lastModified || Date.now(),
      }));

      refs.forEach((ref, index) => {
        const file = files[index];
        const asset: StoredPhotoAsset = {
          id: ref.assetId,
          fileName: ref.fileName,
          fileType: ref.fileType,
          fileSize: ref.fileSize,
          lastModified: ref.lastModified,
          blob: file,
        };
        store.put(asset);
      });

      transaction.oncomplete = () => resolve(refs);
      transaction.onerror = () => reject(transaction.error ?? new Error('Failed to store photos'));
    });
  } finally {
    db.close();
  }
}

export async function loadStoredMobilePhotoFile(ref: StoredMobilePhotoRef): Promise<File | null> {
  const db = await openPhotoDb();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(PHOTO_STORE_NAME, 'readonly');
      const store = transaction.objectStore(PHOTO_STORE_NAME);
      const request = store.get(ref.assetId);
      request.onsuccess = () => {
        const asset = request.result as StoredPhotoAsset | undefined;
        if (!asset?.blob) {
          resolve(null);
          return;
        }
        const file = new File([asset.blob], asset.fileName, {
          type: asset.fileType,
          lastModified: asset.lastModified,
        });
        resolve(file);
      };
      request.onerror = () => reject(request.error ?? new Error('Failed to load photo'));
    });
  } finally {
    db.close();
  }
}

export async function loadStoredMobilePhotoFiles(refs: StoredMobilePhotoRef[]): Promise<File[]> {
  const files = await Promise.all(refs.map((ref) => loadStoredMobilePhotoFile(ref)));
  return files.filter((file): file is File => Boolean(file));
}

export async function removeStoredMobilePhotoFiles(refs: StoredMobilePhotoRef[]): Promise<void> {
  if (!refs.length) return;
  const db = await openPhotoDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(PHOTO_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(PHOTO_STORE_NAME);
      refs.forEach((ref) => store.delete(ref.assetId));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Failed to remove photos'));
    });
  } finally {
    db.close();
  }
}
