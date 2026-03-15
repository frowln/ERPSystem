import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Camera, Send, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { apiClient } from '@/api/client';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface QuickDefectFormProps {
  projectId: string;
  onCreated?: (defectId: string) => void;
}

type Severity = 'MINOR' | 'MEDIUM' | 'CRITICAL';

const SEVERITY_OPTIONS: Array<{ value: Severity; label: string; color: string }> = [
  { value: 'MINOR', label: 'Незначительный', color: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700' },
  { value: 'MEDIUM', label: 'Значительный', color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700' },
  { value: 'CRITICAL', label: 'Критический', color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component — optimized for mobile construction site use
// ─────────────────────────────────────────────────────────────────────────────

const QuickDefectForm: React.FC<QuickDefectFormProps> = ({ projectId, onCreated }) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<Severity>('MEDIUM');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);

    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const createDefectMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Upload photo if present
      let photoUrls: string | null = null;
      if (photoFile) {
        try {
          const formData = new FormData();
          formData.append('file', photoFile);
          const uploadRes = await apiClient.post('/api/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const url = uploadRes.data?.data?.url || uploadRes.data?.data?.fileUrl;
          if (url) {
            photoUrls = JSON.stringify([url]);
          }
        } catch {
          // Photo upload failed, proceed without photo
        }
      }

      // Step 2: Create defect
      const payload = {
        projectId,
        title,
        severity,
        photoUrls,
      };
      const { data } = await apiClient.post('/api/defects', payload);
      return data.data;
    },
    onSuccess: (data) => {
      setSubmitted(true);
      toast.success('Дефект зарегистрирован');
      if (onCreated && data?.id) onCreated(data.id);
    },
    onError: () => {
      toast.error('Ошибка при создании дефекта');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createDefectMutation.mutate();
  };

  // ── Success state ──
  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <p className="text-lg font-medium text-gray-900 dark:text-white">Дефект создан</p>
        <button
          onClick={() => {
            setTitle('');
            setSeverity('MEDIUM');
            removePhoto();
            setSubmitted(false);
          }}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          Создать ещё
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Photo capture — large touch target */}
      <div className="relative">
        {photoPreview ? (
          <div className="relative rounded-xl overflow-hidden border dark:border-neutral-700">
            <img
              src={photoPreview}
              alt="Фото дефекта"
              className="w-full max-h-48 object-cover"
            />
            <button
              type="button"
              onClick={removePhoto}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className={cn(
              'w-full flex flex-col items-center justify-center gap-2 py-8',
              'border-2 border-dashed rounded-xl transition-colors',
              'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50',
              'dark:border-neutral-600 dark:hover:border-blue-500 dark:hover:bg-blue-900/10',
              'active:bg-blue-100 dark:active:bg-blue-900/30',
            )}
          >
            <Camera className="h-8 w-8 text-gray-400 dark:text-neutral-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Сделать фото дефекта
            </span>
          </button>
        )}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoCapture}
          className="hidden"
        />
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Описание дефекта..."
        required
        maxLength={500}
        className={cn(
          'w-full px-4 py-3 rounded-lg border text-base',
          'bg-white dark:bg-neutral-900',
          'border-gray-300 dark:border-neutral-600',
          'text-gray-900 dark:text-white',
          'placeholder:text-gray-400 dark:placeholder:text-neutral-500',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
        )}
      />

      {/* Severity selector — large buttons for mobile */}
      <div className="grid grid-cols-3 gap-2">
        {SEVERITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSeverity(opt.value)}
            className={cn(
              'px-3 py-2.5 rounded-lg border text-sm font-medium transition-all',
              severity === opt.value
                ? opt.color + ' ring-2 ring-offset-1 ring-blue-500'
                : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-neutral-800 dark:text-gray-400 dark:border-neutral-700',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!title.trim() || createDefectMutation.isPending}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg',
          'text-white font-medium text-base transition-colors',
          'bg-red-600 hover:bg-red-700 active:bg-red-800',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {createDefectMutation.isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Создание...
          </>
        ) : (
          <>
            <Send className="h-5 w-5" />
            Зафиксировать дефект
          </>
        )}
      </button>

      {createDefectMutation.isError && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Не удалось создать дефект. Проверьте подключение.</span>
        </div>
      )}
    </form>
  );
};

export default QuickDefectForm;
