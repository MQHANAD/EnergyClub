'use client';

import { z } from 'zod';

// ===== Enums =====

export const RegionalTeamUniversities = [
    'KSU', 'PSU', 'Alfaisal', 'UJ', 'KAU', 'KAUST', 'Other'
] as const;

export const RegionalTeamRegions = [
    'Riyadh Regional Team',
    'Western Regional Team',
] as const;

export const RegionalTeamAcademicYears = [
    'Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'Other'
] as const;

export const RegionalTeamRoles = [
    'Public Relations Team',
    'Logistics & Operations Team',
    'Marketing & Media Team'
] as const;

export const RegionalTeamLeadershipPositions = [
    'Regional Manager',
] as const;

export const AvailabilityOptions = [
    'Yes, available for all days',
    'Available for some days',
    'Not available'
] as const;

// ===== Region Event Dates =====

export const REGION_DATES: Record<typeof RegionalTeamRegions[number], { dates: string; hackathon: string; debate: string }> = {
    'Riyadh Regional Team': {
        dates: 'Jan 25–27, 2026',
        hackathon: '25–26 Jan: Hackathon',
        debate: '27 Jan: Debate'
    },
    'Western Regional Team': {
        dates: 'Jan 20–22, 2026',
        hackathon: '20–21 Jan: Hackathon',
        debate: '22 Jan: Debate'
    },
};

// ===== Schema Helpers =====

const emailSchema = z.string().trim().email('Please enter a valid email');
const mobileSchema = z.string().trim().regex(
    /^(?:\+966|0)5\d{8}$/,
    'Mobile must match Saudi pattern +9665XXXXXXXX or 05XXXXXXXX'
);

// ===== Step Schemas =====

export const Step1Schema = z.object({
    fullName: z.string().trim().min(1, 'Full name is required').max(100),
    university: z.enum(RegionalTeamUniversities, { message: 'Please select a university' }),
    otherUniversity: z.string().trim().optional(),
    region: z.enum(RegionalTeamRegions, { message: 'Please select a region' }),
    email: emailSchema,
    mobile: mobileSchema,
    majorCollege: z.string().trim().min(1, 'Major/College is required').max(200),
    academicYear: z.enum(RegionalTeamAcademicYears, { message: 'Please select academic year' }),
    otherAcademicYear: z.string().trim().optional(),
}).superRefine((val, ctx) => {
    if (val.university === 'Other' && (!val.otherUniversity || val.otherUniversity.trim() === '')) {
        ctx.addIssue({
            code: 'custom',
            path: ['otherUniversity'],
            message: 'Please specify your university'
        });
    }
    if (val.academicYear === 'Other' && (!val.otherAcademicYear || val.otherAcademicYear.trim() === '')) {
        ctx.addIssue({
            code: 'custom',
            path: ['otherAcademicYear'],
            message: 'Please specify your academic year'
        });
    }
});

export const Step2Schema = z.object({
    previousExperience: z.string().trim().max(800).optional(),
    competitionsHackathons: z.string().trim().max(800).optional(),
    whyJoin: z.string().trim().min(1, 'This field is required').max(800),
    strengthsSkills: z.string().trim().min(1, 'This field is required').max(800),
});

export const Step3Schema = z.object({
    rolePreferences: z.array(z.enum(RegionalTeamRoles))
        .min(1, 'Please select at least 1 role')
        .max(2, 'You can select at most 2 roles'),
});

export const Step4Schema = z.object({
    leadershipInterest: z.boolean(),
    leadershipPosition: z.enum(RegionalTeamLeadershipPositions).optional(),
    whyLeadership: z.string().trim().max(600).optional(),
}).superRefine((val, ctx) => {
    if (val.leadershipInterest && !val.leadershipPosition) {
        ctx.addIssue({
            code: 'custom',
            path: ['leadershipPosition'],
            message: 'Please select a leadership position'
        });
    }
});

export const Step5Schema = z.object({
    availability: z.enum(AvailabilityOptions, { message: 'Please select your availability' }),
});

export const Step6Schema = z.object({
    cvFile: z.any().optional(),
    portfolioLink: z.string().trim().url().optional().or(z.literal('')),
    portfolioFile: z.any().optional(),
});

export const Step7Schema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm Password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

// ===== Full Schema =====

export const RegionalTeamSchema = z.object({
    program: z.literal('regional_team'),
    ...Step1Schema.shape,
    ...Step2Schema.shape,
    ...Step3Schema.shape,
    ...Step4Schema.shape,
    ...Step5Schema.shape,
    ...Step6Schema.shape,
    ...Step7Schema.shape,
});

export type RegionalTeamFormValues = z.infer<typeof RegionalTeamSchema>;

// ===== Types =====
export type Step1Values = z.infer<typeof Step1Schema>;
export type Step2Values = z.infer<typeof Step2Schema>;
export type Step3Values = z.infer<typeof Step3Schema>;
export type Step4Values = z.infer<typeof Step4Schema>;
export type Step5Values = z.infer<typeof Step5Schema>;
export type Step6Values = z.infer<typeof Step6Schema>;
export type Step7Values = z.infer<typeof Step7Schema>;
