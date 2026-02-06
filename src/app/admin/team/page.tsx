'use client';

import React, { useState, useEffect } from 'react';
import { Committee, Member, LeadershipPosition, TeamFormData, CommitteeFormData, Region, RoleType } from '@/types';
import { useI18n } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { teamApi, regionsApi } from '@/lib/firestore';
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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Building2,
  Crown,
  Save,
  X,
  AlertCircle,
  GripVertical
} from 'lucide-react';

// Sortable Member Card Component
interface SortableMemberCardProps {
  member: Member;
  onEdit: (member: Member) => void;
  onDelete: (memberId: string) => void;
}

function SortableMemberCard({ member, onEdit, onDelete }: SortableMemberCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: member.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 bg-gray-50 rounded-lg border border-gray-200 ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            className="cursor-grab active:cursor-grabbing mr-2 text-gray-400 hover:text-gray-600 touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <div>
            <h3 className="font-light text-gray-900">
              {member.fullName}
            </h3>
            <p className="text-gray-600 text-sm font-light">
              {member.role}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={() => onEdit(member)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(member.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function TeamAdminContent() {
  const { t } = useI18n();
  const { userProfile } = useAuth();
  const NO_COMMITTEE = '__none__';

  // Data states
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
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
    roleType: 'member' as RoleType,
    regionId: 'eastern_province',
    profilePicture: '',
    linkedInUrl: '',
    portfolioUrl: '',
    committeeId: NO_COMMITTEE,
    order: 0
  });
  const [committeeForm, setCommitteeForm] = useState<CommitteeFormData>({
    name: '',
    description: '',
    regionId: 'eastern_province',
    order: 0
  });
  const [leadershipForm, setLeadershipForm] = useState({
    title: 'president' as 'president' | 'vice_president' | 'leader',
    memberId: ''
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for reordering members
  const handleDragEnd = async (event: DragEndEvent, committeeId: string) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Find the committee
      const committeeIndex = committees.findIndex(c => c.id === committeeId);
      if (committeeIndex === -1) return;

      const committee = committees[committeeIndex];
      const members = [...committee.members].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const oldIndex = members.findIndex(m => m.id === active.id);
      const newIndex = members.findIndex(m => m.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // Reorder locally
      const reorderedMembers = arrayMove(members, oldIndex, newIndex);

      // Update order values
      const updatedMembers = reorderedMembers.map((m, idx) => ({
        ...m,
        order: idx
      }));

      // Update state immediately for responsive UI
      const updatedCommittees = [...committees];
      updatedCommittees[committeeIndex] = {
        ...committee,
        members: updatedMembers
      };
      setCommittees(updatedCommittees);

      // Persist to Firestore
      try {
        await Promise.all(
          updatedMembers.map((member, idx) =>
            teamApi.updateMember(member.id, { order: idx })
          )
        );
      } catch (err) {
        console.error('Error updating member order:', err);
        setError('Failed to save member order. Please try again.');
        // Revert on error
        await fetchTeamData();
      }
    }
  };

  useEffect(() => {
    // Only fetch data when auth is ready
    if (userProfile) {
      fetchTeamData();
    }
  }, [userProfile]);

  const fetchTeamData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [committeesData, leadershipData, otherMembers, regionsData] = await Promise.all([
        teamApi.getCommittees(),
        teamApi.getLeadershipPositions(),
        teamApi.getMembersWithoutCommittee(),
        regionsApi.getRegions()
      ]);

      setCommittees(committeesData);
      setLeadershipPositions(leadershipData);
      setUnassignedMembers(otherMembers);
      setRegions(regionsData);

      // Initialize default regions if none exist
      if (regionsData.length === 0) {
        await regionsApi.initializeDefaultRegions();
        const newRegions = await regionsApi.getRegions();
        setRegions(newRegions);
      }
    } catch (err) {
      console.error('Error fetching team data:', err);
      setError('Failed to load team data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Member handlers
  const handleAddMember = () => {
    if (committees.length === 0 && regions.length === 0) {
      setError('Please wait for data to load.');
      return;
    }

    setMemberForm({
      email: '',
      fullName: '',
      role: '',
      roleType: 'member' as RoleType,
      regionId: regions.length > 0 ? regions[0].id : 'eastern_province',
      profilePicture: '',
      linkedInUrl: '',
      portfolioUrl: '',
      committeeId: NO_COMMITTEE,
      order: 0
    });
    setEditingMember(null);
    setShowMemberForm(true);
  };

  const handleEditMember = (member: Member) => {
    setMemberForm({
      email: member.email || '',
      fullName: member.fullName,
      role: member.role,
      roleType: member.roleType || 'member',
      regionId: member.regionId || 'eastern_province',
      profilePicture: member.profilePicture || '',
      linkedInUrl: member.linkedInUrl || '',
      portfolioUrl: member.portfolioUrl || '',
      committeeId: member.committeeId || NO_COMMITTEE,
      order: member.order ?? 0
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
      regionId: regions.length > 0 ? regions[0].id : 'eastern_province',
      order: committees.length
    });
    setEditingCommittee(null);
    setShowCommitteeForm(true);
  };

  const handleEditCommittee = (committee: Committee) => {
    setCommitteeForm({
      name: committee.name,
      description: committee.description || '',
      regionId: committee.regionId || 'eastern_province',
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
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, committee.id)}
                >
                  <SortableContext
                    items={[...committee.members]
                      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                      .map(m => m.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {[...committee.members]
                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                        .map((member) => (
                          <SortableMemberCard
                            key={member.id}
                            member={member}
                            onEdit={handleEditMember}
                            onDelete={handleDeleteMember}
                          />
                        ))}
                    </div>
                  </SortableContext>
                </DndContext>

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
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-gray-200">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {editingMember ? 'Edit Member' : 'Add New Member'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Basic Info Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Basic Information</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName" className="text-gray-700 font-medium">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={memberForm.fullName}
                        onChange={(e) => setMemberForm({ ...memberForm, fullName: e.target.value })}
                        placeholder="John Doe"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={memberForm.email || ''}
                        onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                        placeholder="john@example.com"
                        className="mt-1.5"
                        disabled={!!editingMember}
                      />
                    </div>
                  </div>
                </div>

                {/* Role & Assignment Section */}
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide pt-2">Role & Assignment</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role" className="text-gray-700 font-medium">Role Title *</Label>
                      <Input
                        id="role"
                        value={memberForm.role || ''}
                        onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                        placeholder="e.g., Designer, Developer, Leader"
                        className="mt-1.5"
                      />
                      <p className="text-xs text-gray-500 mt-1">Use "Leader" for committee heads</p>
                    </div>
                    <div>
                      <Label htmlFor="regionId" className="text-gray-700 font-medium">Region</Label>
                      <Select
                        value={memberForm.regionId}
                        onValueChange={(value) => setMemberForm({
                          ...memberForm,
                          regionId: value,
                          // Clear committee when region changes (it might not exist in new region)
                          committeeId: NO_COMMITTEE
                        })}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200">
                          {regions.map((region) => (
                            <SelectItem key={region.id} value={region.id}>
                              {region.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="committee" className="text-gray-700 font-medium">Committee</Label>
                    <Select
                      value={memberForm.committeeId || NO_COMMITTEE}
                      onValueChange={(value) => setMemberForm({ ...memberForm, committeeId: value })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select committee" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200">
                        <SelectItem value={NO_COMMITTEE}>No Committee</SelectItem>
                        {committees
                          .filter(c => c.regionId === memberForm.regionId)
                          .map((committee) => (
                            <SelectItem key={committee.id} value={committee.id}>
                              {committee.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {memberForm.regionId && committees.filter(c => c.regionId === memberForm.regionId).length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">No committees in this region yet.</p>
                    )}
                  </div>
                </div>

                {/* Links Section */}
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide pt-2">Profile & Links</h3>

                  <div>
                    <Label htmlFor="profilePicture" className="text-gray-700 font-medium">Profile Picture URL</Label>
                    <Input
                      id="profilePicture"
                      value={memberForm.profilePicture}
                      onChange={(e) => setMemberForm({ ...memberForm, profilePicture: e.target.value })}
                      placeholder="https://example.com/photo.jpg"
                      className="mt-1.5"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="linkedInUrl" className="text-gray-700 font-medium">LinkedIn URL</Label>
                      <Input
                        id="linkedInUrl"
                        value={memberForm.linkedInUrl}
                        onChange={(e) => setMemberForm({ ...memberForm, linkedInUrl: e.target.value })}
                        placeholder="https://linkedin.com/in/..."
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="portfolioUrl" className="text-gray-700 font-medium">Portfolio URL</Label>
                      <Input
                        id="portfolioUrl"
                        value={memberForm.portfolioUrl || ''}
                        onChange={(e) => setMemberForm({ ...memberForm, portfolioUrl: e.target.value })}
                        placeholder="https://portfolio.com"
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="border-t border-gray-100 pt-4">
                <Button variant="outline" onClick={() => setShowMemberForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveMember} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isSaving ? 'Saving...' : (editingMember ? 'Save Changes' : 'Add Member')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Committee Form Dialog */}
          <Dialog open={showCommitteeForm} onOpenChange={setShowCommitteeForm}>
            <DialogContent className="max-w-md bg-white border border-gray-200">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {editingCommittee ? 'Edit Committee' : 'Add New Committee'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name" className="text-gray-700 font-medium">Committee Name *</Label>
                  <Input
                    id="name"
                    value={committeeForm.name}
                    onChange={(e) => setCommitteeForm({ ...committeeForm, name: e.target.value })}
                    placeholder="e.g., Technical, Marketing, Events"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-gray-700 font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={committeeForm.description}
                    onChange={(e) => setCommitteeForm({ ...committeeForm, description: e.target.value })}
                    placeholder="What does this committee do?"
                    className="mt-1.5"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="committeeRegionId" className="text-gray-700 font-medium">Region</Label>
                  <Select
                    value={committeeForm.regionId}
                    onValueChange={(value) => setCommitteeForm({ ...committeeForm, regionId: value })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      {regions.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="border-t border-gray-100 pt-4">
                <Button variant="outline" onClick={() => setShowCommitteeForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveCommittee} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isSaving ? 'Saving...' : (editingCommittee ? 'Save Changes' : 'Add Committee')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Leadership Form Dialog */}
          <Dialog open={showLeadershipForm} onOpenChange={setShowLeadershipForm}>
            <DialogContent className="max-w-md bg-white border border-gray-200">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {editingLeadership ? 'Edit Leadership Position' : 'Add Leadership Position'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="title" className="text-gray-700 font-medium">Position *</Label>
                  <Select
                    value={leadershipForm.title}
                    onValueChange={(value: 'president' | 'vice_president' | 'leader') => setLeadershipForm({ ...leadershipForm, title: value })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      <SelectItem value="president">President</SelectItem>
                      <SelectItem value="vice_president">Vice President</SelectItem>
                      <SelectItem value="leader">Leader</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="memberId" className="text-gray-700 font-medium">Select Member *</Label>
                  <Select
                    value={leadershipForm.memberId}
                    onValueChange={(value) => setLeadershipForm({ ...leadershipForm, memberId: value })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Choose a team member" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 max-h-60">
                      {committees.flatMap(committee =>
                        committee.members.map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.fullName} ({committee.name})
                          </SelectItem>
                        ))
                      )}
                      {unassignedMembers.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.fullName} (No Committee)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Only existing members can be assigned leadership positions.
                  </p>
                </div>
              </div>

              <DialogFooter className="border-t border-gray-100 pt-4">
                <Button variant="outline" onClick={() => setShowLeadershipForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveLeadership} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isSaving ? 'Saving...' : (editingLeadership ? 'Save Changes' : 'Add Position')}
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