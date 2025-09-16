'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AcademicYearEnum,
  EnergyWeekSchema,
  EW2_COMMITTEES,
  ApplicationEnergyWeek,
} from '@/lib/registrationSchemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SharedFields from '@/components/register/SharedFields';
import LeadershipSection from '@/components/register/LeadershipSection';
import FileOrLinkInput from '@/components/register/FileOrLinkInput';
import SubmitBar from '@/components/register/SubmitBar';
import ProgressIndicator, { Step, calculateFormProgress } from '@/components/register/ProgressIndicator';
import FormSummary, { FormSummaryData } from '@/components/register/FormSummary';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, User, Users, FileText, Send, Eye } from 'lucide-react';
import {
  createApplication,
  uploadCv,
  uploadDesign,
  updateApplicationUrls,
  buildStoragePath,
  validateApplicationUrls,
  ErrorType,
  ClassifiedError,
} from '@/lib/registrations';
import { auth } from '@/lib/firebase';
import { signInAnonymously, signOut, setPersistence, inMemoryPersistence } from 'firebase/auth';

type FormValues = z.infer<typeof EnergyWeekSchema>;

function CommitteesMultiSelect({
  options,
  values,
  onToggle,
  error,
}: {
  options: readonly string[];
  values: string[];
  onToggle: (v: string, checked: boolean) => void;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-700">
        Select 1 to 3 committees you are interested in contributing to.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {options.map((opt) => {
          const checked = values.includes(opt);
          const disabled = !checked && values.length >= 3;
          const id = `committee-${opt}`;
          return (
            <label
              key={opt}
              htmlFor={id}
              className={`flex items-center gap-2 rounded-md border p-2 bg-white ${disabled ? 'opacity-60' : ''}`}
            >
              <input
                id={id}
                type="checkbox"
                className="h-4 w-4"
                checked={checked}
                disabled={disabled}
                onChange={(e) => onToggle(opt, e.target.checked)}
                aria-describedby={error ? 'committees-error' : undefined}
                aria-invalid={!!error}
              />
              <span className="text-sm">{opt}</span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id="committees-error" className="mt-1 text-sm text-red-600" aria-live="polite">
          {error}
        </p>
      )}
      <p className="text-xs text-gray-600">Selected: {values.length} / 3</p>
    </div>
  );
}

export default function EnergyWeekForm() {
  const [activeTab, setActiveTab] = useState<'energy_week_2' | 'female_energy_club'>('energy_week_2');

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isValid, isSubmitting },
    getValues,
  } = useForm<FormValues>({
    resolver: zodResolver(EnergyWeekSchema) as any,
    mode: 'onChange',
    defaultValues: {
      program: 'energy_week_2',
      fullName: '',
      email: '',
      kfupmId: '',
      mobile: '',
      academicYear: 'Freshman',
      committees: [],
      leadershipInterest: false,
      leadershipChoices: [],
      linkedIn: '',
      previous: '',
      competitions: '',
      energy: '',
      cvFile: undefined,
      designFile: undefined,
      designLink: '',
    } as unknown as FormValues,
  });

  const leadershipInterest = watch('leadershipInterest');
  const committees = watch('committees') || [];
  const academicYears = useMemo(() => AcademicYearEnum.options, []);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const formValues = watch();
  
  // Helper function to check if personal info is completed
  const isPersonalInfoCompleted = (): boolean => {
    return Boolean(
      formValues.fullName && !errors.fullName &&
      formValues.email && !errors.email &&
      formValues.kfupmId && !errors.kfupmId &&
      formValues.mobile && !errors.mobile &&
      formValues.academicYear && !errors.academicYear
    );
  };
  
  const isCommitteesCompleted = (): boolean => Boolean(committees.length > 0 && !errors.committees);
  
  const isFormValid = isPersonalInfoCompleted() && isCommitteesCompleted();
  
  // Enforce sequential completion: a step cannot be completed unless previous steps are completed
  const completedPersonal = isPersonalInfoCompleted();
  const completedCommittees = completedPersonal && isCommitteesCompleted();
  const completedAttachments = completedCommittees && true; // optional but gated by previous step
  
  const steps: Step[] = [
    {
      id: 'personal',
      title: 'Personal Info',
      description: 'Basic information',
      completed: completedPersonal,
      current: !completedPersonal && !showPreview
    },
    {
      id: 'committees',
      title: 'Committees',
      description: 'Select preferences',
      completed: completedCommittees,
      current: completedPersonal && !completedCommittees && !showPreview
    },
    {
      id: 'attachments',
      title: 'Attachments',
      description: 'Upload documents',
      completed: completedAttachments,
      current: completedPersonal && completedCommittees && !showPreview
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Preview & submit',
      completed: false,
      current: showPreview
    }
  ];

  // Prepare form summary data
  const summaryData: FormSummaryData = {
    fullName: formValues.fullName || '',
    email: formValues.email || '',
    kfupmId: formValues.kfupmId || '',
    mobile: formValues.mobile || '',
    academicYear: formValues.academicYear || '',
    linkedIn: formValues.linkedIn || undefined,
    committees: committees || [],
    leadershipInterest: formValues.leadershipInterest || false,
    leadershipChoices: formValues.leadershipChoices || [],
    previous: formValues.previous || undefined,
    competitions: formValues.competitions || undefined,
    energy: formValues.energy || undefined,
    cvFile: formValues.cvFile || undefined,
    designFile: formValues.designFile || undefined,
    designLink: formValues.designLink || undefined,
    program: 'energy_week_2'
  };

  const onToggleCommittee = useCallback(
    (opt: string, checked: boolean) => {
      const current: string[] = Array.isArray(committees) ? committees.slice() : [];
      if (checked) {
        if (!current.includes(opt)) current.push(opt);
      } else {
        const idx = current.indexOf(opt);
        if (idx >= 0) current.splice(idx, 1);
      }
      setValue('committees', current as FormValues['committees'], { shouldValidate: true });
    },
    [committees, setValue]
  );

  const doUploadsAndPatch = useCallback(
    async (applicationId: string) => {
      setUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      console.log(`[doUploadsAndPatch] Starting upload process for application ${applicationId}`);

      try {
        const v = getValues();
        let cvUrl: string | undefined;
        let designFileUrl: string | undefined;
        const uploadResults: { type: string; success: boolean; error?: ClassifiedError }[] = [];

        const cvFile = v.cvFile as unknown as File | undefined;
        const designFile = v.designFile as unknown as File | undefined;
        const designLink = (v.designLink as string | undefined)?.trim() || undefined;

        // Build storage paths for fallback
        const cvPath = cvFile ? buildStoragePath(applicationId, cvFile, 'cv') : undefined;
        const designPath = designFile ? buildStoragePath(applicationId, designFile, 'design') : undefined;

        console.log(`[doUploadsAndPatch] Files to upload: CV=${!!cvFile}, Design=${!!designFile}, DesignLink=${!!designLink}`);

        // Phase 1: Seed file paths early for data integrity
        try {
          console.log(`[doUploadsAndPatch] Phase 1: Seeding file paths`);
          if (!auth.currentUser) {
            await setPersistence(auth, inMemoryPersistence);
            await signInAnonymously(auth);
            console.log(`[doUploadsAndPatch] Authenticated anonymously for path seeding`);
          }

          await updateApplicationUrls(applicationId, {
            cvPath,
            designFilePath: designPath,
            designLink: !designFile && designLink ? designLink : undefined,
          });
          console.log(`[doUploadsAndPatch] File paths seeded successfully`);
        } catch (seedErr: any) {
          const classified = seedErr.type ? seedErr : { type: ErrorType.UNKNOWN, message: String(seedErr?.message || seedErr) };
          console.warn(`[doUploadsAndPatch] Path seeding failed:`, classified);

          if (classified.type === ErrorType.CRITICAL) {
            throw new Error(`Failed to initialize application data: ${classified.message}`);
          }
          // Continue for recoverable errors
        }

        // Phase 2: Upload files with progress tracking
        console.log(`[doUploadsAndPatch] Phase 2: Starting file uploads`);
        const cvSize = cvFile?.size ?? 0;
        const designSize = designFile?.size ?? 0;
        const totalBytes = Math.max(cvSize + designSize, 1);
        let cvPct = 0;
        let designPct = 0;

        const updateProgress = () => {
          const combined = Math.round(
            (((cvPct / 100) * cvSize) + ((designPct / 100) * designSize)) / totalBytes * 100
          );
          setUploadProgress(combined);
        };

        const uploadPromises = [];

        if (cvFile) {
          const cvUpload = uploadCv(applicationId, cvFile, (p) => {
            cvPct = p;
            updateProgress();
          }).then(url => {
            cvUrl = url;
            uploadResults.push({ type: 'CV', success: true });
            console.log(`[doUploadsAndPatch] CV upload successful: ${url}`);
            return url;
          }).catch(error => {
            const classified = error.type ? error : { type: ErrorType.UNKNOWN, message: String(error?.message || error) };
            uploadResults.push({ type: 'CV', success: false, error: classified });
            console.error(`[doUploadsAndPatch] CV upload failed:`, classified);

            if (classified.type === ErrorType.CRITICAL) {
              throw classified;
            }
            return undefined;
          });
          uploadPromises.push(cvUpload);
        }

        if (designFile) {
          const designUpload = uploadDesign(applicationId, designFile, (p) => {
            designPct = p;
            updateProgress();
          }).then(url => {
            designFileUrl = url;
            uploadResults.push({ type: 'Design', success: true });
            console.log(`[doUploadsAndPatch] Design upload successful: ${url}`);
            return url;
          }).catch(error => {
            const classified = error.type ? error : { type: ErrorType.UNKNOWN, message: String(error?.message || error) };
            uploadResults.push({ type: 'Design', success: false, error: classified });
            console.error(`[doUploadsAndPatch] Design upload failed:`, classified);

            if (classified.type === ErrorType.CRITICAL) {
              throw classified;
            }
            return undefined;
          });
          uploadPromises.push(designUpload);
        }

        await Promise.allSettled(uploadPromises);
        setUploadProgress(100);

        // Phase 3: Update Firestore with URLs
        console.log(`[doUploadsAndPatch] Phase 3: Updating Firestore with URLs`);
        if (!auth.currentUser) {
          await setPersistence(auth, inMemoryPersistence);
          await signInAnonymously(auth);
          console.log(`[doUploadsAndPatch] Re-authenticated for URL patching`);
        }

        await updateApplicationUrls(applicationId, {
          cvUrl,
          designFileUrl,
          cvPath: cvUrl ? undefined : cvPath,
          designFilePath: designFileUrl ? undefined : designPath,
          designLink: !designFile && designLink ? designLink : undefined,
        });
        console.log(`[doUploadsAndPatch] Firestore URLs updated successfully`);

        // Phase 4: Validate that URLs were saved correctly
        console.log(`[doUploadsAndPatch] Phase 4: Validating saved URLs`);
        const validation = await validateApplicationUrls(applicationId, {
          cvUrl,
          designFileUrl,
          designLink: !designFile && designLink ? designLink : undefined
        });

        if (!validation.isValid) {
          console.warn(`[doUploadsAndPatch] URL validation failed:`, validation.errors);
          const errorMsg = `Files uploaded but not properly saved. ${validation.errors.join('. ')} Please contact support with application ID: ${applicationId}`;
          setUploadError(errorMsg);
          return; // Don't throw, allow partial success
        }

        console.log(`[doUploadsAndPatch] All phases completed successfully`);

        // Check for any upload failures and provide appropriate user feedback
        const failedUploads = uploadResults.filter(r => !r.success);
        if (failedUploads.length > 0) {
          const errorMessages = failedUploads.map(r => {
            const error = r.error!;
            return `${r.type}: ${error.userMessage}`;
          });
          setUploadError(`Some uploads failed: ${errorMessages.join('; ')}`);
        }

      } catch (error: any) {
        const classified = error.type ? error : { type: ErrorType.UNKNOWN, message: String(error?.message || error) };
        console.error(`[doUploadsAndPatch] Critical error:`, classified);

        let userMessage = classified.userMessage;
        if (classified.type === ErrorType.CRITICAL) {
          userMessage = `Upload failed: ${classified.userMessage}`;
        } else if (classified.type === ErrorType.NETWORK) {
          userMessage = 'Network issues prevented file upload. Please check your connection and try again.';
        } else if (classified.type === ErrorType.AUTH) {
          userMessage = 'Authentication issues occurred. Please refresh the page and try again.';
        }

        setUploadError(userMessage);
      } finally {
        setUploading(false);
      }
    },
    [getValues]
  );

  const handleFormSubmit = async (values: FormValues) => {
    setSubmitError(null);
    setUploadError(null);
    setCreatedId(null);
    setSuccessId(null);
    setShowPreview(false); // Hide preview after starting submission

    let didAnon = false;
    let finishedOk = false;
    let createdIdLocal: string | null = null;

    try {
      // Make anonymous auth ephemeral for this session only
      await setPersistence(auth, inMemoryPersistence);

      if (!auth.currentUser) {
        await signInAnonymously(auth);
        didAnon = true;
      }

      // Temporary diagnostics
      console.debug('[submit]', {
        interest: values.leadershipInterest,
        choicesLen: values.leadershipChoices?.length ?? 0,
        linkedIn: values.linkedIn,
        designLink: values.designLink,
        choiceType: typeof values.leadershipChoices?.[0]?.choice
      });

      // Prepare payload without files
      const { cvFile, designFile, ...rest } = values as unknown as ApplicationEnergyWeek;
      const applicationId = await createApplication(rest as unknown as ApplicationEnergyWeek);
      createdIdLocal = applicationId;
      setCreatedId(applicationId);

      // Upload files (if any) and patch URLs BEFORE sign-out
      if (values.cvFile || values.designFile) {
        await doUploadsAndPatch(applicationId);
      }

      // Set success while still authenticated
      setSuccessId(applicationId);
      finishedOk = true;

      // Reset form state (no network)
      reset({
        program: 'energy_week_2',
        fullName: '',
        email: '',
        kfupmId: '',
        mobile: '',
        academicYear: 'Freshman',
        committees: [],
        leadershipInterest: false,
        leadershipChoices: [],
        linkedIn: '',
        previous: '',
        competitions: '',
        energy: '',
        cvFile: undefined,
        designFile: undefined,
        designLink: '',
      } as unknown as FormValues);
    } catch (e: any) {
      // If error occurred before doc creation, show submitError
      if (!createdIdLocal) {
        setSubmitError(e?.message || 'Submission failed. Please try again.');
      }
      // Else uploadError already set by doUploadsAndPatch
    } finally {
      // Guarantee sign-out of ephemeral anonymous session only after successful completion
      if (finishedOk && (auth.currentUser?.isAnonymous || didAnon)) {
        try {
          await signOut(auth);
        } catch (e) {
          console.warn('signOut failed', e);
        }
      }
    }
  };

  // Submit from summary view without relying on react-hook-form handleSubmit wrapper
  const submitFromSummary = async () => {
    try {
      await handleFormSubmit(getValues() as FormValues);
    } catch (e) {
      // errors are already handled/logged inside handleFormSubmit/doUploadsAndPatch
    }
  };

  if (successId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center px-4 py-8">
        <div className="mx-auto max-w-2xl w-full">
          {/* Success Animation */}
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="relative inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 animate-bounce-custom">
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
              <CheckCircle2 className="relative h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              🎉 Application Submitted!
            </h1>
            <p className="text-xl text-gray-600">
              Welcome to the Energy Week 2 journey
            </p>
          </div>

          {/* Success Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm animate-slide-in-left">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Thank you message */}
                <div className="text-center space-y-3">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Thank You for Your Interest!
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    Your Energy Week 2 application has been received and is now under review.
                    You're one step closer to joining an amazing community of energy enthusiasts.
                  </p>
                </div>

                {/* Reference ID */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Application Reference ID</p>
                      <p className="text-blue-700 font-mono text-lg">{successId}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(successId)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-100"
                    >
                      Copy ID
                    </Button>
                  </div>
                </div>

                {/* What's Next */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">What happens next?</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 text-sm font-bold">1</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Application Review</p>
                        <p className="text-gray-600 text-sm">Our team will carefully review your application within 3-5 business days.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-600 text-sm font-bold">2</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Decision Notification</p>
                        <p className="text-gray-600 text-sm">You'll receive an email with our decision and next steps.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-purple-600 text-sm font-bold">3</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Welcome to Energy Week 2</p>
                        <p className="text-gray-600 text-sm">If accepted, you'll receive onboarding information and program details.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Need help or have questions?</h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href="mailto:energy@kfupm.edu.sa"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                    >
                      📧  contact@energyhub.events
                    </a>  
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setSuccessId(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    Submit Another Application
                  </Button>
                  <Button
                    type="button"
                    onClick={() => window.location.href = '/'}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Back to Home
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <ProgressIndicator steps={steps} />
      </div>

      {showPreview ? (
        // Form Summary/Preview Mode
        <FormSummary
          data={summaryData}
          onEdit={() => setShowPreview(false)}
          onSubmit={submitFromSummary}
          isSubmitting={isSubmitting || uploading}
          programTitle="Energy Week 2"
        />
      ) : (
        // Form Input Mode
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()} noValidate>
        {/* Step 1: Personal Information */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full">
                <User className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl text-blue-900">Personal Information</CardTitle>
                <p className="text-sm text-blue-700 mt-1">Tell us about yourself</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <SharedFields<FormValues>
              register={register}
              errors={errors}
              academicYears={academicYears}
            />
          </CardContent>
        </Card>

        {/* Step 2: Committee Selection */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl text-green-900">Committee Preferences</CardTitle>
                <p className="text-sm text-green-700 mt-1">Choose where you'd like to contribute</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <CommitteesMultiSelect
              options={EW2_COMMITTEES}
              values={(committees as string[]) || []}
              onToggle={onToggleCommittee}
              error={errors.committees?.message as string | undefined}
            />
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  {...register('leadershipInterest')}
                />
                <span className="text-sm font-medium text-gray-900">I am interested in a leadership role</span>
              </label>
              <p className="text-xs text-gray-600 mt-1">
                Leadership positions offer additional responsibilities and growth opportunities
              </p>
            </div>

            {leadershipInterest && (
              <div className="mt-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
                <LeadershipSection<FormValues>
                  control={control as any}
                  register={register}
                  errors={errors}
                  name={'leadershipChoices'}
                  teamOptions={[...EW2_COMMITTEES]}
                  maxChoices={3}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Documents & Attachments */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl text-purple-900">Documents & Attachments</CardTitle>
                <p className="text-sm text-purple-700 mt-1">Upload your CV and design portfolio (optional)</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <FileOrLinkInput<FormValues>
              cvFileName={'cvFile'}
              designFileName={'designFile'}
              designLinkName={'designLink'}
              register={register}
              setValue={setValue}
              watch={watch}
              errors={errors}
            />
          </CardContent>
        </Card>

        {/* Error Display */}
        {(submitError || uploadError) && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-start gap-3 p-6">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                {submitError && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-red-800">Submission Error</h4>
                    <p className="text-sm text-red-700 mt-1">{submitError}</p>
                  </div>
                )}
                {uploadError && createdId && (
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-red-800">Upload Error</h4>
                      <p className="text-sm text-red-700 mt-1">
                        {uploadError} Your application has been created with ID:
                        <code className="ml-1 px-1 py-0.5 bg-red-100 rounded text-xs">{createdId}</code>
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!createdId) return;
                        try {
                          await doUploadsAndPatch(createdId);
                          setUploadError(null);
                          setSuccessId(createdId);
                        } catch {
                          // remain error
                        }
                      }}
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      Try upload again
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {uploading && (
          <div className="mb-3 rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800" aria-live="polite">
            Uploading attachments ({uploadProgress}%)… Please wait and do not close this tab.
          </div>
        )}

        {/* Enhanced Submit Bar */}
        <div className="sticky bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-t shadow-lg">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="whitespace-nowrap">{steps.filter(s => s.completed).length} of {steps.length} steps completed</span>
                </div>
              </div>
              <Button
                type="button"
                size="lg"
                disabled={!isFormValid || uploading}
                onClick={() => {
                  if (isFormValid) {
                    setShowPreview(true);
                  }
                }}
                className="w-full sm:w-auto sm:min-w-[200px] bg-blue-600 hover:bg-blue-700 text-white font-medium order-1 sm:order-2"
              >
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>Review Application</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
        </form>
      )}
    </div>
  );
}