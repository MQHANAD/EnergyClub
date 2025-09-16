import { z } from 'zod';

// Registration schemas for public applications

export const AcademicYearEnum = z.enum(['Oria','Freshman','Sophomore','Junior','Senior']);
export type AcademicYear = z.infer<typeof AcademicYearEnum>;

export const ProgramEnum = z.enum(['energy_week_2','female_energy_club']);
export type Program = z.infer<typeof ProgramEnum>;

// Committees lists
export const EW2_COMMITTEES = ['Expo Team','Marketing Team','Public Relations Team','Event Planning Team','Project Management Team','Tech Team','Operations & Logistics Team'] as const;
export const FEC_COMMITTEES_NO_ECE = ['Marketing','PR','Event Planning','PMO','Operations & Logistics'] as const;
export const FEC_TEAMS_WITH_ECE = ['Marketing','PR','Event Planning','PMO','Operations & Logistics','Energy Community Engagement ECE'] as const;

const emailSchema = z.string().trim().email();
const kfupmIdSchema = z.string().trim().regex(/^\d{9}$/, 'KFUPM ID must be 9 digits');
const mobileSchema = z.string().trim().regex(/^(?:\+966|0)5\d{8}$/, 'Mobile must match Saudi pattern +9665XXXXXXXX or 05XXXXXXXX');
const httpsUrl = z.string().trim().url().max(200).refine(v => v.startsWith('https://'), { message: 'URL must start with https://' });
const optionalHttpsUrl = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  httpsUrl.optional()
);
const experienceSchema = z.string().trim().max(800).optional();
const WhySchema = z.string().trim().max(600).optional();
const ChoiceNumber = z.union([z.literal(1), z.literal(2), z.literal(3)]);

// Placeholder file fields kept as any in zod to avoid SSR File reference issues.
const OptionalFile = z.any().optional();

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
  cvFile: OptionalFile, // validated client-side
  designFile: OptionalFile, // validated client-side
  selectedCommittee: z.string().optional() // The selected committee (first committee)
});

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

export const EnergyWeekSchema = SharedBase.extend({
  program: z.literal('energy_week_2'),
  committees: z.array(z.enum(EW2_COMMITTEES)).min(1).max(3)
    .refine(arr => new Set(arr).size === arr.length, { message: 'Committees must be unique' }),
  leadershipChoices: z.array(EnergyWeekLeadershipChoice).max(3).optional().default([])
}).superRefine((val, ctx) => {
  const choices = val.leadershipChoices ?? [];
  const nums = choices.map(c => c.choice);
  if (new Set(nums).size !== nums.length) {
    ctx.addIssue({ code: 'custom', path: ['leadershipChoices'], message: 'Choice numbers must be unique' });
  }
  if (val.leadershipInterest && ((choices?.length ?? 0) < 1)) {
    ctx.addIssue({
      code: 'custom',
      path: ['leadershipChoices'],
      message: 'Add at least one leadership choice'
    });
  }
});

export const FemaleEnergyClubSchema = SharedBase.extend({
  program: z.literal('female_energy_club'),
  committees: z.array(z.enum(FEC_COMMITTEES_NO_ECE)).min(1).max(3)
    .refine(arr => new Set(arr).size === arr.length, { message: 'Committees must be unique' }),
  leadershipChoices: z.array(FecLeadershipChoice).max(3).optional().default([])
}).superRefine((val, ctx) => {
  const choices = val.leadershipChoices ?? [];
  const nums = choices.map(c => c.choice);
  if (new Set(nums).size !== nums.length) {
    ctx.addIssue({ code: 'custom', path: ['leadershipChoices'], message: 'Choice numbers must be unique' });
  }
  if (val.leadershipInterest && ((choices?.length ?? 0) < 1)) {
    ctx.addIssue({
      code: 'custom',
      path: ['leadershipChoices'],
      message: 'Add at least one leadership choice'
    });
  }
  // FEC ECE rule: ECE team only allowed when leadershipInterest is true
  const hasECE = choices.some(c => c.team === 'Energy Community Engagement ECE');
  if (hasECE && !val.leadershipInterest) {
    ctx.addIssue({ code: 'custom', path: ['leadershipChoices'], message: 'ECE team can only be selected when leadership interest is true' });
  }
});

export const ApplicationSchema = z.discriminatedUnion('program', [EnergyWeekSchema, FemaleEnergyClubSchema]);

export type ApplicationEnergyWeek = z.infer<typeof EnergyWeekSchema>;
export type ApplicationFemaleEnergyClub = z.infer<typeof FemaleEnergyClubSchema>;
export type ApplicationInput = z.infer<typeof ApplicationSchema>;

export const parseApplication = (data: unknown) => ApplicationSchema.parse(data);
export const safeParseApplication = (data: unknown) => ApplicationSchema.safeParse(data);

// Helper to derive a program label
export const programLabelFor = (program: Program): 'Energy Week 2' | 'Female Energy Club' =>
  program === 'energy_week_2' ? 'Energy Week 2' : 'Female Energy Club';