'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import StatusBadge from './StatusBadge';
import { Application } from '@/types';
import { 
  X, 
  ExternalLink, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  FileText,
  Award,
  Users,
  Clock,
  Check,
  Undo2
} from 'lucide-react';

export interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
  onAccept?: (application: Application) => void;
  onReject?: (application: Application) => void;
  onUndo?: (application: Application) => void;
  className?: string;
  isProcessing?: boolean;
}

export const SlidePanel: React.FC<SlidePanelProps> = ({
  isOpen,
  onClose,
  application,
  onAccept,
  onReject,
  onUndo,
  className,
  isProcessing = false
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus the close button when panel opens
      setTimeout(() => {
        const closeButton = panelRef.current?.querySelector('[data-close-button]') as HTMLElement;
        closeButton?.focus();
      }, 100);
    } else {
      // Return focus to previous element when closing
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const formatDate = (date?: Date | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'fixed right-0 top-0 bottom-0 h-full! w-full max-w-2xl bg-white shadow-xl z-50 transform transition-transform duration-300 ease-out',
          'flex flex-col',
          
          // Mobile: Full screen bottom sheet
          'md:max-w-2xl md:border-l md:border-gray-200',
          // Mobile styles
          'sm:bottom-0 sm:top-auto sm:h-[90vh] sm:rounded-t-2xl sm:border-t sm:border-l-0',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="slide-panel-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <User className="h-6 w-6 text-gray-400 flex-shrink-0" />
              <h2 
                id="slide-panel-title"
                className="text-xl font-semibold text-gray-900 truncate"
              >
                {application.fullName}
              </h2>
              <StatusBadge status={application.status} />
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <FileText className="h-4 w-4" />
                <span>{application.programLabel}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(application.submittedAt)}</span>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-close-button
            className="flex-shrink-0 ml-4"
            aria-label="Close application details"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
            {/* Contact Information */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2 text-gray-400" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <div className="text-sm text-gray-900">{application.email}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <div className="text-sm text-gray-900">{application.mobile}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">KFUPM ID</label>
                  <div className="text-sm text-gray-900">{application.kfupmId}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Academic Year</label>
                  <div className="text-sm text-gray-900">{application.academicYear}</div>
                </div>
              </div>
            </section>

            {/* Committees */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-gray-400" />
                Committee Preferences
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {application.committees?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {application.committees.map((committee, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {committee}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">No committees specified</div>
                )}
              </div>
            </section>

            {/* Leadership */}
            {application.leadershipInterest && (
              <section>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Award className="h-5 w-5 mr-2 text-gray-400" />
                  Leadership Interest
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  {application.leadershipChoices?.length ? (
                    application.leadershipChoices.map((choice, idx) => (
                      <div key={idx} className="border-l-4 border-yellow-400 pl-4">
                        <div className="font-medium text-gray-900 mb-1">
                          Choice {choice.choice}: {choice.team}
                        </div>
                        {choice.why && (
                          <blockquote className="text-sm text-gray-600 italic">
                            "{choice.why}"
                          </blockquote>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">
                      Expressed interest in leadership but no specific choices provided
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Application Answers */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Application Responses</h3>
              <div className="space-y-4">
                {application.previous && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Previous Experience</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{application.previous}</p>
                  </div>
                )}
                
                {application.competitions && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Competitions</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{application.competitions}</p>
                  </div>
                )}
                
                {application.energy && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Energy Interest</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{application.energy}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Links & Files */}
            {(application.linkedIn || application.designLink || application.cvUrl || application.designFileUrl) && (
              <section>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Links & Files</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {application.linkedIn && (
                      <a
                        href={application.linkedIn}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <span>LinkedIn Profile</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    {application.designLink && (
                      <a
                        href={application.designLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <span>Design Portfolio</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    {application.cvUrl && (
                      <a
                        href={application.cvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <span>CV/Resume</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    {application.designFileUrl && (
                      <a
                        href={application.designFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <span>Design File</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Admin Information */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-gray-400" />
                Administrative Details
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-gray-700">Submitted At</label>
                    <div className="text-gray-900">{formatDate(application.submittedAt)}</div>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">Last Updated</label>
                    <div className="text-gray-900">{formatDate(application.updatedAt)}</div>
                  </div>
                  {application.decidedAt && (
                    <>
                      <div>
                        <label className="font-medium text-gray-700">Decided At</label>
                        <div className="text-gray-900">{formatDate(application.decidedAt)}</div>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Decided By</label>
                        <div className="text-gray-900">{application.decidedBy || '-'}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              {application.status === 'pending' ? (
                <>
                  <Button
                    onClick={() => onAccept?.(application)}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => onReject?.(application)}
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => onUndo?.(application)}
                  disabled={isProcessing}
                >
                  <Undo2 className="h-4 w-4 mr-2" />
                  Undo Decision
                </Button>
              )}
            </div>
            
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SlidePanel;