'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';
import { UseFormRegister, FieldErrors, useFieldArray, Control, useWatch } from 'react-hook-form';
import DraggableLeadershipCard from './DraggableLeadershipCard';

interface LeadershipChoice {
  choice: number;
  team: string;
  why: string;
}


interface SortableLeadershipListProps {
  control: Control<any>;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  name: string;
  teamOptions: string[];
  maxChoices?: number;
}

// Local drag UI is derived from RHF state; no transformation helpers that rebuild objects.
// This prevents accidental dropping of user-entered fields (e.g., why) during reorder.

export default function SortableLeadershipList({
  control,
  register,
  errors,
  name,
  teamOptions,
  maxChoices = 3,
}: SortableLeadershipListProps) {
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: name as any,
  });
  // Always derive live values from RHF. useWatch gives the latest deep array, including nested fields like "why".
  const watchedChoices = (useWatch({ control, name: name as any }) as (LeadershipChoice[] | undefined)) ?? [];

  // Derived items: stable id from RHF fields + current data from watched choices
  const items = useMemo(() => {
    return fields.map((f, idx) => ({
      id: String(f.id),    // RHF stable field id coerced to string (used by dnd-kit and for removal)
      index: idx,          // current RHF index
      data: watchedChoices?.[idx], // current data: { team, why, choice }
    }));
  }, [fields, watchedChoices]);

  // Map stable id -> current index, derived from RHF fields
  const idToIndex = useMemo(() => {
    const map = new Map<string, number>();
    fields.forEach((f, i) => map.set(String(f.id), i));
    return map;
  }, [fields]);
  // Local drag state
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [dragAnnouncement, setDragAnnouncement] = useState<string>('');
  // Guard to prevent form updates during initial render/effect pass
  const isFirstRenderRef = useRef(true);

  // Sensor configuration for different input methods
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum 8px movement to start drag
        delay: 100,  // 100ms delay to distinguish from click
        tolerance: 5, // 5px tolerance for accidental movements
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,    // Longer delay for touch to avoid conflicts with scroll
        tolerance: 8,   // Higher tolerance for finger precision
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );


  // After form array mutations (e.g., remove), normalize choice numbers to 1..N.
  // NOTE: Derive from live RHF values (useWatch/getValues), never from local caches, to avoid resurrecting removed items.
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    const formChoices = (watchedChoices as LeadershipChoice[]) ?? [];
    const notSequential = formChoices.some((c, idx) => c?.choice !== idx + 1);
    if (notSequential) {
      const normalized = formChoices.map((c, idx) => ({
        ...c, // preserve all current fields (e.g., why)
        choice: (idx + 1) as any,
      }));
      // Schedule replace after current render to avoid render-phase updates
      queueMicrotask(() => replace(normalized as any));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedChoices, replace]);

  // Screen reader announcement helper
  const announceToScreenReader = useCallback((message: string) => {
    setDragAnnouncement(message);
    // Clear announcement after a short delay to avoid repetition
    setTimeout(() => setDragAnnouncement(''), 1000);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);

    const from = idToIndex.get(String(active.id));
    if (from != null) {
      const teamName = (watchedChoices as LeadershipChoice[])[from]?.team || 'Unselected team';
      announceToScreenReader(`Picked up ${teamName} choice from position ${from + 1}`);
    }
  }, [idToIndex, watchedChoices, announceToScreenReader]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Optional: Add visual feedback during drag over
    // Currently handled by individual card hover states
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const from = idToIndex.get(String(active.id));
    const to = idToIndex.get(String(over.id));

    if (from == null || to == null) {
      setActiveId(null);
      return;
    }

    const current = (watchedChoices as LeadershipChoice[]) ?? [];
    const next = arrayMove(current, from, to).map((item, i) => ({
      ...item,
      choice: (i + 1) as any,
    }));

    const draggedItem = current[from];
    const teamName = draggedItem?.team || 'Unselected team';
    announceToScreenReader(`Moved ${teamName} choice to position ${to + 1}`);

    queueMicrotask(() => replace(next as any));
    setActiveId(null);
  }, [idToIndex, watchedChoices, replace, announceToScreenReader]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    announceToScreenReader('Drag cancelled');
  }, [announceToScreenReader]);

  const handleRemoveById = useCallback((rawId: string | number) => {
    const id = String(rawId);
    // Prefer O(1) lookup from the memoized map
    let idx = idToIndex.get(id);
    if (idx == null) {
      // Fallback: recompute from fields in case of stale memo
      idx = fields.findIndex((f) => String(f.id) === id);
    }
    if (idx == null || idx < 0) return;

    // Capture label before mutation for accurate SR announcement.
    const removedItem = (watchedChoices as LeadershipChoice[])[idx];
    const teamName = removedItem?.team || 'choice';

    // Remove via RHF; this mutates the field array safely.
    remove(idx);

    // Do NOT renumber here; normalization is handled post-render by the guarded effect.
    announceToScreenReader(`Removed ${teamName}`);
  }, [idToIndex, fields, remove, watchedChoices, announceToScreenReader]);

  const handleAdd = useCallback(() => {
    if (fields.length < maxChoices) {
      append({ 
        choice: (fields.length + 1) as any, 
        team: '', 
        why: '' 
      } as any);
      announceToScreenReader(`Added new choice ${fields.length + 1}`);
    }
  }, [append, fields.length, maxChoices, announceToScreenReader]);

  const canAdd = fields.length < maxChoices;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Leadership Preferences</h3>
        {canAdd && (
          <button
            type="button"
            className="text-sm text-blue-700 hover:text-blue-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 px-2 py-1 rounded"
            onClick={handleAdd}
          >
            + Add choice
          </button>
        )}
      </div>

      {/* Empty State */}
      {fields.length === 0 && (
        <p className="text-sm text-gray-600">
          You can add up to {maxChoices} leadership choices with preferred team and a short reason.
        </p>
      )}

      {/* Drag and Drop Context */}
      {items.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={items.map((it) => String(it.id))}
            strategy={verticalListSortingStrategy}
          >
            <div
              className="space-y-4"
              role="list"
              aria-label="Leadership choices (drag and drop to reorder)"
            >
              {items.map((it) => {
                const data = (it.data as LeadershipChoice | undefined) ?? undefined;
                const display = {
                  id: it.id,
                  choice: (data?.choice ?? (it.index + 1)) as any,
                  team: data?.team ?? '',
                  why: data?.why ?? '',
                  originalIndex: it.index,
                };
                return (
                  <DraggableLeadershipCard
                    key={it.id}
                    item={display}
                    index={it.index}
                    register={register}
                    errors={errors}
                    name={name}
                    teamOptions={teamOptions}
                    // Remove by stable id so we never remove the wrong item if visual order differs
                    onRemove={() => handleRemoveById(it.id)}
                    totalChoices={items.length}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Screen Reader Live Region */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        role="status"
      >
        {dragAnnouncement}
      </div>

      {/* Global Drag Instructions for Screen Readers */}
      <div id="drag-instructions" className="sr-only">
        Use Tab to navigate to items, Space or Enter to pick up, Arrow keys to move, Space or Enter to drop, Escape to cancel.
      </div>
    </div>
  );
}