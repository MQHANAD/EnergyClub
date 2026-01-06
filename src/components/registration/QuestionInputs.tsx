'use client';

import React from 'react';
import { EventQuestion, RegistrationResponse } from '@/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface QuestionInputProps {
    question: EventQuestion;
    value: string | string[];
    onChange: (value: string | string[]) => void;
    error?: string;
}

/**
 * Short text input component
 */
export function ShortTextInput({ question, value, onChange, error }: QuestionInputProps) {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
                {question.label}
                {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <input
                type="text"
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={question.placeholder || ''}
                className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200 text-base ${error
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400'
                    }`}
            />
            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        </div>
    );
}

/**
 * Long text (textarea) input component
 */
export function LongTextInput({ question, value, onChange, error }: QuestionInputProps) {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
                {question.label}
                {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={question.placeholder || ''}
                rows={4}
                className={`resize-none border-2 focus:ring-2 focus:ring-offset-1 transition-all duration-200 hover:border-gray-400 text-base ${error ? 'border-red-300 focus:border-red-500' : ''
                    }`}
            />
            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        </div>
    );
}

/**
 * Radio button (single choice) input component
 */
export function RadioInput({ question, value, onChange, error }: QuestionInputProps) {
    const selectedValue = typeof value === 'string' ? value : '';

    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
                {question.label}
                {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2">
                {(question.options || []).map((option, index) => (
                    <label
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer"
                    >
                        <input
                            type="radio"
                            name={question.id}
                            value={option}
                            checked={selectedValue === option}
                            onChange={(e) => onChange(e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                    </label>
                ))}
            </div>
            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        </div>
    );
}

/**
 * Checkbox (multiple choice) input component
 */
export function CheckboxInput({ question, value, onChange, error }: QuestionInputProps) {
    const selectedValues = Array.isArray(value) ? value : [];

    const handleCheckChange = (option: string, checked: boolean) => {
        if (checked) {
            onChange([...selectedValues, option]);
        } else {
            onChange(selectedValues.filter((v) => v !== option));
        }
    };

    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
                {question.label}
                {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2">
                {(question.options || []).map((option, index) => (
                    <label
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer"
                    >
                        <input
                            type="checkbox"
                            value={option}
                            checked={selectedValues.includes(option)}
                            onChange={(e) => handleCheckChange(option, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                    </label>
                ))}
            </div>
            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        </div>
    );
}

/**
 * Dropdown (select) input component
 */
export function DropdownInput({ question, value, onChange, error }: QuestionInputProps) {
    const selectedValue = typeof value === 'string' ? value : '';

    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
                {question.label}
                {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <select
                value={selectedValue}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200 text-base ${error
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400'
                    }`}
            >
                <option value="">Select an option...</option>
                {(question.options || []).map((option, index) => (
                    <option key={index} value={option}>
                        {option}
                    </option>
                ))}
            </select>
            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        </div>
    );
}

/**
 * Yes/No radio input component
 */
export function YesNoInput({ question, value, onChange, error }: QuestionInputProps) {
    const selectedValue = typeof value === 'string' ? value : '';

    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
                {question.label}
                {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="flex gap-4">
                {['Yes', 'No'].map((option) => (
                    <label
                        key={option}
                        className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${selectedValue === option
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                            }`}
                    >
                        <input
                            type="radio"
                            name={question.id}
                            value={option}
                            checked={selectedValue === option}
                            onChange={(e) => onChange(e.target.value)}
                            className="sr-only"
                        />
                        <span className="text-sm font-medium">{option}</span>
                    </label>
                ))}
            </div>
            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        </div>
    );
}

/**
 * Renders the appropriate input component based on question type
 */
export function QuestionInput(props: QuestionInputProps) {
    switch (props.question.type) {
        case 'short_text':
            return <ShortTextInput {...props} />;
        case 'long_text':
            return <LongTextInput {...props} />;
        case 'radio':
            return <RadioInput {...props} />;
        case 'checkbox':
            return <CheckboxInput {...props} />;
        case 'dropdown':
            return <DropdownInput {...props} />;
        case 'yes_no':
            return <YesNoInput {...props} />;
        default:
            return <ShortTextInput {...props} />;
    }
}
