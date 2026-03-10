import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Star,
  Search,
  Hash,
  Trash2,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { Input } from '@/design-system/components/FormField';
import { AssigneeAvatar } from '@/components/AssigneeAvatar';
import { messagingApi, type FavoriteMessage } from '@/api/messaging';
import { formatDateTime, formatRelativeTime } from '@/lib/format';
import { t } from '@/i18n';

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const { data: favoritesData } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => messagingApi.getMyFavorites(),
  });

  const favorites = favoritesData ?? [];

  const saveNoteMutation = useMutation({
    mutationFn: ({ messageId, note }: { messageId: string; note: string }) =>
      messagingApi.updateFavoriteNote(messageId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success(t('favorites.noteSaved'));
      setEditingNote(null);
      setNoteText('');
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: (messageId: string) => messagingApi.removeFromFavorites(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success(t('favorites.removed'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const filteredFavorites = useMemo(() => {
    if (!search) return favorites;
    const lower = search.toLowerCase();
    return favorites.filter(
      (fav) =>
        fav.message.content.toLowerCase().includes(lower) ||
        fav.message.authorName.toLowerCase().includes(lower) ||
        fav.channelName.toLowerCase().includes(lower) ||
        fav.note?.toLowerCase().includes(lower),
    );
  }, [favorites, search]);

  const handleEditNote = (favId: string, currentNote?: string) => {
    setEditingNote(favId);
    setNoteText(currentNote ?? '');
  };

  const handleSaveNote = (messageId: string) => {
    saveNoteMutation.mutate({ messageId, note: noteText });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('favorites.title')}
        subtitle={t('favorites.subtitle', { count: String(favorites.length) })}
        breadcrumbs={[
          { label: t('navigation.items.dashboard'), href: '/' },
          { label: t('messaging.channels'), href: '/messaging' },
          { label: t('favorites.title') },
        ]}
        backTo="/messaging"
      />

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('favorites.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Favorites list */}
      <div className="space-y-3">
        {filteredFavorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Star size={40} className="text-neutral-200 dark:text-neutral-700 mb-3" />
            <p className="text-base font-medium text-neutral-600 dark:text-neutral-400">
              {search ? t('favorites.noResults') : t('favorites.noFavorites')}
            </p>
            <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
              {search ? t('favorites.tryDifferentSearch') : t('favorites.addHint')}
            </p>
          </div>
        ) : (
          filteredFavorites.map((fav) => (
            <div
              key={fav.id}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 hover:shadow-sm transition-shadow"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Hash size={12} className="text-neutral-400" />
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{fav.channelName}</span>
                  <span className="text-[10px] text-neutral-300 dark:text-neutral-600">|</span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                    {t('favorites.savedAgo', { time: formatRelativeTime(fav.createdAt) })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigate('/messaging')}
                    className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded transition-colors"
                    title={t('favorites.goToMessage')}
                  >
                    <ExternalLink size={13} />
                  </button>
                  <button
                    onClick={() => removeFavoriteMutation.mutate(fav.messageId)}
                    className="p-1 text-neutral-400 hover:text-red-500 rounded transition-colors"
                    title={t('favorites.removeFromFavorites')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Message content */}
              <div className="flex gap-3">
                <AssigneeAvatar name={fav.message.authorName} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                      {fav.message.authorName}
                    </span>
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                      {formatDateTime(fav.message.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-0.5 whitespace-pre-wrap">
                    {fav.message.content}
                  </p>

                  {/* Attachments */}
                  {fav.message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {fav.message.attachments.map((att) => (
                        <span
                          key={att.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-xs text-neutral-600 dark:text-neutral-400"
                        >
                          {att.fileName}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Thread indicator */}
                  {fav.message.threadReplyCount > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-primary-600 dark:text-primary-400">
                      <MessageSquare size={11} />
                      <span>{t('favorites.repliesCount', { count: String(fav.message.threadReplyCount) })}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Note */}
              <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                {editingNote === fav.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder={t('favorites.notePlaceholder')}
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveNote(fav.messageId)}
                      className="flex-1 h-7 px-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded outline-none focus:ring-1 focus:ring-primary-200 dark:focus:ring-primary-800 dark:text-neutral-100"
                    />
                    <Button size="xs" onClick={() => handleSaveNote(fav.messageId)} loading={saveNoteMutation.isPending}>
                      {t('favorites.saveNote')}
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEditNote(fav.id, fav.note)}
                    className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                  >
                    {fav.note ? (
                      <span className="flex items-center gap-1">
                        <Star size={10} className="text-yellow-500" />
                        <span className="text-neutral-600 dark:text-neutral-400">{fav.note}</span>
                      </span>
                    ) : (
                      t('favorites.addNote')
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
