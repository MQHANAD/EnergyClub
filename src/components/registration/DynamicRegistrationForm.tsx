'use client';

import React, { useState, useEffect } from 'react';
import { EventQuestion, RegistrationResponse } from '@/types';
import { QuestionInput } from './QuestionInputs';

interface DynamicRegistrationFormProps {
    questions: EventQuestion[];
    onResponsesChange: (responses: RegistrationResponse[]) => void;
    onValidationChange?: (isValid: boolean) => void;
}

interface FormErrors {
    [questionId: string]: string;
}

/**
 * Renders a dynamic registration form based on event questions
 * Handles state management and validation
 */
export default function DynamicRegistrationForm({
    questions,
    onResponsesChange,
    onValidationChange,
}: DynamicRegistrationFormProps) {
    // Store responses as a map for easy lookup/update
    const [responsesMap, setResponsesMap] = useState<Record<string, string | string[]>>({});
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Set<string>>(new Set());

    // Sort questions by order
    const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

    // Validate a single question
    const validateQuestion = (question: EventQuestion, value: string | string[]): string | null => {
        if (!question.required) return null;

        if (Array.isArray(value)) {
            // Checkbox: must have at least one selection
            if (value.length === 0) {
                return 'Please select at least one option';
            }
        } else {
            // Other types: must have non-empty string
            if (!value || value.trim() === '') {
                return 'This field is required';
            }
        }

        return null;
    };

    // Validate all questions and return whether form is valid
    const validateAll = (): boolean => {
        const newErrors: FormErrors = {};
        let isValid = true;

        sortedQuestions.forEach((question) => {
            const value = responsesMap[question.id] || (question.type === 'checkbox' ? [] : '');
            const error = validateQuestion(question, value);
            if (error) {
                newErrors[question.id] = error;
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    // Update parent with responses and validation status
    useEffect(() => {
        // Convert map to array of responses
        const responses: RegistrationResponse[] = Object.entries(responsesMap).map(
            ([questionId, value]) => ({
                questionId,
                value,
            })
        );
        onResponsesChange(responses);

        // Validate and notify parent
        if (onValidationChange) {
            const isValid = validateAll();
            onValidationChange(isValid);
        }
    }, [responsesMap]);

    // Handle value change for a question
    const handleChange = (questionId: string, value: string | string[]) => {
        setResponsesMap((prev) => ({
            ...prev,
            [questionId]: value,
        }));

        // Mark as touched
        setTouched((prev) => new Set(prev).add(questionId));

        // Clear error for this question if it was showing
        const question = sortedQuestions.find((q) => q.id === questionId);
        if (question) {
            const error = validateQuestion(question, value);
            setErrors((prev) => ({
                ...prev,
                [questionId]: error || '',
            }));
        }
    };

    if (sortedQuestions.length === 0) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Additional Information
                </h3>
                <div className="space-y-5">
                    {sortedQuestions.map((question) => {
                        const value = responsesMap[question.id] || (question.type === 'checkbox' ? [] : '');
                        const error = touched.has(question.id) ? errors[question.id] : undefined;

                        return (
                            <div key={question.id} className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <QuestionInput
                                    question={question}
                                    value={value}
                                    onChange={(newValue) => handleChange(question.id, newValue)}
                                    error={error}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/**
 * Hook to validate responses before submission
 * Returns a function to validate and get any errors
 */
export function useValidateResponses(
    questions: EventQuestion[],
    responses: RegistrationResponse[]
): () => { isValid: boolean; errors: string[] } {
    return () => {
        const errors: string[] = [];

        questions.forEach((question) => {
            if (!question.required) return;

            const response = responses.find((r) => r.questionId === question.id);
            const value = response?.value;

            if (!value) {
                errors.push(`"${question.label}" is required`);
                return;
            }

            if (Array.isArray(value) && value.length === 0) {
                errors.push(`"${question.label}" requires at least one selection`);
                return;
            }

            if (typeof value === 'string' && value.trim() === '') {
                errors.push(`"${question.label}" is required`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
        };
    };
}
