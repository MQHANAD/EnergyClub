import { z } from 'zod';

/**

* ===== Registration Schemas for Public Applications =====
* Programs: Energy Week 2, Female Energy Club, Energy Week 2 v2, Female Energy Club v2
* Includes committee choices, leadership choices, experience, and optional file fields
  */

// ------------------
// Enums & Types
// ------------------

export const AcademicYearEnum = z.enum(['Oria','Freshman','Sophomore','Junior','Senior']);
export type AcademicYear = z.infer<typeof AcademicYearEnum>;

export const ProgramEnum = z.enum([
'energy_week_2',
'female_energy_club',
'energy_week_2_v2',
'female_energy_club_v2'
]);
export type Program = z.infer<typeof ProgramEnum>;

// ------------------
// Committees
// ------------------

export const EW2_COMMITTEES = [
'Expo Team',
'Marketing Team',
'Public Relations Team',
'Event Planning Team',
'Project Management Team',
'Tech Team',
'Operations & Logistics Team'
] as const;

export const FEC_COMMITTEES_NO_ECE = [
'Marketing','PR','Event Planning','PMO','Operations & Logistics'
] as const;

export const FEC_TEAMS_WITH_ECE = [
'Marketing','PR','Event Planning','PMO','Operations & Logistics','Energy Community Engagement ECE'
] as const;

// ------------------
// Field Schemas
// ------------------

const emailSchema = z.string().trim().email();
const kfupmIdSchema = z.string().trim().regex(/^\d{9}$/, 'KFUPM ID must be 9 digits');
const mobileSchema = z.string().trim().regex(/^(?:\+966|0)5\d{8}$/, 'Mobile must match Saudi pattern +9665XXXXXXXX or 05XXXXXXXX');

const httpsUrl = z.string().trim().url().max(200)
.refine(v => v.startsWith('https://'), { message: 'URL must start with https://' });

