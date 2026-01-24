'use client';

import React from 'react';
import { EventQuestion, RegistrationResponse } from '@/types';
import { Label } from '@/components/ui/label';
import {
    ShortTextInput,
    LongTextInput,
    RadioInput,
    CheckboxInput,
    DropdownInput,
    YesNoInput,
} from './QuestionInputs';

interface TeamMemberFormProps {
    memberIndex: number;
    memberName: string;
    kfupmId?: string;
    kfupmEmail?: string;
    questions: EventQuestion[];
    responses: RegistrationResponse[];
    requireKfupm: boolean;
    onNameChange: (name: string) => void;
    onKfupmIdChange?: (id: string) => void;
    onKfupmEmailChange?: (email: string) => void;
    onResponseChange: (questionId: string, value: string | string[]) => void;
}

/**
 * Form for a single team member's information and question responses
 */
export default function TeamMemberForm({
    memberIndex,
    memberName,
    kfupmId,
    kfupmEmail,
    questions,
    responses,
    requireKfupm,
    onNameChange,
    onKfupmIdChange,
    onKfupmEmailChange,
    onResponseChange,
}: TeamMemberFormProps) {
    const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

    const getResponseValue = (questionId: string): string | string[] => {
        const response = responses.find((r) => r.questionId === questionId);
        return response?.value ?? '';
    };

    return (
        <div className="space-y-6">
            {/* Member Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
                    {memberIndex + 1}
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        Team Member {memberIndex + 1}
                    </h3>
                    <p className="text-sm text-gray-500">
                        Fill in the details for this team member
                    </p>
                </div>
            </div>

            {/* Member Name */}
            <div className="space-y-2">
                <Label htmlFor={`member-name-${memberIndex}`} className="text-sm font-semibold text-gray-700">
                    Member Name
                    <span className="text-red-500 ml-1">*</span>
                </Label>
                <input
                    id={`member-name-${memberIndex}`}
                    type="text"
                    value={memberName}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="Enter member's full name"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all"
                    required
                />
            </div>

            {/* KFUPM Fields (if required) */}
            {requireKfupm && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor={`kfupm-email-${memberIndex}`} className="text-sm font-semibold text-gray-700">
                            KFUPM Email
                            <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <input
                            id={`kfupm-email-${memberIndex}`}
                            type="email"
                            value={kfupmEmail || ''}
                            onChange={(e) => onKfupmEmailChange?.(e.target.value)}
                            placeholder="s20xxxxxxx@kfupm.edu.sa"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`kfupm-id-${memberIndex}`} className="text-sm font-semibold text-gray-700">
                            KFUPM ID
                            <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <input
                            id={`kfupm-id-${memberIndex}`}
                            type="text"
                            value={kfupmId || ''}
                            onChange={(e) => onKfupmIdChange?.(e.target.value)}
                            placeholder="Enter KFUPM ID"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all"
                            required
                        />
                    </div>
                </>
            )}

            {/* Dynamic Questions */}
            {sortedQuestions.length > 0 && (
                <div className="space-y-5 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                        Questions for this member
                    </h4>
                    {sortedQuestions.map((question) => {
                        const value = getResponseValue(question.id);
                        const commonProps = {
                            question,
                            value,
                            onChange: (v: string | string[]) => onResponseChange(question.id, v),
                        };

                        switch (question.type) {
                            case 'short_text':
                                return <ShortTextInput key={question.id} {...commonProps} value={value as string} onChange={(v) => onResponseChange(question.id, v)} />;
                            case 'long_text':
                                return <LongTextInput key={question.id} {...commonProps} value={value as string} onChange={(v) => onResponseChange(question.id, v)} />;
                            case 'radio':
                                return <RadioInput key={question.id} {...commonProps} value={value as string} onChange={(v) => onResponseChange(question.id, v)} />;
                            case 'checkbox':
                                return <CheckboxInput key={question.id} {...commonProps} value={Array.isArray(value) ? value : []} onChange={(v) => onResponseChange(question.id, v)} />;
                            case 'dropdown':
                                return <DropdownInput key={question.id} {...commonProps} value={value as string} onChange={(v) => onResponseChange(question.id, v)} />;
                            case 'yes_no':
                                return <YesNoInput key={question.id} {...commonProps} value={value as string} onChange={(v) => onResponseChange(question.id, v)} />;
                            default:
                                return null;
                        }
                    })}
                </div>
            )}
        </div>
    );
}
