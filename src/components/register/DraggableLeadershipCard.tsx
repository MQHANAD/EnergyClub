'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GripVertical, X } from 'lucide-react';

interface DragItem {
  id: string;
  choice: number;
  team: string;
  why: string;
  originalIndex: number;
}

interface DraggableLeadershipCardProps {
  item: DragItem;
  index: number;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  name: string;
  teamOptions: string[];
  // Removal is now by stable field.id (wired by parent). Do not accept index here to avoid removing wrong item when order is out of sync.
  onRemove: () => void;
  totalChoices: number;
}

const getPriorityBadgeColors = (priority: number) => {
  switch (priority) {
    case 1:
      return {
        bg: 'bg-gradient-to-r from-blue-500 to-blue-700',
        text: 'text-white',
        ring: 'ring-blue-200',
        label: '1st'
      };
    case 2:
      return {
        bg: 'bg-gradient-to-r from-green-500 to-green-700',
        text: 'text-white',
        ring: 'ring-green-200',
        label: '2nd'
      };
    case 3:
      return {
        bg: 'bg-gradient-to-r from-purple-500 to-purple-700',
        text: 'text-white',
        ring: 'ring-purple-200',
        label: '3rd'
      };
    default:
      return {
        bg: 'bg-gradient-to-r from-gray-500 to-gray-700',
        text: 'text-white',
        ring: 'ring-gray-200',
        label: `${priority}th`
      };
  }
};

export default function DraggableLeadershipCard({
  item,
  index,
  register,
  errors,
  name,
  teamOptions,
  onRemove,
  totalChoices,
}: DraggableLeadershipCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ 
    id: item.id,
    data: {
      type: 'leadership-card',
      item,
      index,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const base = `${name}.${index}` as const;
  const teamName = `${base}.team` as const;
  const whyName = `${base}.why` as const;

  const errTeam = (errors as any)?.[name]?.[index]?.team;
  const errWhy = (errors as any)?.[name]?.[index]?.why;

  const priority = index + 1;
  const badgeColors = getPriorityBadgeColors(priority);

  const cardClasses = `
    relative bg-white border-2 rounded-lg p-4 shadow-sm
    transition-all duration-200 ease-in-out
    hover:shadow-md hover:border-gray-300
    ${isDragging 
      ? 'shadow-xl border-blue-400 bg-blue-50 transform rotate-2 scale-105 z-50' 
      : ''
    }
    ${isOver && !isDragging 
      ? 'border-green-400 bg-green-50' 
      : ''
    }
    ${!isDragging ? 'border-gray-200' : ''}
  `.trim();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cardClasses}
      role="listitem"
      aria-label={`Leadership choice ${priority} of ${totalChoices}: ${item.team || 'No team selected'}`}
      aria-describedby={`choice-${index}-description`}
    >
      {/* Priority Badge */}
      <div className={`
        absolute -top-2 -left-2 w-10 h-10 rounded-full flex items-center justify-center
        text-xs font-bold shadow-md ring-4 ring-white
        ${badgeColors.bg} ${badgeColors.text}
        transition-colors duration-200
      `}>
        {badgeColors.label}
      </div>

      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div
          aria-label="Drag to reorder"
          className={`
            flex items-center justify-center w-8 h-8 mt-6 rounded-md
            bg-gray-100 hover:bg-gray-200 cursor-grab active:cursor-grabbing
            transition-colors duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
            md:w-6 md:h-6
          `}
          {...attributes}
          {...listeners}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              // Keyboard activation is handled by dnd-kit
            }
          }}
        >
          <GripVertical className="w-4 h-4 text-gray-500 md:w-3 md:h-3" aria-hidden="true" />
        </div>

        {/* Card Content */}
        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Team Selection */}
            <div>
              <Label htmlFor={`${name}-${index}-team`}>Team</Label>
              <select
                id={`${name}-${index}-team`}
                className={`
                  mt-1 block w-full rounded-md border bg-white px-3 py-2 text-sm
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                  ${errTeam ? 'border-red-500' : 'border-input'}
                `}
                {...register(teamName as any)}
                aria-invalid={!!errTeam}
                aria-describedby={errTeam ? `${name}-${index}-team-error` : undefined}
              >
                <option value="">Select a team...</option>
                {teamOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {errTeam && (
                <p 
                  id={`${name}-${index}-team-error`} 
                  className="mt-1 text-sm text-red-600" 
                  aria-live="polite"
                >
                  {String(errTeam?.message || 'Team is required')}
                </p>
              )}
            </div>

            {/* Remove Button */}
            <div className="flex items-end justify-end">
              <button
                type="button"
                className={`
                  flex items-center gap-1 px-3 py-1.5 text-sm text-red-700
                  hover:text-red-900 hover:bg-red-50 rounded-md
                  transition-colors duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500
                `}
                // Prevent dnd-kit sensors from treating this interaction as a drag start.
                // We stop propagation on pointer/mouse/keyboard so only the click handler runs.
                onPointerDown={(e) => { e.stopPropagation(); }}
                onMouseDown={(e) => { e.stopPropagation(); }}
                onKeyDown={(e) => {
                  // Prevent space/enter from starting keyboard drag while focusing the button
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove(); // parent removes by stable RHF field.id
                }}
                draggable={false}
                data-dndkit-disable-drag-listener
                aria-label="Remove this leadership preference"
              >
                <X className="w-3 h-3" aria-hidden="true" />
                Remove
              </button>
            </div>
          </div>

          {/* Why Textarea */}
          <div>
            <Label htmlFor={`${name}-${index}-why`}>
              Why this team? (optional)
            </Label>
            <Textarea
              id={`${name}-${index}-why`}
              placeholder="Explain why you want this leadership role (max 600 chars)"
              className={`
                mt-1 min-h-[80px] resize-none
                ${errWhy ? 'border-red-500' : ''}
              `}
              {...register(whyName as any)}
              aria-invalid={!!errWhy}
              aria-describedby={errWhy ? `${name}-${index}-why-error` : undefined}
              maxLength={600}
            />
            {errWhy && (
              <p 
                id={`${name}-${index}-why-error`} 
                className="mt-1 text-sm text-red-600" 
                aria-live="polite"
              >
                {String(errWhy?.message || 'Please provide a reason')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Screen Reader Instructions */}
      <div id={`choice-${index}-description`} className="sr-only">
        Use Tab to navigate to drag handle, Space or Enter to pick up, Arrow keys to move, Space or Enter to drop, Escape to cancel.
      </div>
    </div>
  );
}