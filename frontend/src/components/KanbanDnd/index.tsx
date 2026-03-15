/**
 * Touch-compatible Kanban DnD primitives.
 *
 * Uses @dnd-kit/core (mouse + touch sensors) so drag-and-drop works on
 * iOS and Android as well as desktop. Replace all HTML5 `draggable` /
 * `onDragStart` / `onDrop` usage in board pages with these components.
 *
 * Usage:
 *   <KanbanDndContext onCardMoved={(cardId, colId) => ...}>
 *     <DroppableColumn id="col1">{(isOver) => <div className={isOver ? 'highlight' : ''}>...</div>}</DroppableColumn>
 *     <DraggableCard id="card1"><YourCardContent /></DraggableCard>
 *   </KanbanDndContext>
 */

import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { cn } from '@/lib/cn';

// ─────────────────────────────────────────────────────────────────────────────
// KanbanDndContext — wraps a board with mouse + touch drag context
// ─────────────────────────────────────────────────────────────────────────────
interface KanbanDndContextProps {
  children: React.ReactNode;
  /** Called when a card is dropped onto a column. */
  onCardMoved: (cardId: string, toColumnId: string) => void;
  /** Optional overlay shown while dragging (card ghost). Receives active card id. */
  renderOverlay?: (activeId: string) => React.ReactNode;
  /** Notified when active drag id changes (useful to dim the original card). */
  onActiveIdChange?: (id: string | null) => void;
}

export const KanbanDndContext: React.FC<KanbanDndContextProps> = ({
  children,
  onCardMoved,
  renderOverlay,
  onActiveIdChange,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Require 8px movement before drag starts — prevents accidental drags on click
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      // 200ms long-press starts drag; ≤8px movement tolerance keeps scroll working
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    const id = String(active.id);
    setActiveId(id);
    onActiveIdChange?.(id);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    onActiveIdChange?.(null);
    if (over) {
      onCardMoved(String(active.id), String(over.id));
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    onActiveIdChange?.(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      {renderOverlay && (
        <DragOverlay>{activeId ? renderOverlay(activeId) : null}</DragOverlay>
      )}
    </DndContext>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DraggableCard — makes any content draggable with mouse + touch
// ─────────────────────────────────────────────────────────────────────────────
interface DraggableCardProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  /** When true, the card cannot be dragged (e.g. while a mutation is pending). */
  disabled?: boolean;
}

export const DraggableCard: React.FC<DraggableCardProps> = ({ id, children, className, disabled }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, disabled });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn('animate-fade-in', isDragging && 'opacity-40', className)}
      // Required for TouchSensor to capture touch events before the browser
      // interprets them as scroll. Short taps (<200ms) still fire as clicks.
      style={{ touchAction: 'none' }}
    >
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DroppableColumn — makes any area a valid drop target
// ─────────────────────────────────────────────────────────────────────────────
interface DroppableColumnProps {
  id: string;
  /** Render prop — receives `isOver` so you can apply visual feedback. */
  children: (isOver: boolean) => React.ReactNode;
  className?: string;
}

export const DroppableColumn: React.FC<DroppableColumnProps> = ({ id, children, className }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className={className}>
      {children(isOver)}
    </div>
  );
};