const optionalHttpsUrl = z.preprocess(
(v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
httpsUrl.optional()
);

const experienceSchema = z.string().trim().max(800).optional();
const WhySchema = z.string().trim().max(600).optional();
const ChoiceNumber = z.union([z.literal(1), z.literal(2), z.literal(3)]);

// Placeholder file fields (SSR-safe)
const OptionalFile = z.any().optional();

// ------------------
// Shared Base Schema
// ------------------

const SharedBase = z.object({
program: ProgramEnum,
fullName: z.string().trim().min(1).max(100),
email: emailSchema,
kfupmId: kfupmIdSchema,
mobile: mobileSchema,
academicYear: AcademicYearEnum,
leadershipInterest: z.boolean(),
linkedIn: optionalHttpsUrl,
designLink: optionalHttpsUrl,
previous: experienceSchema,
competitions: experienceSchema,
energy: experienceSchema,
cvFile: OptionalFile,
designFile: OptionalFile,
selectedCommittee: z.string().optional()
});

// ------------------
// Leadership Choices
// ------------------

export const EnergyWeekLeadershipChoice = z.object({
choice: ChoiceNumber,
team: z.enum(EW2_COMMITTEES),
why: WhySchema
});

export const FecLeadershipChoice = z.object({
choice: ChoiceNumber,
team: z.enum(FEC_TEAMS_WITH_ECE),
why: WhySchema
});

// ------------------
// Program-Specific Schemas
// ------------------

// Helper to create v2 copies
const cloneWithProgram = (schema: typeof SharedBase, programLiteral: string) =>
schema.extend({
program: z.literal(programLiteral),
committees: z.array(z.enum(EW2_COMMITTEES)).min(1).max(3)
.refine(arr => new Set(arr).size === arr.length, { message: 'Committees must be unique' }),
leadershipChoices: z.array(EnergyWeekLeadershipChoice).max(3).optional().default([])
}).superRefine((val, ctx) => {
const choices = val.leadershipChoices ?? [];
const nums = choices.map(c => c.choice);

if (new Set(nums).size !== nums.length) {
  ctx.addIssue({ code: 'custom', path: ['leadershipChoices'], message: 'Choice numbers must be unique' });
}

if (val.leadershipInterest && choices.length < 1) {
  ctx.addIssue({
    code: 'custom',
    path: ['leadershipChoices'],
    message: 'Add at least one leadership choice'
  });
}

});

// Energy Week Schemas
export const EnergyWeekSchema = SharedBase.extend({
program: z.literal('energy_week_2'),
committees: z.array(z.enum(EW2_COMMITTEES))
.min(1)
.max(3)
.refine(arr => new Set(arr).size === arr.length, { message: 'Committees must be unique' }),
leadershipChoices: z.array(EnergyWeekLeadershipChoice).max(3).optional().default([])
}).superRefine((val, ctx) => {
const choices = val.leadershipChoices ?? [];
const nums = choices.map(c => c.choice);

if (new Set(nums).size !== nums.length) {
ctx.addIssue({ code: 'custom', path: ['leadershipChoices'], message: 'Choice numbers must be unique' });
}

if (val.leadershipInterest && choices.length < 1) {
ctx.addIssue({
code: 'custom',
path: ['leadershipChoices'],
message: 'Add at least one leadership choice'
});
}
});

// Energy Week v2
export const EnergyWeekSchemaV2 = cloneWithProgram(SharedBase, 'energy_week_2_v2');

// Female Energy Club Schemas
export const FemaleEnergyClubSchema = SharedBase.extend({
program: z.literal('female_energy_club'),
committees: z.array(z.enum(FEC_COMMITTEES_NO_ECE))
.min(1)
.max(3)
.refine(arr => new Set(arr).size === arr.length, { message: 'Committees must be unique' }),
leadershipChoices: z.array(FecLeadershipChoice).max(3).optional().default([])
}).superRefine((val, ctx) => {
const choices = val.leadershipChoices ?? [];
const nums = choices.map(c => c.choice);

if (new Set(nums).size !== nums.length) {
ctx.addIssue({ code: 'custom', path: ['leadershipChoices'], message: 'Choice numbers must be unique' });
}

if (val.leadershipInterest && choices.length < 1) {
ctx.addIssue({
code: 'custom',
path: ['leadershipChoices'],
message: 'Add at least one leadership choice'
});
}

// ECE team rule
const hasECE = choices.some(c => c.team === 'Energy Community Engagement ECE');
if (hasECE && !val.leadershipInterest) {
ctx.addIssue({ code: 'custom', path: ['leadershipChoices'], message: 'ECE team can only be selected when leadership interest is true' });
}
});

// Female Energy Club v2
export const FemaleEnergyClubSchemaV2 = SharedBase.extend({
program: z.literal('female_energy_club_v2'),
committees: z.array(z.enum(FEC_COMMITTEES_NO_ECE))
.min(1)
.max(3)
.refine(arr => new Set(arr).size === arr.length, { message: 'Committees must be unique' }),
leadershipChoices: z.array(FecLeadershipChoice).max(3).optional().default([])
}).superRefine((val, ctx) => {
const choices = val.leadershipChoices ?? [];
const nums = choices.map(c => c.choice);

if (new Set(nums).size !== nums.length) {
ctx.addIssue({ code: 'custom', path: ['leadershipChoices'], message: 'Choice numbers must be unique' });
}

if (val.leadershipInterest && choices.length < 1) {
ctx.addIssue({
code: 'custom',
path: ['leadershipChoices'],
message: 'Add at least one leadership choice'
});
}

const hasECE = choices.some(c => c.team === 'Energy Community Engagement ECE');
if (hasECE && !val.leadershipInterest) {
ctx.addIssue({ code: 'custom', path: ['leadershipChoices'], message: 'ECE team can only be selected when leadership interest is true' });
}
});

// ------------------
// Union Schema & Types
// ------------------

export const ApplicationSchema = z.discriminatedUnion('program', [
EnergyWeekSchema,
FemaleEnergyClubSchema,
EnergyWeekSchemaV2,
FemaleEnergyClubSchemaV2
]);

export type ApplicationEnergyWeek = z.infer<typeof EnergyWeekSchema>;
export type ApplicationFemaleEnergyClub = z.infer<typeof FemaleEnergyClubSchema>;
export type ApplicationEnergyWeekV2 = z.infer<typeof EnergyWeekSchemaV2>;
export type ApplicationFemaleEnergyClubV2 = z.infer<typeof FemaleEnergyClubSchemaV2>;
export type ApplicationInput = z.infer<typeof ApplicationSchema>;

// ------------------
// Parsing & Helpers
// ------------------

export const parseApplication = (data: unknown) => ApplicationSchema.parse(data);
export const safeParseApplication = (data: unknown) => ApplicationSchema.safeParse(data);

export const programLabelFor = (program: Program): string => {
switch (program) {
case 'energy_week_2': return 'Energy Week 2';
case 'female_energy_club': return 'Female Energy Club';
case 'energy_week_2_v2': return 'Energy Week 2 v2';
case 'female_energy_club_v2': return 'Female Energy Club v2';
}
};
