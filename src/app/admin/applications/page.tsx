'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { listApplications, decideApplication, revertApplication } from '@/lib/registrations';
import type { Application } from '@/types';
import { Button } from '@/components/ui/button';

// Import new admin components
import ApplicationMetrics from '@/components/admin/ApplicationMetrics';
import FilterSidebar, { ActiveFilter, FilterOption } from '@/components/admin/FilterSidebar';
import ApplicationCard from '@/components/admin/ApplicationCard';
import BulkActionToolbar from '@/components/admin/BulkActionToolbar';
import SlidePanel from '@/components/admin/SlidePanel';

import { RefreshCw, Filter, Layout, List } from 'lucide-react';
import { useI18n } from '@/i18n/index';

export default function ApplicationsAdminPage() {
  const router = useRouter();
  const { user, isOrganizer, loading } = useAuth();
  const { t } = useI18n();

  // Data state
  const [apps, setApps] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingApps, setLoadingApps] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showSlidePanel, setShowSlidePanel] = useState(false);
  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Authentication check - Temporarily disabled for UI testing
  useEffect(() => {
    if (!loading) {
      // TODO: Re-enable authentication checks after testing
      // if (!user) {
      //   router.push('/login');
      // } else if (!isOrganizer) {
      //   router.push('/');
      // }
    }
  }, [loading, user, isOrganizer, router]);

  // Load applications
  const loadAll = async () => {
    try {
      setError(null);
      setLoadingApps(true);
      const data = await listApplications();
      setApps(data);
    } catch (e: any) {
      console.error('Failed to load applications', e);
      setError(e?.message || 'Failed to load applications.');
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    // Temporarily always load data for testing - normally requires user && isOrganizer
    loadAll();
  }, []); // Removed user, isOrganizer dependencies for testing

  // Filter and search applications
  const filteredApps = useMemo(() => {
    let filtered = [...apps];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((app) => {
        const email = (app.email ?? '').toString().toLowerCase();
        const id = (app.kfupmId ?? '').toString().toLowerCase();
        const name = (app.fullName ?? '').toString().toLowerCase();
        return email.includes(query) || id.includes(query) || name.includes(query);
      });
    }

    // Apply active filters
    activeFilters.forEach((filter) => {
      switch (filter.type) {
        case 'status':
          filtered = filtered.filter(app => app.status === filter.value);
          break;
        case 'program':
          filtered = filtered.filter(app => app.program === filter.value);
          break;
        case 'academicYear':
          filtered = filtered.filter(app => app.academicYear === filter.value);
          break;
        case 'committee':
          filtered = filtered.filter(app => app.committees?.includes(filter.value));
          break;
        case 'dateRange':
          if (filter.value.start || filter.value.end) {
            const startDate = filter.value.start ? new Date(filter.value.start) : null;
            const endDate = filter.value.end ? new Date(filter.value.end + 'T23:59:59') : null;

            filtered = filtered.filter(app => {
              const appDate = new Date(app.submittedAt);
              return (!startDate || appDate >= startDate) && (!endDate || appDate <= endDate);
            });
          }
          break;
      }
    });

    return filtered;
  }, [apps, searchQuery, activeFilters]);

  // Group applications by status
  const groupedApps = useMemo(() => {
    const map: Record<Application['status'], Application[]> = {
      pending: [],
      accepted: [],
      rejected: []
    };
    for (const app of filteredApps) {
      map[app.status].push(app);
    }
    return map;
  }, [filteredApps]);

  // Generate filter options from data
  const filterOptions = useMemo(() => {
    const programs: FilterOption[] = [];
    const academicYears: FilterOption[] = [];
    const committees: FilterOption[] = [];

    // Count occurrences
    const programCounts: Record<string, number> = {};
    const yearCounts: Record<string, number> = {};
    const committeeCounts: Record<string, number> = {};

    apps.forEach(app => {
      // Programs
      if (app.program) {
        programCounts[app.program] = (programCounts[app.program] || 0) + 1;
      }

      // Academic years
      if (app.academicYear) {
        yearCounts[app.academicYear] = (yearCounts[app.academicYear] || 0) + 1;
      }

      // Committees
      app.committees?.forEach(committee => {
        committeeCounts[committee] = (committeeCounts[committee] || 0) + 1;
      });
    });

    // Create filter options
    Object.entries(programCounts).forEach(([program, count]) => {
      programs.push({
        id: program,
        label: apps.find(app => app.program === program)?.programLabel || program,
        count
      });
    });

    Object.entries(yearCounts).forEach(([year, count]) => {
      academicYears.push({ id: year, label: year, count });
    });

    Object.entries(committeeCounts).forEach(([committee, count]) => {
      committees.push({ id: committee, label: committee, count });
    });

    return { programs, academicYears, committees };
  }, [apps]);

  // Status counts for filter sidebar
  const statusCounts = useMemo(() => ({
    pending: apps.filter(app => app.status === 'pending').length,
    accepted: apps.filter(app => app.status === 'accepted').length,
    rejected: apps.filter(app => app.status === 'rejected').length,
  }), [apps]);

  // Application decision handlers
  const onDecide = async (application: Application, status: 'accepted' | 'rejected') => {
    if (!user) return;
    if (status === 'rejected' && !confirm('Reject this application?')) return;

    setProcessingId(application.id);
    try {
      await decideApplication(application.id, status, user.uid);
      // Optimistic update
      setApps(prev => prev.map(a => (a.id === application.id ? { ...a, status } : a)));

      // Update selected application if it's currently shown
      if (selectedApplication?.id === application.id) {
        setSelectedApplication({ ...selectedApplication, status });
      }
    } catch (e: any) {
      console.error('Failed to decide application', e);
      alert(e?.message || 'Failed to update status.');
    } finally {
      setProcessingId(null);
    }
  };

  const onUndo = async (application: Application) => {
    if (!application) return;
    setProcessingId(application.id);

    try {
      await revertApplication(application.id);
      setApps(prev =>
        prev.map(a =>
          a.id === application.id ? { ...a, status: 'pending', decidedAt: null, decidedBy: null } : a
        )
      );

      if (selectedApplication?.id === application.id) {
        setSelectedApplication({ ...selectedApplication, status: 'pending', decidedAt: null, decidedBy: null });
      }
    } catch (e: any) {
      console.error('Failed to undo decision', e);
      alert(e?.message || 'Failed to undo decision.');
    } finally {
      setProcessingId(null);
    }
  };

  // Bulk operations
  const handleBulkAccept = async (applications: Application[]) => {
    if (!user) return;
    setIsProcessingBulk(true);

    try {
      const pendingApps = applications.filter(app => app.status === 'pending');
      await Promise.all(
        pendingApps.map(app => decideApplication(app.id, 'accepted', user.uid))
      );

      // Optimistic update
      setApps(prev => prev.map(a => {
        const updated = pendingApps.find(pa => pa.id === a.id);
        return updated ? { ...a, status: 'accepted' as const } : a;
      }));

      setSelectedApplications([]);
    } catch (e: any) {
      console.error('Bulk accept failed', e);
      alert(e?.message || 'Failed to accept applications.');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkReject = async (applications: Application[]) => {
    if (!user) return;
    setIsProcessingBulk(true);

    try {
      const pendingApps = applications.filter(app => app.status === 'pending');
      await Promise.all(
        pendingApps.map(app => decideApplication(app.id, 'rejected', user.uid))
      );

      // Optimistic update
      setApps(prev => prev.map(a => {
        const updated = pendingApps.find(pa => pa.id === a.id);
        return updated ? { ...a, status: 'rejected' as const } : a;
      }));

      setSelectedApplications([]);
    } catch (e: any) {
      console.error('Bulk reject failed', e);
      alert(e?.message || 'Failed to reject applications.');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // Selection handlers
  const handleSelectApplication = (application: Application) => {
    setSelectedApplications(prev => {
      const isSelected = prev.some(app => app.id === application.id);
      if (isSelected) {
        return prev.filter(app => app.id !== application.id);
      } else {
        return [...prev, application];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedApplications(filteredApps);
  };

  const handleClearSelection = () => {
    setSelectedApplications([]);
  };

  // View application details
  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setShowSlidePanel(true);
  };

  const handleClosePanel = () => {
    setShowSlidePanel(false);
    setSelectedApplication(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  // Temporarily allow access for testing - normally requires user && isOrganizer
  // if (!user || !isOrganizer) return null;

  return (
    <div className="bg-gray-50 bg-[url('/BG.PNG')] bg-cover bg-center bg-fixed">
      <Navigation />

      <main className="max-w-[2000px] mx-auto">
        <div className="flex h-full">
          {/* Filter Sidebar */}
          <FilterSidebar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilters={activeFilters}
            onFilterChange={setActiveFilters}
            programs={filterOptions.programs}
            academicYears={filterOptions.academicYears}
            committees={filterOptions.committees}
            statusCounts={statusCounts}
            isOpen={showFilterSidebar}
            onClose={() => setShowFilterSidebar(false)}
            className="w-80 flex-shrink-0"
          />

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <h1 className="text-3xl font-bold text-gray-900">Application Review</h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilterSidebar(!showFilterSidebar)}
                    className="md:hidden"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                    <Button
                      variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('kanban')}
                    >
                      <Layout className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button variant="outline" onClick={loadAll} disabled={loadingApps}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingApps ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Metrics Dashboard */}
              <ApplicationMetrics
                applications={apps}
                onMetricClick={(metric) => {
                  // Handle metric clicks to filter
                  if (metric === 'pending-review') {
                    setActiveFilters([{ id: 'status-pending', type: 'status', label: 'Pending', value: 'pending' }]);
                  }
                }}
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Bulk Actions Toolbar */}
            <BulkActionToolbar
              selectedApplications={selectedApplications}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onBulkAccept={handleBulkAccept}
              onBulkReject={handleBulkReject}
              totalApplications={filteredApps.length}
              isProcessing={isProcessingBulk}
            />

            {/* Applications Content */}
            <div className="flex-1 overflow-auto p-6">
              {loadingApps ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
                </div>
              ) : filteredApps.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg text-gray-600 mb-2">No applications found</p>
                  <p className="text-sm text-gray-500">
                    {searchQuery || activeFilters.length > 0
                      ? 'Try adjusting your search or filters'
                      : 'No applications have been submitted yet'}
                  </p>
                </div>
              ) : viewMode === 'kanban' ? (
                // Kanban View
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                  {/* Pending Column */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 flex items-center">
                          <div className="w-3 h-3 bg-amber-400 rounded-full mr-2"></div>
                          Pending ({groupedApps.pending.length})
                        </h3>
                      </div>
                    </div>
                    <div className="p-4 space-y-4 overflow-y-auto max-h-[96vh]">
                      {groupedApps.pending.map(application => (
                        <ApplicationCard
                          key={application.id}
                          application={application}
                          isSelected={selectedApplications.some(app => app.id === application.id)}
                          onSelect={handleSelectApplication}
                          onAccept={(app) => onDecide(app, 'accepted')}
                          onReject={(app) => onDecide(app, 'rejected')}
                          onViewDetails={handleViewDetails}
                          showBulkActions={true}
                          isProcessing={processingId === application.id}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Accepted Column */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 flex items-center">
                          <div className="w-3 h-3 bg-emerald-400 rounded-full mr-2"></div>
                          Accepted ({groupedApps.accepted.length})
                        </h3>
                      </div>
                    </div>
                    <div className="p-4 space-y-4 overflow-y-auto max-h-[96vh]">
                      {groupedApps.accepted.map(application => (
                        <ApplicationCard
                          key={application.id}
                          application={application}
                          isSelected={selectedApplications.some(app => app.id === application.id)}
                          onSelect={handleSelectApplication}
                          onViewDetails={handleViewDetails}
                          showBulkActions={true}
                          isProcessing={processingId === application.id}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Rejected Column */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 flex items-center">
                          <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                          Rejected ({groupedApps.rejected.length})
                        </h3>
                      </div>
                    </div>
                    <div className="p-4 space-y-4 overflow-y-auto max-h-[96vh]">
                      {groupedApps.rejected.map(application => (
                        <ApplicationCard
                          key={application.id}
                          application={application}
                          isSelected={selectedApplications.some(app => app.id === application.id)}
                          onSelect={handleSelectApplication}
                          onViewDetails={handleViewDetails}
                          showBulkActions={true}
                          isProcessing={processingId === application.id}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // List View
                <div className="space-y-4">
                  {filteredApps.map(application => (
                    <ApplicationCard
                      key={application.id}
                      application={application}
                      isSelected={selectedApplications.some(app => app.id === application.id)}
                      onSelect={handleSelectApplication}
                      onAccept={(app) => onDecide(app, 'accepted')}
                      onReject={(app) => onDecide(app, 'rejected')}
                      onViewDetails={handleViewDetails}
                      showBulkActions={true}
                      isProcessing={processingId === application.id}
                      density="compact"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Slide Panel */}
      {selectedApplication && (
        <SlidePanel
          isOpen={showSlidePanel}
          onClose={handleClosePanel}
          application={selectedApplication}
          onAccept={(app) => onDecide(app, 'accepted')}
          onReject={(app) => onDecide(app, 'rejected')}
          onUndo={onUndo}
          isProcessing={processingId === selectedApplication.id}
          
        />
      )}
    </div>
  );
}