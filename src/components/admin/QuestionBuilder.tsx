'use client';

import React, { useState } from 'react';
import { EventQuestion, QuestionType } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Plus,
    Trash2,
    GripVertical,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';

interface QuestionBuilderProps {
    questions: EventQuestion[];
    onChange: (questions: EventQuestion[]) => void;
    title?: string;  // Optional custom title for the section
}

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
    { value: 'short_text', label: 'Short Text' },
    { value: 'long_text', label: 'Long Text (Paragraph)' },
    { value: 'radio', label: 'Single Choice (Radio)' },
    { value: 'checkbox', label: 'Multiple Choice (Checkbox)' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'yes_no', label: 'Yes / No' },
];

const NEEDS_OPTIONS: QuestionType[] = ['radio', 'checkbox', 'dropdown'];

function generateId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default function QuestionBuilder({ questions, onChange, title }: QuestionBuilderProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const addQuestion = () => {
        const newQuestion: EventQuestion = {
            id: generateId(),
            type: 'short_text',
            label: '',
            required: false,
            order: questions.length,
            options: [],
            placeholder: '',
        };
        onChange([...questions, newQuestion]);
        setExpandedId(newQuestion.id);
    };

    const updateQuestion = (id: string, updates: Partial<EventQuestion>) => {
        onChange(
            questions.map((q) =>
                q.id === id ? { ...q, ...updates } : q
            )
        );
    };

    const removeQuestion = (id: string) => {
        onChange(questions.filter((q) => q.id !== id));
        if (expandedId === id) setExpandedId(null);
    };

    const moveQuestion = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= questions.length) return;

        const newQuestions = [...questions];
        [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];

        // Update order values
        newQuestions.forEach((q, i) => {
            q.order = i;
        });

        onChange(newQuestions);
    };

    const addOption = (questionId: string) => {
        const question = questions.find((q) => q.id === questionId);
        if (!question) return;

        updateQuestion(questionId, {
            options: [...(question.options || []), ''],
        });
    };

    const updateOption = (questionId: string, optionIndex: number, value: string) => {
        const question = questions.find((q) => q.id === questionId);
        if (!question || !question.options) return;

        const newOptions = [...question.options];
        newOptions[optionIndex] = value;
        updateQuestion(questionId, { options: newOptions });
    };

    const removeOption = (questionId: string, optionIndex: number) => {
        const question = questions.find((q) => q.id === questionId);
        if (!question || !question.options) return;

        updateQuestion(questionId, {
            options: question.options.filter((_, i) => i !== optionIndex),
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">{title || 'Registration Questions'}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Question
                </Button>
            </div>

            {questions.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <p className="text-gray-500 text-sm">No custom questions yet.</p>
                    <p className="text-gray-400 text-xs mt-1">
                        Click "Add Question" to create registration form fields.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {questions.map((question, index) => {
                        const isExpanded = expandedId === question.id;
                        const needsOptions = NEEDS_OPTIONS.includes(question.type);

                        return (
                            <div
                                key={question.id}
                                className="border border-gray-200 rounded-lg bg-white shadow-sm"
                            >
                                {/* Question Header */}
                                <div
                                    className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50"
                                    onClick={() => setExpandedId(isExpanded ? null : question.id)}
                                >
                                    <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />

                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium text-gray-700 truncate block">
                                            {question.label || `Question ${index + 1} (untitled)`}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {QUESTION_TYPES.find((t) => t.value === question.type)?.label}
                                            {question.required && ' • Required'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                moveQuestion(index, 'up');
                                            }}
                                            disabled={index === 0}
                                        >
                                            <ChevronUp className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                moveQuestion(index, 'down');
                                            }}
                                            disabled={index === questions.length - 1}
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeQuestion(question.id);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Expanded Editor */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50">
                                        {/* Question Label */}
                                        <div>
                                            <Label htmlFor={`label-${question.id}`} className="text-sm">
                                                Question Text
                                            </Label>
                                            <input
                                                id={`label-${question.id}`}
                                                type="text"
                                                value={question.label}
                                                onChange={(e) =>
                                                    updateQuestion(question.id, { label: e.target.value })
                                                }
                                                placeholder="Enter your question..."
                                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Question Type */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor={`type-${question.id}`} className="text-sm">
                                                    Input Type
                                                </Label>
                                                <select
                                                    id={`type-${question.id}`}
                                                    value={question.type}
                                                    onChange={(e) =>
                                                        updateQuestion(question.id, {
                                                            type: e.target.value as QuestionType,
                                                            options: NEEDS_OPTIONS.includes(e.target.value as QuestionType)
                                                                ? question.options || ['']
                                                                : [],
                                                        })
                                                    }
                                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    {QUESTION_TYPES.map((type) => (
                                                        <option key={type.value} value={type.value}>
                                                            {type.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="flex items-end">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={question.required}
                                                        onChange={(e) =>
                                                            updateQuestion(question.id, { required: e.target.checked })
                                                        }
                                                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700">Required</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Placeholder (for text inputs) */}
                                        {(question.type === 'short_text' || question.type === 'long_text') && (
                                            <div>
                                                <Label htmlFor={`placeholder-${question.id}`} className="text-sm">
                                                    Placeholder Text (optional)
                                                </Label>
                                                <input
                                                    id={`placeholder-${question.id}`}
                                                    type="text"
                                                    value={question.placeholder || ''}
                                                    onChange={(e) =>
                                                        updateQuestion(question.id, { placeholder: e.target.value })
                                                    }
                                                    placeholder="e.g., Enter your answer..."
                                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        )}

                                        {/* Options (for radio, checkbox, dropdown) */}
                                        {needsOptions && (
                                            <div>
                                                <Label className="text-sm">Options</Label>
                                                <div className="mt-2 space-y-2">
                                                    {(question.options || []).map((option, optionIndex) => (
                                                        <div key={optionIndex} className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={option}
                                                                onChange={(e) =>
                                                                    updateOption(question.id, optionIndex, e.target.value)
                                                                }
                                                                placeholder={`Option ${optionIndex + 1}`}
                                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                                                onClick={() => removeOption(question.id, optionIndex)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => addOption(question.id)}
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        Add Option
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
