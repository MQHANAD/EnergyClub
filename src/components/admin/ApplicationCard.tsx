'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from './StatusBadge';
import { Application } from '@/types';
import {
    Check,
    X,
    ExternalLink,
    User,
    Mail,
    Phone,
    Calendar,
    ChevronDown,
    ChevronUp,
    Eye
} from 'lucide-react';

export interface ApplicationCardProps {
    application: Application;
    isSelected?: boolean;
    isExpanded?: boolean;
    onSelect?: (application: Application) => void;
    onExpand?: (application: Application) => void;
    onAccept?: (application: Application) => void;
    onReject?: (application: Application) => void;
    onViewDetails?: (application: Application) => void;
    showBulkActions?: boolean;
    density?: 'compact' | 'comfortable' | 'spacious';
    className?: string;
    isProcessing?: boolean;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
    application,
    isSelected = false,
    isExpanded = false,
    onSelect,
    onExpand,
    onAccept,
    onReject,
    onViewDetails,
    showBulkActions = false,
    density = 'comfortable',
    className,
    isProcessing = false
}) => {
    const [localExpanded, setLocalExpanded] = useState(isExpanded);

    const handleToggleExpand = () => {
        const newExpanded = !localExpanded;
        setLocalExpanded(newExpanded);
        onExpand?.(application);
    };

    const handleSelect = () => {
        if (showBulkActions) {
            onSelect?.(application);
        }
    };

    const densityStyles = {
        compact: 'p-4',
        comfortable: 'p-5',
        spacious: 'p-6'
    };

    const formatDate = (date?: Date | null) => {
        if (!date) return '-';
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const hasLinks = application.linkedIn || application.designLink || application.cvUrl || application.designFileUrl;

    return (
        <Card
            className={cn(
                'transition-all duration-200 ease-in-out cursor-pointer border border-gray-200 hover:border-gray-300 hover:shadow-md',
                {
                    'ring-2 ring-yellow-400 ring-opacity-50 border-yellow-400': isSelected,
                    'transform hover:-translate-y-0.5': !isSelected,
                    'opacity-50': isProcessing
                },
                className
            )}
            data-selected={isSelected}
            onClick={handleSelect}
        >
            <CardContent className={cn(densityStyles[density], 'space-y-4')}>

                {/* Header Row */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    {showBulkActions && (
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={handleSelect}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 h-4 w-4 text-yellow-600 rounded border-gray-300 focus:ring-yellow-500 flex-shrink-0"
                            aria-label={`Select application from ${application.fullName}`}
                        />
                    )}

                    <div className="flex-1 min-w-0 space-y-2">
                        {/* Name + Status */}
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {application.fullName}
                            </h3>
                            <StatusBadge status={application.status} size="sm" />
                        </div>

                        {/* Email */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{application.email}</span>
                        </div>

                        {/* KFUPM ID + Submitted Date */}
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                                <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span>ID: {application.kfupmId}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span>{formatDate(application.submittedAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Actions Row */}
                <div className="flex items-center space-x-2 mt-3">
                    {application.status === 'pending' && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAccept?.(application);
                                }}
                                disabled={isProcessing}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                title="Accept application"
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReject?.(application);
                                }}
                                disabled={isProcessing}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                title="Reject application"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </>
                    )}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails?.(application);
                        }}
                        title="View full details"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleToggleExpand();
                        }}
                        title={localExpanded ? 'Collapse' : 'Expand'}
                    >
                        {localExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                {/* Program Info */}
                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                    <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {application.programLabel}
                        </span>
                    </div>
                    <div className="text-sm text-gray-500">
                        {application.academicYear}
                    </div>
                </div>

                {/* Expanded Content */}
                {localExpanded && (
                    <div className="border-t border-gray-100 pt-4 space-y-4">
                        {/* Contact Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Contact</h4>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <div className="flex items-center space-x-2">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span>{application.mobile}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Committees */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Committees</h4>
                                <div className="text-sm text-gray-600">
                                    {application.committees?.length ? (
                                        <div className="flex flex-wrap gap-1">
                                            {application.committees.map((committee, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                                                >
                                                    {committee}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span>None specified</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Leadership */}
                        {application.leadershipInterest && application.leadershipChoices?.length && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Leadership Interest</h4>
                                <div className="space-y-2">
                                    {application.leadershipChoices.map((choice, idx) => (
                                        <div key={idx} className="text-sm text-gray-600">
                                            <span className="font-medium">Choice {choice.choice}:</span> {choice.team}
                                            {choice.why && (
                                                <div className="text-xs text-gray-500 mt-1 pl-4 italic">
                                                    "{choice.why}"
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Links & Files */}
                        {hasLinks && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Links & Files</h4>
                                <div className="flex flex-wrap gap-2">
                                    {application.linkedIn && (
                                        <a
                                            href={application.linkedIn}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                            <span>LinkedIn</span>
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    )}
                                    {application.designLink && (
                                        <a
                                            href={application.designLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                            <span>Design Link</span>
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    )}
                                    {application.cvUrl && (
                                        <a
                                            href={application.cvUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                            <span>CV</span>
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    )}
                                    {application.designFileUrl && (
                                        <a
                                            href={application.designFileUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                            <span>Design File</span>
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Answers Preview */}
                        {(application.previous || application.competitions || application.energy) && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Application Answers</h4>
                                <div className="space-y-2 text-sm text-gray-600">
                                    {application.previous && (
                                        <div>
                                            <span className="font-medium">Previous experience:</span>
                                            <div className="text-gray-500 text-xs mt-1 line-clamp-2">
                                                {application.previous}
                                            </div>
                                        </div>
                                    )}
                                    {application.energy && (
                                        <div>
                                            <span className="font-medium">Energy interest:</span>
                                            <div className="text-gray-500 text-xs mt-1 line-clamp-2">
                                                {application.energy}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ApplicationCard;