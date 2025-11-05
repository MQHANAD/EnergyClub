'use client';

import React, { useState, useEffect } from 'react';
import { Committee, Member, LeadershipPosition, TeamFormData, CommitteeFormData } from '@/types';
import { useI18n } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { teamApi } from '@/lib/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import LoadingSpinner from '@/components/register/LoadingSpinner';
import AuthGuard from '@/components/AuthGuard';
import Navigation from '@/components/Navigation';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Building2, 
  Crown,
  Save,
  X,
  AlertCircle
} from 'lucide-react';

function TeamAdminContent() {
  const { t } = useI18n();
  const { userProfile } = useAuth();
  const NO_COMMITTEE = '__none__';
  
  // Data states
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [leadershipPositions, setLeadershipPositions] = useState<LeadershipPosition[]>([]);
  const [unassignedMembers, setUnassignedMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showCommitteeForm, setShowCommitteeForm] = useState(false);
  const [showLeadershipForm, setShowLeadershipForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null);
  const [editingLeadership, setEditingLeadership] = useState<LeadershipPosition | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form data
  const [memberForm, setMemberForm] = useState<TeamFormData>({
    email: '',
    fullName: '',
    role: '',
    profilePicture: '',
    linkedInUrl: '',
    portfolioUrl: '',
    committeeId: NO_COMMITTEE
  });
  const [committeeForm, setCommitteeForm] = useState<CommitteeFormData>({
    name: '',
    description: '',
    order: 0
  });
  const [leadershipForm, setLeadershipForm] = useState({
    title: 'president' as 'president' | 'vice_president' | 'leader',
    memberId: ''
  });

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [committeesData, leadershipData, otherMembers] = await Promise.all([
        teamApi.getCommittees(),
        teamApi.getLeadershipPositions(),
        teamApi.getMembersWithoutCommittee()
      ]);

      setCommittees(committeesData);
      setLeadershipPositions(leadershipData);
      setUnassignedMembers(otherMembers);
    } catch (err) {
      console.error('Error fetching team data:', err);
      setError('Failed to load team data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Member handlers
  const handleAddMember = () => {
    if (committees.length === 0) {
      setError('Please create a committee first before adding members.');
      return;
    }
    
    setMemberForm({
      email: '',
      fullName: '',
      role: '',
      profilePicture: '',
      linkedInUrl: '',
      portfolioUrl: '',
      committeeId: NO_COMMITTEE
    });
    setEditingMember(null);
    setShowMemberForm(true);
  };

  const handleEditMember = (member: Member) => {
    setMemberForm({
      email: member.email || '',
      fullName: member.fullName,
      role: member.role,
      profilePicture: member.profilePicture || '',
      linkedInUrl: member.linkedInUrl || '',
      portfolioUrl: member.portfolioUrl || '',
      committeeId: member.committeeId || NO_COMMITTEE
    });
    setEditingMember(member);
    setShowMemberForm(true);
  };

  const handleSaveMember = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      // Validate required fields (Full Name, Email)
      if (!memberForm.fullName?.trim()) {
        setError('Full name is required');
        return;
      }
      if (!editingMember && !memberForm.email?.trim()) {
        setError('Email is required');
        return;
      }
      // Committee is optional; empty value means no committee
      
      const payload = {
        ...memberForm,
        committeeId: memberForm.committeeId === NO_COMMITTEE ? '' : memberForm.committeeId,
        isActive: true
      } as any;

      if (editingMember) {
        await teamApi.updateMember(editingMember.id, payload);
      } else {
        await teamApi.createMember(payload);
      }
      
      await fetchTeamData();
      setShowMemberForm(false);
      setEditingMember(null);
    } catch (err) {
      console.error('Error saving member:', err);
      setError('Failed to save member. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm(t('team.admin.confirmDeleteMember'))) return;
    
    try {
      await teamApi.deleteMember(memberId);
      await fetchTeamData();
    } catch (err) {
      console.error('Error deleting member:', err);
      setError('Failed to delete member. Please try again.');
    }
  };

  // Committee handlers
  const handleAddCommittee = () => {
    setCommitteeForm({
      name: '',
      description: '',
      order: committees.length
    });
    setEditingCommittee(null);
    setShowCommitteeForm(true);
  };

  const handleEditCommittee = (committee: Committee) => {
    setCommitteeForm({
      name: committee.name,
      description: committee.description || '',
      order: committee.order
    });
    setEditingCommittee(committee);
    setShowCommitteeForm(true);
  };

  const handleSaveCommittee = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      // Validate required fields
      if (!committeeForm.name.trim()) {
        setError('Committee name is required');
        return;
      }
      
      if (editingCommittee) {
        await teamApi.updateCommittee(editingCommittee.id, {
          ...committeeForm,
          isActive: true
        });
      } else {
        await teamApi.createCommittee({
          ...committeeForm,
          isActive: true
        });
      }
      
      await fetchTeamData();
      setShowCommitteeForm(false);
      setEditingCommittee(null);
    } catch (err) {
      console.error('Error saving committee:', err);
      setError('Failed to save committee. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCommittee = async (committeeId: string) => {
    if (!confirm(t('team.admin.confirmDeleteCommittee'))) return;
    
    try {
      await teamApi.deleteCommittee(committeeId);
      await fetchTeamData();
    } catch (err) {
      console.error('Error deleting committee:', err);
      setError('Failed to delete committee. Please try again.');
    }
  };

  // Leadership handlers
  const handleAddLeadership = () => {
    setLeadershipForm({
      title: 'president',
      memberId: ''
    });
    setEditingLeadership(null);
    setShowLeadershipForm(true);
  };

  const handleEditLeadership = (position: LeadershipPosition) => {
    setLeadershipForm({
      title: position.title,
      memberId: position.memberId
    });
    setEditingLeadership(position);
    setShowLeadershipForm(true);
  };

  const handleSaveLeadership = async () => {
    try {
      setIsSaving(true);
      
      // Validate required fields
      if (!leadershipForm.memberId) {
        setError('Please select a member for this leadership position');
        return;
      }
      
      if (editingLeadership) {
        await teamApi.updateLeadershipPosition(editingLeadership.id, {
          ...leadershipForm,
          isActive: true
        });
      } else {
        await teamApi.createLeadershipPosition({
          ...leadershipForm,
          isActive: true
        });
      }
      
      await fetchTeamData();
      setShowLeadershipForm(false);
      setEditingLeadership(null);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error saving leadership position:', err);
      setError('Failed to save leadership position. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLeadership = async (positionId: string) => {
    if (!confirm('Are you sure you want to delete this leadership position?')) return;
    
    try {
      await teamApi.deleteLeadershipPosition(positionId);
      await fetchTeamData();
    } catch (err) {
      console.error('Error deleting leadership position:', err);
      setError('Failed to delete leadership position. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light text-gray-900 mb-2">
            {t('team.admin.title')}
          </h1>
          <p className="text-gray-600 font-light">
            {t('team.admin.subtitle')}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button onClick={handleAddMember} className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            {t('team.admin.addMember')}
          </Button>
          <Button onClick={handleAddCommittee} variant="outline" className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            {t('team.admin.addCommittee')}
          </Button>
          <Button onClick={handleAddLeadership} variant="outline" className="flex items-center">
            <Crown className="w-4 h-4 mr-2" />
            Add Leadership Position
          </Button>
        </div>

        {/* Helpful message when no committees exist */}
        {committees.length === 0 && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <Plus className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-900">Get Started</h3>
                <p className="text-sm text-blue-700">Create your first committee to start adding team members.</p>
              </div>
            </div>
          </div>
        )}

        {/* Leadership Section */}
        <Card className="mb-8 p-6 bg-white border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Crown className="w-6 h-6 text-yellow-500 mr-2" />
              <h2 className="text-2xl font-light text-gray-900">
                Leadership Positions
              </h2>
            </div>
          </div>
          
          {leadershipPositions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leadershipPositions.map((position) => (
                <div key={position.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-light text-gray-900">
                        {position.title === 'president' 
                          ? t('team.leadership.president') 
                          : position.title === 'vice_president' 
                          ? t('team.leadership.vicePresident')
                          : 'Leader'
                        }
                      </h3>
                      <p className="text-gray-600 text-sm font-light">
                        {position.member.fullName} - {position.member.role}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        onClick={() => handleEditLeadership(position)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteLeadership(position.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8 font-light">
              No leadership positions set up yet.
            </p>
          )}
        </Card>

        {/* Committees Section */}
        <div className="space-y-6">
          {committees.map((committee) => (
            <Card key={committee.id} className="p-6 bg-white border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Building2 className="w-6 h-6 text-blue-500 mr-2" />
                  <div>
                    <h2 className="text-xl font-light text-gray-900">
                      {committee.name}
                    </h2>
                    {committee.description && (
                      <p className="text-gray-600 text-sm font-light">
                        {committee.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => handleEditCommittee(committee)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDeleteCommittee(committee.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Members */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {committee.members.map((member) => (
                  <div key={member.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-light text-gray-900">
                          {member.fullName}
                        </h3>
                        <p className="text-gray-600 text-sm font-light">
                          {member.role}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          onClick={() => handleEditMember(member)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteMember(member.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {committee.members.length === 0 && (
                <p className="text-gray-500 text-center py-8 font-light">
                  No members in this committee yet.
                </p>
              )}
            </Card>
          ))}

          {/* Other (no committee) */}
          <Card className="p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Building2 className="w-6 h-6 text-gray-500 mr-2" />
                <div>
                  <h2 className="text-xl font-light text-gray-900">
                    Other
                  </h2>
                  <p className="text-gray-600 text-sm font-light">Members without a committee</p>
                </div>
              </div>
              <div className="flex space-x-2" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {unassignedMembers.map((member) => (
                <div key={member.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-light text-gray-900">
                        {member.fullName}
                      </h3>
                      <p className="text-gray-600 text-sm font-light">
                        {member.role}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        onClick={() => handleEditMember(member)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteMember(member.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {unassignedMembers.length === 0 && (
              <p className="text-gray-500 text-center py-8 font-light">
                No unassigned members.
              </p>
            )}
          </Card>
        </div>

        {/* Member Form Dialog */}
        <Dialog open={showMemberForm} onOpenChange={setShowMemberForm}>
          <DialogContent className="max-w-md bg-white border border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-lg font-light text-gray-900">
                {editingMember ? t('team.admin.editMember') : t('team.admin.addMember')}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <Input
                id="email"
                value={memberForm.email || ''}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                placeholder="member@example.com"
                className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                disabled={!!editingMember}
              />
            </div>

            <div>
                <Label htmlFor="fullName" className="text-gray-700 font-medium">{t('team.admin.memberForm.fullName')}</Label>
                <Input
                  id="fullName"
                  value={memberForm.fullName}
                  onChange={(e) => setMemberForm({ ...memberForm, fullName: e.target.value })}
                  placeholder={t('team.admin.memberForm.fullNamePlaceholder')}
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="role" className="text-gray-700 font-medium">{t('team.admin.memberForm.role')}</Label>
                <Select
                  value={(memberForm.role || '').toLowerCase() === 'leader' ? 'leader' : (memberForm.role ? (memberForm.role === 'Member' ? 'member' : (memberForm.role.toLowerCase() === 'member' ? 'member' : 'custom')) : 'member')}
                  onValueChange={(value) => {
                    if (value === 'leader') {
                      setMemberForm({ ...memberForm, role: 'Leader' });
                    } else if (value === 'member') {
                      setMemberForm({ ...memberForm, role: 'Member' });
                    } else {
                      // custom: leave role as-is; user will type below
                      setMemberForm({ ...memberForm, role: memberForm.role && memberForm.role !== 'Leader' && memberForm.role !== 'Member' ? memberForm.role : '' });
                    }
                  }}
                >
                  <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200">
                    <SelectItem value="member" className="text-gray-900 hover:bg-gray-50">Member</SelectItem>
                    <SelectItem value="leader" className="text-gray-900 hover:bg-gray-50">Leader (Committee Leader)</SelectItem>
                    <SelectItem value="custom" className="text-gray-900 hover:bg-gray-50">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {(!memberForm.role || (memberForm.role !== 'Leader' && memberForm.role !== 'Member')) && (
                  <Input
                    id="role"
                    value={memberForm.role || ''}
                    onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                    placeholder="Enter custom role (e.g., Designer)"
                    className="mt-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                )}
                <p className="text-xs text-gray-500 mt-1">Presidents and Vice Presidents are set in "Add Leadership Position".</p>
              </div>
              
              <div>
                <Label htmlFor="committee" className="text-gray-700 font-medium">{t('team.admin.memberForm.committee')}</Label>
                <Select
                  value={memberForm.committeeId || NO_COMMITTEE}
                  onValueChange={(value) => setMemberForm({ ...memberForm, committeeId: value })}
                >
                  <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select a committee" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value={NO_COMMITTEE} className="text-gray-900 hover:bg-gray-50">
                    No committee
                  </SelectItem>
                    {committees.map((committee) => (
                      <SelectItem key={committee.id} value={committee.id} className="text-gray-900 hover:bg-gray-50">
                        {committee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="profilePicture" className="text-gray-700 font-medium">{t('team.admin.memberForm.profilePicture')}</Label>
                <Input
                  id="profilePicture"
                  value={memberForm.profilePicture}
                  onChange={(e) => setMemberForm({ ...memberForm, profilePicture: e.target.value })}
                  placeholder={t('team.admin.memberForm.profilePicturePlaceholder')}
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="linkedInUrl" className="text-gray-700 font-medium">{t('team.admin.memberForm.linkedInUrl')}</Label>
                <Input
                  id="linkedInUrl"
                  value={memberForm.linkedInUrl}
                  onChange={(e) => setMemberForm({ ...memberForm, linkedInUrl: e.target.value })}
                  placeholder={t('team.admin.memberForm.linkedInPlaceholder')}
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

            <div>
              <Label htmlFor="portfolioUrl" className="text-gray-700 font-medium">Portfolio URL</Label>
              <Input
                id="portfolioUrl"
                value={memberForm.portfolioUrl || ''}
                onChange={(e) => setMemberForm({ ...memberForm, portfolioUrl: e.target.value })}
                placeholder="https://yourportfolio.com"
                className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setShowMemberForm(false)} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <X className="w-4 h-4 mr-2" />
                {t('team.admin.actions.cancel')}
              </Button>
              <Button onClick={handleSaveMember} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? t('team.admin.actions.saving') : t('team.admin.actions.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Committee Form Dialog */}
        <Dialog open={showCommitteeForm} onOpenChange={setShowCommitteeForm}>
          <DialogContent className="max-w-md bg-white border border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-lg font-light text-gray-900">
                {editingCommittee ? t('team.admin.editCommittee') : t('team.admin.addCommittee')}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-700 font-medium">{t('team.admin.committeeForm.name')}</Label>
                <Input
                  id="name"
                  value={committeeForm.name}
                  onChange={(e) => setCommitteeForm({ ...committeeForm, name: e.target.value })}
                  placeholder={t('team.admin.committeeForm.namePlaceholder')}
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-gray-700 font-medium">{t('team.admin.committeeForm.description')}</Label>
                <Textarea
                  id="description"
                  value={committeeForm.description}
                  onChange={(e) => setCommitteeForm({ ...committeeForm, description: e.target.value })}
                  placeholder={t('team.admin.committeeForm.descriptionPlaceholder')}
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="order" className="text-gray-700 font-medium">{t('team.admin.committeeForm.order')}</Label>
                <Input
                  id="order"
                  type="number"
                  value={committeeForm.order}
                  onChange={(e) => setCommitteeForm({ ...committeeForm, order: parseInt(e.target.value) || 0 })}
                  placeholder={t('team.admin.committeeForm.orderPlaceholder')}
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setShowCommitteeForm(false)} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <X className="w-4 h-4 mr-2" />
                {t('team.admin.actions.cancel')}
              </Button>
              <Button onClick={handleSaveCommittee} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? t('team.admin.actions.saving') : t('team.admin.actions.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Leadership Form Dialog */}
        <Dialog open={showLeadershipForm} onOpenChange={setShowLeadershipForm}>
          <DialogContent className="max-w-md bg-white border border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-lg font-light text-gray-900">
                {editingLeadership ? 'Edit Leadership Position' : 'Add Leadership Position'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-gray-700 font-medium">Position Title</Label>
                <Select
                  value={leadershipForm.title}
                  onValueChange={(value: 'president' | 'vice_president' | 'leader') => setLeadershipForm({ ...leadershipForm, title: value })}
                >
                  <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200">
                    <SelectItem value="president" className="text-gray-900 hover:bg-gray-50">
                      President
                    </SelectItem>
                    <SelectItem value="vice_president" className="text-gray-900 hover:bg-gray-50">
                      Vice President
                    </SelectItem>
                    <SelectItem value="leader" className="text-gray-900 hover:bg-gray-50">
                      Leader
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="memberId" className="text-gray-700 font-medium">Select Member</Label>
                <Select
                  value={leadershipForm.memberId}
                  onValueChange={(value) => setLeadershipForm({ ...leadershipForm, memberId: value })}
                >
                  <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select a member" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200">
                    {committees.flatMap(committee => 
                      committee.members.map(member => (
                        <SelectItem key={member.id} value={member.id} className="text-gray-900 hover:bg-gray-50">
                          {member.fullName} - {committee.name}
                        </SelectItem>
                      ))
                    )}
                    {unassignedMembers.map(member => (
                      <SelectItem key={member.id} value={member.id} className="text-gray-900 hover:bg-gray-50">
                        {member.fullName} - Other
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setShowLeadershipForm(false)} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveLeadership} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </div>
  );
}

export default function TeamAdminPage() {
  return (
    <AuthGuard requireAdmin={true}>
      <TeamAdminContent />
    </AuthGuard>
  );
}