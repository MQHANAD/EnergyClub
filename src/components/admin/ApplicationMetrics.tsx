'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Application } from '@/types';
import { 
  Clock,
  CheckCircle,
  XCircle,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3
} from 'lucide-react';

export interface MetricData {
  label: string;
  value: number;
  change?: number;
  trend?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  color: {
    bg: string;
    text: string;
    icon: string;
  };
}

export interface ApplicationMetricsProps {
  applications: Application[];
  className?: string;
  onMetricClick?: (metric: string) => void;
}

export const ApplicationMetrics: React.FC<ApplicationMetricsProps> = ({
  applications,
  className,
  onMetricClick
}) => {
  // Calculate metrics from applications data
  const totalApplications = applications.length;
  const pendingApplications = applications.filter(app => app.status === 'pending').length;
  const acceptedApplications = applications.filter(app => app.status === 'accepted').length;
  const rejectedApplications = applications.filter(app => app.status === 'rejected').length;

  // Calculate today's submissions
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayApplications = applications.filter(app => 
    app.submittedAt >= todayStart
  ).length;

  // Calculate this week's submissions
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekApplications = applications.filter(app => 
    app.submittedAt >= weekStart
  ).length;

  // Calculate acceptance rate
  const processedApplications = acceptedApplications + rejectedApplications;
  const acceptanceRate = processedApplications > 0 ? 
    Math.round((acceptedApplications / processedApplications) * 100) : 0;

  const metrics: MetricData[] = [
    {
      label: 'Total Applications',
      value: totalApplications,
      icon: Users,
      color: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        icon: 'text-blue-600'
      }
    },
    {
      label: 'Pending Review',
      value: pendingApplications,
      icon: Clock,
      color: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        icon: 'text-amber-600'
      }
    },
    {
      label: 'Accepted',
      value: acceptedApplications,
      icon: CheckCircle,
      color: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        icon: 'text-emerald-600'
      }
    },
    {
      label: 'Rejected',
      value: rejectedApplications,
      icon: XCircle,
      color: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        icon: 'text-red-600'
      }
    },
    {
      label: 'Today',
      value: todayApplications,
      icon: Calendar,
      color: {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        icon: 'text-purple-600'
      }
    },
    {
      label: 'This Week',
      value: weekApplications,
      icon: BarChart3,
      color: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        icon: 'text-indigo-600'
      }
    }
  ];

  // Add acceptance rate if there are processed applications
  if (processedApplications > 0) {
    metrics.push({
      label: 'Acceptance Rate',
      value: acceptanceRate,
      trend: acceptanceRate >= 50 ? 'positive' : acceptanceRate >= 25 ? 'neutral' : 'negative',
      icon: TrendingUp,
      color: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        icon: 'text-green-600'
      }
    });
  }

  const formatValue = (metric: MetricData) => {
    if (metric.label === 'Acceptance Rate') {
      return `${metric.value}%`;
    }
    return metric.value.toLocaleString();
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'positive':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'negative':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4", className)}>
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        
        return (
          <Card
            key={index}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
              metric.color.bg
            )}
            onClick={() => onMetricClick?.(metric.label.toLowerCase().replace(' ', '-'))}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Icon className={cn("h-4 w-4", metric.color.icon)} />
                    {metric.trend && getTrendIcon(metric.trend)}
                  </div>
                  <div className={cn("text-2xl font-bold", metric.color.text)}>
                    {formatValue(metric)}
                  </div>
                  <p className="text-xs text-gray-600 font-medium mt-1">
                    {metric.label}
                  </p>
                  {metric.change && (
                    <div className={cn(
                      "text-xs mt-1 flex items-center",
                      metric.trend === 'positive' ? 'text-green-600' : 
                      metric.trend === 'negative' ? 'text-red-600' : 'text-gray-600'
                    )}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {/* Summary Card */}
      {totalApplications > 0 && (
        <Card className="col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-6 bg-gradient-to-r from-yellow-50 to-yellow-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-yellow-800">
              <BarChart3 className="h-5 w-5 mr-2" />
              Quick Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {pendingApplications}
                </div>
                <div className="text-amber-700">
                  Need Review ({Math.round((pendingApplications / totalApplications) * 100)}%)
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700">
                  {processedApplications}
                </div>
                <div className="text-gray-600">
                  Processed ({Math.round((processedApplications / totalApplications) * 100)}%)
                </div>
              </div>
              
              {acceptanceRate > 0 && (
                <div className="text-center">
                  <div className={cn(
                    "text-2xl font-bold",
                    acceptanceRate >= 50 ? "text-green-600" : 
                    acceptanceRate >= 25 ? "text-yellow-600" : "text-red-600"
                  )}>
                    {acceptanceRate}%
                  </div>
                  <div className="text-gray-600">
                    Acceptance Rate
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ApplicationMetrics;