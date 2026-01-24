'use client';

import React, { useState } from 'react';
import { Event, EventQuestion, RegistrationResponse, TeamMemberResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    ChevronLeft,
    ChevronRight,
    Users,
    Check,
    User,
    Loader2
} from 'lucide-react';
import TeamMemberForm from './TeamMemberForm';
import DynamicRegistrationForm from './DynamicRegistrationForm';

interface TeamRegistrationWizardProps {
    event: Event;
    onSubmit: (data: {
        teamSize: number;
        teamResponses: RegistrationResponse[];
        memberResponses: TeamMemberResponse[];
    }) => void;
    isSubmitting?: boolean;
}

interface MemberData {
    name: string;
    kfupmId: string;
    kfupmEmail: string;
    responses: RegistrationResponse[];
}

// Custom brand color
const BRAND_GREEN = '#25818a';
const BRAND_GREEN_LIGHT = '#e8f4f5';
const BRAND_GREEN_RING = '#25818a20';

export default function TeamRegistrationWizard({
    event,
    onSubmit,
    isSubmitting = false,
}: TeamRegistrationWizardProps) {
    const minSize = event.minTeamSize || 2;
    const maxSize = event.maxTeamSize || 10;
    const teamQuestions = event.questions || [];
    const memberQuestions = event.memberQuestions || [];

    const [currentStep, setCurrentStep] = useState(0);
    const [teamSize, setTeamSize] = useState(minSize);
    const [teamResponses, setTeamResponses] = useState<RegistrationResponse[]>([]);
    const [members, setMembers] = useState<MemberData[]>(() =>
        Array.from({ length: minSize }, () => ({
            name: '',
            kfupmId: '',
            kfupmEmail: '',
            responses: [],
        }))
    );
    const [errors, setErrors] = useState<string[]>([]);

    const handleTeamSizeChange = (newSize: number) => {
        const clampedSize = Math.min(Math.max(newSize, minSize), maxSize);
        setTeamSize(clampedSize);
        setMembers((prev) => {
            if (clampedSize > prev.length) {
                return [...prev, ...Array.from({ length: clampedSize - prev.length }, () => ({
                    name: '', kfupmId: '', kfupmEmail: '', responses: [],
                }))];
            }
            return prev.slice(0, clampedSize);
        });
    };

    const updateMember = (index: number, updates: Partial<MemberData>) => {
        setMembers((prev) => prev.map((m, i) => (i === index ? { ...m, ...updates } : m)));
    };

    const updateMemberResponse = (memberIndex: number, questionId: string, value: string | string[]) => {
        setMembers((prev) =>
            prev.map((m, i) => {
                if (i !== memberIndex) return m;
                const existingIdx = m.responses.findIndex((r) => r.questionId === questionId);
                if (existingIdx >= 0) {
                    const newResponses = [...m.responses];
                    newResponses[existingIdx] = { questionId, value };
                    return { ...m, responses: newResponses };
                }
                return { ...m, responses: [...m.responses, { questionId, value }] };
            })
        );
    };

    // Step Logic:
    // Step 0: Team Size Selection
    // Step 1 to teamSize: Member Forms (index = step - 1)
    // Step teamSize + 1: Team Questions (Last Step)
    const teamQuestionsStep = teamSize + 1;
    const totalSteps = teamSize + 2;
    const isLastStep = currentStep === totalSteps - 1;

    const validateStep = (step: number): string[] => {
        const validationErrors: string[] = [];

        if (step === 0) {
            // Step 0 is always valid as it's just selection with a default
            return [];
        }

        if (step === teamQuestionsStep) {
            teamQuestions.forEach((q) => {
                if (q.required) {
                    const response = teamResponses.find((r) => r.questionId === q.id);
                    if (!response || !response.value || (Array.isArray(response.value) && response.value.length === 0)) {
                        validationErrors.push(`"${q.label}" is required`);
                    }
                }
            });
        } else {
            // Member Steps: 1 to teamSize
            const memberIndex = step - 1;
            const member = members[memberIndex];

            if (member) {
                if (!member.name?.trim()) validationErrors.push('Member name is required');
                if (event.requireStudentId) {
                    if (!member.kfupmEmail?.trim()) validationErrors.push('KFUPM Email is required');
                    if (!member.kfupmId?.trim()) validationErrors.push('KFUPM ID is required');
                }
                memberQuestions.forEach((q) => {
                    if (q.required) {
                        const response = member.responses?.find((r) => r.questionId === q.id);
                        if (!response || !response.value || (Array.isArray(response.value) && response.value.length === 0)) {
                            validationErrors.push(`"${q.label}" is required`);
                        }
                    }
                });
            }
        }
        return validationErrors;
    };


    const handleNext = () => {
        const validationErrors = validateStep(currentStep);
        if (validationErrors.length > 0) { setErrors(validationErrors); return; }
        setErrors([]);
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    };

    const handlePrevious = () => {
        setErrors([]);
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    };

    const handleSubmit = () => {
        const allErrors: string[] = [];
        for (let i = 0; i < totalSteps; i++) allErrors.push(...validateStep(i));
        if (allErrors.length > 0) { setErrors(allErrors); return; }
        const memberResponseData: TeamMemberResponse[] = members.map((m, i) => ({
            memberIndex: i, memberName: m.name,
            kfupmId: m.kfupmId || undefined, kfupmEmail: m.kfupmEmail || undefined,
            responses: m.responses,
        }));
        onSubmit({ teamSize, teamResponses, memberResponses: memberResponseData });
    };

    const progressPercent = ((currentStep + 1) / totalSteps) * 100;
    const goToStep = (step: number) => { if (step < currentStep) { setErrors([]); setCurrentStep(step); } };

    // Helper to get step title and description
    const getStepInfo = (step: number) => {
        if (step === 0) return { title: 'Select Team Size', desc: 'How many members are in your team?' };
        if (step === teamQuestionsStep) return { title: 'Team Setup', desc: 'Answer team questions' };
        return { title: `Team Member ${step}`, desc: `Fill in details for member ${step} of ${teamSize}` };
    };

    const { title: stepTitle, desc: stepDesc } = getStepInfo(currentStep);

    return (
        <div className="space-y-6">
            {/* Step Indicators */}
            <div className="relative">
                <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full" />
                <div
                    className="absolute top-5 left-0 h-1 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%`, backgroundColor: BRAND_GREEN }}
                />
                <div className="relative flex justify-between">
                    {Array.from({ length: totalSteps }).map((_, idx) => {
                        const isCompleted = idx < currentStep;
                        const isCurrent = idx === currentStep;
                        const isTeamStep = idx === teamQuestionsStep;
                        const isMixStep = idx === 0; // First step
                        return (
                            <button key={idx} onClick={() => goToStep(idx)} disabled={idx > currentStep}
                                className={`relative flex flex-col items-center ${idx <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${idx <= currentStep ? 'hover:scale-105' : ''}`}
                                    style={{
                                        backgroundColor: isCompleted ? BRAND_GREEN : isCurrent ? 'white' : '#f3f4f6',
                                        borderColor: isCompleted || isCurrent ? BRAND_GREEN : '#d1d5db',
                                        color: isCompleted ? 'white' : isCurrent ? BRAND_GREEN : '#9ca3af',
                                        boxShadow: isCurrent ? `0 0 0 4px ${BRAND_GREEN_RING}` : 'none',
                                    }}>
                                    {isCompleted ? <Check className="h-5 w-5" /> : isTeamStep ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                </div>
                                <span
                                    className={`mt-2 text-xs font-medium ${isCompleted ? 'text-gray-700' : 'text-gray-400'}`}
                                    style={{ color: isCurrent ? BRAND_GREEN : undefined }}>
                                    {isMixStep ? 'Size' : isTeamStep ? 'Team' : `Mem ${idx}`}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
                {/* Card Header */}
                <div className="px-6 py-4 border-b" style={{ backgroundColor: BRAND_GREEN_LIGHT, borderColor: `${BRAND_GREEN}30` }}>
                    <div className="flex items-center gap-3">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{stepTitle}</h3>
                            <p className="text-gray-500 text-sm">{stepDesc}</p>
                        </div>
                    </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                    {currentStep === 0 ? (
                        /* Step 0: Team Size Only */
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-4">
                                <Label className="text-sm font-semibold text-gray-700">How many members in your team?</Label>
                                <div className="flex flex-wrap gap-2">
                                    {Array.from({ length: maxSize - minSize + 1 }, (_, i) => minSize + i).map((size) => (
                                        <button key={size} type="button" onClick={() => handleTeamSizeChange(size)}
                                            className="cursor-pointer w-11 h-11 rounded-lg font-bold text-lg transition-all duration-200 border-2"
                                            style={{
                                                backgroundColor: teamSize === size ? BRAND_GREEN : 'white',
                                                color: teamSize === size ? 'white' : '#374151',
                                                borderColor: teamSize === size ? BRAND_GREEN : '#d1d5db',
                                            }}>
                                            {size}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-sm text-gray-500">Selected: <span className="font-semibold" style={{ color: BRAND_GREEN }}>{teamSize} members</span></p>
                            </div>
                        </div>
                    ) : currentStep === teamQuestionsStep ? (
                        /* Last Step: Team Questions */
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            {teamQuestions.length > 0 ? (
                                <DynamicRegistrationForm questions={teamQuestions} onResponsesChange={setTeamResponses} />
                            ) : (
                                <p className="text-gray-500 text-center py-8">No additional team questions. You are ready to submit.</p>
                            )}
                        </div>
                    ) : (
                        /* Member Steps (1 to teamSize) */
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <TeamMemberForm
                                memberIndex={currentStep - 1}
                                memberName={members[currentStep - 1]?.name || ''}
                                kfupmId={members[currentStep - 1]?.kfupmId}
                                kfupmEmail={members[currentStep - 1]?.kfupmEmail}
                                questions={memberQuestions}
                                responses={members[currentStep - 1]?.responses || []}
                                requireKfupm={event.requireStudentId || false}
                                onNameChange={(name) => updateMember(currentStep - 1, { name })}
                                onKfupmIdChange={(id) => updateMember(currentStep - 1, { kfupmId: id })}
                                onKfupmEmailChange={(email) => updateMember(currentStep - 1, { kfupmEmail: email })}
                                onResponseChange={(qId, val) => updateMemberResponse(currentStep - 1, qId, val)}
                            />
                        </div>
                    )}
                </div>

                {/* Errors */}
                {errors.length > 0 && (
                    <div className="mx-6 mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                        <p className="text-sm font-semibold text-red-700 mb-2">Please fix the following:</p>
                        <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                            {errors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                    </div>
                )}

                {/* Navigation */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 0}
                            className={`flex items-center gap-2 ${currentStep === 0 ? 'opacity-50' : ''}`}>
                            <ChevronLeft className="h-4 w-4" /> Previous
                        </Button>
                        <span className="text-sm text-gray-500">Step {currentStep + 1} of {totalSteps}</span>
                        {isLastStep ? (
                            <Button type="button" onClick={handleSubmit} disabled={isSubmitting}
                                className="flex items-center gap-2 text-white font-semibold"
                                style={{ backgroundColor: BRAND_GREEN }}>
                                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : <><Check className="h-4 w-4" /> Submit Registration</>}
                            </Button>
                        ) : (
                            <Button type="button" onClick={handleNext}
                                className="flex items-center gap-2 text-white font-semibold"
                                style={{ backgroundColor: BRAND_GREEN }}>
                                Next <ChevronRight className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
