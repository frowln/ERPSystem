import React, { useState, useEffect, useCallback } from 'react';
import { X, MessageSquareHeart } from 'lucide-react';
import { feedbackApi } from '@/api/feedback';
import { useAuthStore } from '@/stores/authStore';
import { t } from '@/i18n';

const DISMISSED_KEY = 'privod-feedback-dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type Phase = 'loading' | 'score' | 'comment' | 'thanks' | 'hidden';

const FeedbackWidget: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [phase, setPhase] = useState<Phase>('loading');
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setPhase('hidden');
      return;
    }

    // Check if user dismissed recently
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      if (elapsed < DISMISS_DURATION_MS) {
        setPhase('hidden');
        return;
      }
      localStorage.removeItem(DISMISSED_KEY);
    }

    // Ask backend if we should show
    feedbackApi
      .shouldShow()
      .then((shouldShow) => {
        setPhase(shouldShow ? 'score' : 'hidden');
      })
      .catch(() => {
        setPhase('hidden');
      });
  }, [isAuthenticated]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setPhase('hidden');
  }, []);

  const handleScoreSelect = useCallback((value: number) => {
    setScore(value);
    setPhase('comment');
  }, []);

  const submit = useCallback(async () => {
    if (score === null) return;
    setSubmitting(true);
    try {
      await feedbackApi.submit({
        type: 'NPS',
        score,
        comment: comment.trim() || null,
        page: window.location.pathname,
      });
      setPhase('thanks');
      setTimeout(() => setPhase('hidden'), 3000);
    } catch {
      // silently fail — not critical
      setPhase('hidden');
    } finally {
      setSubmitting(false);
    }
  }, [score, comment]);

  const skipComment = useCallback(async () => {
    if (score === null) return;
    setSubmitting(true);
    try {
      await feedbackApi.submit({
        type: 'NPS',
        score,
        comment: null,
        page: window.location.pathname,
      });
      setPhase('thanks');
      setTimeout(() => setPhase('hidden'), 3000);
    } catch {
      setPhase('hidden');
    } finally {
      setSubmitting(false);
    }
  }, [score]);

  if (phase === 'loading' || phase === 'hidden') return null;

  const scoreColor = (value: number): string => {
    if (value <= 6) return 'bg-red-500 hover:bg-red-600 text-white';
    if (value <= 8) return 'bg-yellow-400 hover:bg-yellow-500 text-neutral-900';
    return 'bg-green-500 hover:bg-green-600 text-white';
  };

  const scoreColorSelected = (value: number): string => {
    if (value <= 6) return 'ring-2 ring-red-600 bg-red-600 text-white';
    if (value <= 8) return 'ring-2 ring-yellow-500 bg-yellow-500 text-neutral-900';
    return 'ring-2 ring-green-600 bg-green-600 text-white';
  };

  return (
    <div className="fixed bottom-20 right-4 z-[9998] w-80 sm:w-96 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary-50 dark:bg-neutral-750 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <MessageSquareHeart className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
            {t('feedback.title')}
          </span>
        </div>
        <button
          onClick={dismiss}
          className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          aria-label={t('common.close')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-4">
        {phase === 'score' && (
          <>
            <p className="text-sm text-neutral-700 dark:text-neutral-200 mb-3">
              {t('feedback.npsQuestion')}
            </p>
            <div className="flex gap-1 justify-between mb-2">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handleScoreSelect(i)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md text-xs font-medium transition-all ${scoreColor(i)}`}
                  aria-label={`${i}`}
                >
                  {i}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-neutral-400 dark:text-neutral-500">
              <span>{t('feedback.unlikely')}</span>
              <span>{t('feedback.veryLikely')}</span>
            </div>
          </>
        )}

        {phase === 'comment' && (
          <>
            <p className="text-sm text-neutral-700 dark:text-neutral-200 mb-2">
              {t('feedback.commentPrompt')}
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('feedback.commentPlaceholder')}
              rows={3}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm text-neutral-800 dark:text-neutral-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={skipComment}
                disabled={submitting}
                className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              >
                {t('feedback.skip')}
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 px-4 py-1.5 rounded-lg transition-colors"
              >
                {submitting ? t('common.saving') : t('feedback.submit')}
              </button>
            </div>
            {score !== null && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-neutral-400">{t('feedback.yourScore')}:</span>
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium ${scoreColorSelected(score)}`}
                >
                  {score}
                </span>
              </div>
            )}
          </>
        )}

        {phase === 'thanks' && (
          <div className="text-center py-4">
            <p className="text-lg mb-1">&#128079;</p>
            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
              {t('feedback.thanks')}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {t('feedback.thanksDetail')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackWidget;
