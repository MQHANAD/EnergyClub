'use client';

import React, { useState } from 'react';
import { Registration, EventQuestion, RegistrationResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Download, Check, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface ResponsesTableProps {
    registrations: Registration[];
    questions: EventQuestion[];
    onExport?: () => void;
    onApprove?: (id: string) => void;
    onReject?: (id: string) => void;
    processingId?: string | null;
}

/**
 * Displays all registrations with expandable rows to view dynamic form responses
 * Optimized for events with many questions (10+)
 */
export default function ResponsesTable({
    registrations,
    questions,
    onExport,
    onApprove,
    onReject,
    processingId,
}: ResponsesTableProps) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Sort questions by order
    const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

    // Toggle row expansion
    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // Expand all rows
    const expandAll = () => {
        setExpandedIds(new Set(registrations.map((r) => r.id)));
    };

    // Collapse all rows
    const collapseAll = () => {
        setExpandedIds(new Set());
    };

    // Get the display value for a response
    const getResponseValue = (
        responses: RegistrationResponse[] | undefined,
        questionId: string
    ): string => {
        if (!responses) return '-';
        const response = responses.find((r) => r.questionId === questionId);
        if (!response) return '-';

        if (Array.isArray(response.value)) {
            return response.value.length > 0 ? response.value.join(', ') : '-';
        }
        return response.value || '-';
    };

    // Format registration status with color
    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            confirmed: 'bg-green-100 text-green-800 border-green-200',
            waitlist: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200',
            checked_in: 'bg-blue-100 text-blue-800 border-blue-200',
        };
        return (
            <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}
            >
                {status.replace('_', ' ')}
            </span>
        );
    };

    if (registrations.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No registrations yet.</p>
            </div>
        );
    }

    const hasQuestions = sortedQuestions.length > 0;

    return (
        <div className="space-y-4">
            {/* Header with controls */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-600 font-medium">
                        {registrations.length} registration{registrations.length !== 1 ? 's' : ''}
                    </p>
                    {hasQuestions && (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={expandAll}
                                className="text-xs h-7"
                            >
                                Expand All
                            </Button>
                            <span className="text-gray-300">|</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={collapseAll}
                                className="text-xs h-7"
                            >
                                Collapse All
                            </Button>
                        </div>
                    )}
                </div>
                {onExport && (
                    <Button variant="outline" size="sm" onClick={onExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export to Excel
                    </Button>
                )}
            </div>

            {/* Registration Cards */}
            <div className="space-y-3">
                {registrations.map((registration) => {
                    const isExpanded = expandedIds.has(registration.id);
                    const isProcessing = processingId === registration.id;

                    return (
                        <div
                            key={registration.id}
                            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                            {/* Main Row - Always Visible */}
                            <div
                                className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors ${hasQuestions ? '' : 'cursor-default'
                                    }`}
                                onClick={() => hasQuestions && toggleExpand(registration.id)}
                            >
                                {/* Expand Toggle */}
                                {hasQuestions && (
                                    <button
                                        className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleExpand(registration.id);
                                        }}
                                    >
                                        {isExpanded ? (
                                            <ChevronUp className="h-5 w-5 text-gray-500" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-gray-400" />
                                        )}
                                    </button>
                                )}

                                {/* User Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h3 className="font-semibold text-gray-900 truncate">
                                            {registration.userName}
                                        </h3>
                                        {getStatusBadge(registration.status)}
                                    </div>
                                    <p className="text-sm text-gray-500 truncate mt-0.5">
                                        {registration.userEmail}
                                    </p>
                                </div>

                                {/* Quick Info */}
                                <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500">
                                    {registration.studentId && (
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-gray-400">Student ID</span>
                                            <span className="font-medium text-gray-700">{registration.studentId}</span>
                                        </div>
                                    )}
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs text-gray-400">Registered</span>
                                        <span className="font-medium text-gray-700">
                                            {new Date(registration.registrationTime).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                {(onApprove || onReject) && (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {onApprove && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 w-9 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 hover:border-green-300"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onApprove(registration.id);
                                                }}
                                                disabled={isProcessing || registration.status === 'confirmed'}
                                                title="Approve"
                                            >
                                                {isProcessing ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Check className="h-4 w-4" />
                                                )}
                                            </Button>
                                        )}
                                        {onReject && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onReject(registration.id);
                                                }}
                                                disabled={isProcessing || registration.status === 'cancelled'}
                                                title="Reject"
                                            >
                                                {isProcessing ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <X className="h-4 w-4" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && hasQuestions && (
                                <div className="border-t border-gray-100 bg-gradient-to-b from-gray-50/80 to-white">
                                    {/* Mobile Quick Info */}
                                    <div className="sm:hidden px-4 py-3 border-b border-gray-100 flex gap-4 text-sm">
                                        {registration.studentId && (
                                            <div>
                                                <span className="text-gray-400">Student ID: </span>
                                                <span className="font-medium text-gray-700">{registration.studentId}</span>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-gray-400">Registered: </span>
                                            <span className="font-medium text-gray-700">
                                                {new Date(registration.registrationTime).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Questions & Answers Grid */}
                                    <div className="p-4">
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                            Form Responses ({sortedQuestions.length})
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {sortedQuestions.map((question, index) => {
                                                const answer = getResponseValue(registration.responses, question.id);
                                                return (
                                                    <div
                                                        key={question.id}
                                                        className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm"
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">
                                                                {index + 1}
                                                            </span>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-700 leading-snug">
                                                                    {question.label}
                                                                    {question.required && (
                                                                        <span className="text-red-500 ml-0.5">*</span>
                                                                    )}
                                                                </p>
                                                                <p className={`mt-1.5 text-sm ${answer === '-'
                                                                        ? 'text-gray-400 italic'
                                                                        : 'text-gray-900'
                                                                    }`}>
                                                                    {answer}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
