'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  LinkedinIcon, 
  Users, 
  Crown, 
  FileText, 
  Link,
  Edit,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';

export interface FormSummaryData {
  // Personal Info
  fullName: string;
  email: string;
  kfupmId: string;
  mobile: string;
  academicYear: string;
  linkedIn?: string;
  
  // Committees & Leadership
  committees: string[];
  leadershipInterest: boolean;
  leadershipChoices?: Array<{
    choice: number;
    team: string;
    why?: string;
  }>;
  
  // Experience (optional)
  previous?: string;
  competitions?: string;
  energy?: string;
  
  // Files
  cvFile?: File;
  designFile?: File;
  designLink?: string;
  
  // Program info
  program: 'energy_week_2' | 'female_energy_club' | 'energy_week_2_v2' | 'female_energy_club_v2';
}

interface FormSummaryProps {
  data: FormSummaryData;
  onEdit: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  programTitle: string;
}

export default function FormSummary({ 
  data, 
  onEdit, 
  onSubmit, 
  isSubmitting = false,
  programTitle 
}: FormSummaryProps) {
  const hasOptionalInfo = data.previous || data.competitions || data.energy;
  const hasFiles = data.cvFile || data.designFile || data.designLink;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Application</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Please review all the information below before submitting your application for {programTitle}.
          You can edit any section if needed.
        </p>
      </div>

      {/* Personal Information */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-blue-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg text-blue-900">Personal Information</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onEdit} className="text-blue-600 hover:text-blue-700">
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="text-gray-900">{data.fullName}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-900">{data.email}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <GraduationCap className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">KFUPM ID</p>
                <p className="text-gray-900">{data.kfupmId}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Mobile</p>
                <p className="text-gray-900">{data.mobile}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <GraduationCap className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Academic Year</p>
                <p className="text-gray-900">{data.academicYear}</p>
              </div>
            </div>
            
            {data.linkedIn && (
              <div className="flex items-start gap-3">
                <LinkedinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">LinkedIn</p>
                  <a 
                    href={data.linkedIn} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm underline break-all"
                  >
                    View Profile
                  </a>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Committees & Leadership */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-green-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg text-green-900">Committees & Leadership</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onEdit} className="text-green-600 hover:text-green-700">
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Selected Committees */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Selected Committees</h4>
              <div className="flex flex-wrap gap-2">
                {data.committees.map((committee) => (
                  <span
                    key={committee}
                    className="inline-flex items-center px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm bg-green-100 text-green-800 border border-green-200"
                  >
                    {committee}
                  </span>
                ))}
              </div>
            </div>

            {/* Leadership Interest */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Leadership Interest</h4>
              <div className="flex items-center gap-2">
                {data.leadershipInterest ? (
                  <>
                    <Crown className="h-4 w-4 text-yellow-600" />
                    <span className="text-gray-900">Yes, interested in leadership roles</span>
                  </>
                ) : (
                  <span className="text-gray-600">Not interested in leadership roles</span>
                )}
              </div>
            </div>

            {/* Leadership Choices */}
            {data.leadershipInterest && data.leadershipChoices && data.leadershipChoices.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Leadership Preferences</h4>
                {/* Sort by choice to ensure review order always matches canonical order */}
                <div className="space-y-3">
                  {([...data.leadershipChoices].sort((a, b) => a.choice - b.choice)).map((choice, index) => (
                    <div key={index} className="border rounded-lg p-3 sm:p-4 bg-gray-50">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          Choice {choice.choice}: {choice.team}
                        </span>
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full self-start sm:self-auto">
                          {choice.choice === 1 ? '1st' : choice.choice === 2 ? '2nd' : '3rd'} Priority
                        </span>
                      </div>
                      {choice.why && (
                        <p className="text-sm text-gray-600 italic break-words">"{choice.why}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Experience (if provided) */}
      {hasOptionalInfo && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-purple-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg text-purple-900">Experience & Background</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={onEdit} className="text-purple-600 hover:text-purple-700">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {data.previous && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Previous Experience</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{data.previous}</p>
                </div>
              )}
              
              {data.competitions && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Competitions & Hackathons</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{data.competitions}</p>
                </div>
              )}
              
              {data.energy && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Why Energy?</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{data.energy}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Files & Documents */}
      {hasFiles && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-orange-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-lg text-orange-900">Documents & Files</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={onEdit} className="text-orange-600 hover:text-orange-700">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {data.cvFile && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">CV/Resume</p>
                    <p className="text-xs text-gray-600">{data.cvFile.name} ({Math.round(data.cvFile.size / 1024)} KB)</p>
                  </div>
                </div>
              )}
              
              {data.designFile && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Design Portfolio</p>
                    <p className="text-xs text-gray-600">{data.designFile.name} ({Math.round(data.designFile.size / 1024)} KB)</p>
                  </div>
                </div>
              )}
              
              {data.designLink && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Link className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Design Portfolio Link</p>
                    <a 
                      href={data.designLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 underline break-all"
                    >
                      {data.designLink}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
        <Button 
          variant="outline" 
          size="lg" 
          onClick={onEdit}
          className="min-w-[160px]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Edit
        </Button>
        
        <Button 
          size="lg" 
          onClick={onSubmit}
          disabled={isSubmitting}
          className={cn(
            "min-w-[160px] text-white font-medium",
            (data.program === 'energy_week_2' || data.program === 'energy_week_2_v2')
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-pink-600 hover:bg-pink-700"
          )}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Submitting...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Submit Application</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}