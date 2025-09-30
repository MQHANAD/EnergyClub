"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Filter,
  X,
  Calendar,
  User,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Users,
} from "lucide-react";

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface ActiveFilter {
  id: string;
  type: string;
  label: string;
  value: any;
}

export interface FilterSidebarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilters: ActiveFilter[];
  onFilterChange: (filters: ActiveFilter[]) => void;
  programs: FilterOption[];
  academicYears: FilterOption[];
  committees: FilterOption[];
  statusCounts: {
    pending: number;
    accepted: number;
    rejected: number;
  };
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  searchQuery,
  onSearchChange,
  activeFilters,
  onFilterChange,
  programs,
  academicYears,
  committees,
  statusCounts,
  className,
  isOpen = true,
  onClose,
}) => {
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  const addFilter = (type: string, value: string, label: string) => {
    const newFilter: ActiveFilter = {
      id: `${type}-${value}`,
      type,
      label,
      value,
    };

    // Prevent duplicate filters
    const exists = activeFilters.some((f) => f.id === newFilter.id);
    if (!exists) {
      onFilterChange([...activeFilters, newFilter]);
    }
  };

  const removeFilter = (filterId: string) => {
    onFilterChange(activeFilters.filter((f) => f.id !== filterId));
  };

  const clearAllFilters = () => {
    onFilterChange([]);
    setDateRange({ start: "", end: "" });
    onSearchChange("");
  };

  const handleDateRangeApply = () => {
    // Remove existing date filters first
    const withoutDateFilters = activeFilters.filter(
      (f) => f.type !== "dateRange"
    );

    if (dateRange.start || dateRange.end) {
      const label = `${dateRange.start || "Any"} - ${dateRange.end || "Any"}`;
      const newFilter: ActiveFilter = {
        id: "dateRange-filter",
        type: "dateRange",
        label: `Date: ${label}`,
        value: dateRange,
      };
      onFilterChange([...withoutDateFilters, newFilter]);
    } else {
      onFilterChange(withoutDateFilters);
    }
  };

  const isFilterActive = (type: string, value: string) => {
    return activeFilters.some((f) => f.type === type && f.value === value);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "bg-white border-r border-gray-200 h-full overflow-y-auto",
          // Mobile styles
          "fixed left-0 top-0 w-80 z-40 transform transition-transform duration-300 md:relative md:transform-none md:z-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className
        )}
        aria-label="Filter applications"
      >
        <div className="p-4 space-y-6 pt-20">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Filter className="h-5 w-5 mr-2 text-gray-400" />
              Filters
            </h2>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="md:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Search */}
          <div>
            <label htmlFor="search" className="sr-only">
              Search applications
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Active Filters</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((filter) => (
                    <span
                      key={filter.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-md"
                    >
                      {filter.label}
                      <button
                        onClick={() => removeFilter(filter.id)}
                        className="hover:bg-yellow-200 rounded-full p-0.5"
                        aria-label={`Remove ${filter.label} filter`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Status Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => addFilter("status", "pending", "Pending")}
                disabled={isFilterActive("status", "pending")}
                className={cn(
                  "w-full flex items-center justify-between p-2 text-left rounded-md border transition-colors",
                  isFilterActive("status", "pending")
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "hover:bg-gray-50 border-gray-200"
                )}
              >
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                  {statusCounts.pending}
                </span>
              </button>

              <button
                onClick={() => addFilter("status", "accepted", "Accepted")}
                disabled={isFilterActive("status", "accepted")}
                className={cn(
                  "w-full flex items-center justify-between p-2 text-left rounded-md border transition-colors",
                  isFilterActive("status", "accepted")
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "hover:bg-gray-50 border-gray-200"
                )}
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Accepted</span>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                  {statusCounts.accepted}
                </span>
              </button>

              <button
                onClick={() => addFilter("status", "rejected", "Rejected")}
                disabled={isFilterActive("status", "rejected")}
                className={cn(
                  "w-full flex items-center justify-between p-2 text-left rounded-md border transition-colors",
                  isFilterActive("status", "rejected")
                    ? "bg-red-50 border-red-200 text-red-900"
                    : "hover:bg-gray-50 border-gray-200"
                )}
              >
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Rejected</span>
                </div>
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                  {statusCounts.rejected}
                </span>
              </button>
            </CardContent>
          </Card>

          {/* Programs */}
          {programs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-gray-400" />
                  Programs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {programs.map((program) => (
                  <button
                    key={program.id}
                    onClick={() =>
                      addFilter("program", program.id, program.label)
                    }
                    disabled={isFilterActive("program", program.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-2 text-left rounded-md border text-sm transition-colors",
                      isFilterActive("program", program.id)
                        ? "bg-blue-50 border-blue-200 text-blue-900"
                        : "hover:bg-gray-50 border-transparent"
                    )}
                  >
                    <span>{program.label}</span>
                    {program.count && (
                      <span className="text-xs text-gray-500">
                        {program.count}
                      </span>
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Academic Years */}
          {academicYears.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  Academic Year
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {academicYears.map((year) => (
                  <button
                    key={year.id}
                    onClick={() =>
                      addFilter("academicYear", year.id, year.label)
                    }
                    disabled={isFilterActive("academicYear", year.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-2 text-left rounded-md border text-sm transition-colors",
                      isFilterActive("academicYear", year.id)
                        ? "bg-purple-50 border-purple-200 text-purple-900"
                        : "hover:bg-gray-50 border-transparent"
                    )}
                  >
                    <span>{year.label}</span>
                    {year.count && (
                      <span className="text-xs text-gray-500">
                        {year.count}
                      </span>
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Committees */}
          {committees.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-400" />
                  Committees
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {committees.map((committee) => (
                  <button
                    key={committee.id}
                    onClick={() =>
                      addFilter("committee", committee.id, committee.label)
                    }
                    disabled={isFilterActive("committee", committee.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-2 text-left rounded-md border text-sm transition-colors",
                      isFilterActive("committee", committee.id)
                        ? "bg-green-50 border-green-200 text-green-900"
                        : "hover:bg-gray-50 border-transparent"
                    )}
                  >
                    <span>{committee.label}</span>
                    {committee.count && (
                      <span className="text-xs text-gray-500">
                        {committee.count}
                      </span>
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Date Range */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                Date Range
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label
                  htmlFor="date-start"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  From
                </label>
                <Input
                  id="date-start"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, start: e.target.value }))
                  }
                  className="text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="date-end"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  To
                </label>
                <Input
                  id="date-end"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, end: e.target.value }))
                  }
                  className="text-sm"
                />
              </div>
              <Button
                onClick={handleDateRangeApply}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Apply Date Range
              </Button>
            </CardContent>
          </Card>
        </div>
      </aside>
    </>
  );
};

export default FilterSidebar;
