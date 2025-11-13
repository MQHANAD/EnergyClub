"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n";
import Navigation from "@/components/Navigation";
import LoadingSpinner from "@/components/register/LoadingSpinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarCheck, Filter } from "lucide-react";

// Dynamically import Recharts to handle missing package
let RechartsComponents: any = null;
try {
  const recharts = require('recharts');
  RechartsComponents = {
    LineChart: recharts.LineChart,
    Line: recharts.Line,
    BarChart: recharts.BarChart,
    Bar: recharts.Bar,
    PieChart: recharts.PieChart,
    Pie: recharts.Pie,
    Cell: recharts.Cell,
    XAxis: recharts.XAxis,
    YAxis: recharts.YAxis,
    CartesianGrid: recharts.CartesianGrid,
    Tooltip: recharts.Tooltip,
    Legend: recharts.Legend,
    ResponsiveContainer: recharts.ResponsiveContainer,
  };
} catch {
  // Recharts not installed, will show placeholder
}

// Dynamically import SWR
let useSWR: any = null;
try {
  useSWR = require('swr').default;
} catch {
  // SWR not installed
}
import { 
  Users, 
  TrendingUp, 
  Eye, 
  Activity,
  BarChart3
} from "lucide-react";

// Types for BigQuery analytics data
interface BigQueryAnalyticsData {
  totalUsers: number;
  weeklyActiveUsers?: number;
  monthlyActiveUsers?: number;
  newUsers?: number;
  returningUsers?: number;
  activeUsersByDay: Array<{ date: string; count: number }>;
  eventsFrequency: Array<{ eventName: string; count: number }>;
  screenViews: Array<{ screenName: string; count: number }>;
  devices?: Array<{ deviceCategory: string; os: string; platform: string; uniqueUsers: number; totalEvents: number }>;
  geography?: Array<{ country: string; uniqueUsers: number; totalEvents: number; percentage: number }>;
}

// SWR fetcher function
const fetcher = (url: string) => fetch(url).then(res => res.json());

// Colors for charts
const CHART_COLORS = [
  '#25818a', '#f8cd5c', '#3b82f6', '#10b981', '#f59e0b', 
  '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
];

// Map page paths to readable names
const getPageName = (path: string, lang: 'en' | 'ar'): string => {
  const pageNames: Record<string, { en: string; ar: string }> = {
    '/': { en: 'Home', ar: 'الرئيسية' },
    '/events': { en: 'Events', ar: 'الفعاليات' },
    '/team': { en: 'Team', ar: 'الفريق' },
    '/register': { en: 'Register', ar: 'التسجيل' },
    '/profile': { en: 'Profile', ar: 'الملف الشخصي' },
    '/admin': { en: 'Admin Dashboard', ar: 'لوحة التحكم' },
    '/admin/applications': { en: 'Applications', ar: 'الطلبات' },
    '/admin/team': { en: 'Team Management', ar: 'إدارة الفريق' },
    '/admin/analytics': { en: 'Analytics', ar: 'التحليلات' },
    '/admin/create-event': { en: 'Create Event', ar: 'إنشاء فعالية' },
    '/login': { en: 'Login', ar: 'تسجيل الدخول' },
  };

  const defaultName = { en: path, ar: path };
  const name = pageNames[path] || defaultName;
  return lang === 'ar' ? name.ar : name.en;
};

// Map event names to readable labels
const getEventName = (eventName: string, lang: 'en' | 'ar'): string => {
  const eventNames: Record<string, { en: string; ar: string }> = {
    'page_view': { en: 'Page View', ar: 'زيارة صفحة' },
    'event_view': { en: 'View Event', ar: 'عرض فعالية' },
    'event_registration': { en: 'Register for Event', ar: 'التسجيل في فعالية' },
    'team_view': { en: 'View Team', ar: 'عرض الفريق' },
    'login': { en: 'User Login', ar: 'تسجيل الدخول' },
    'sign_up': { en: 'User Signup', ar: 'إنشاء حساب' },
    'committee_page_view': { en: 'View Committee', ar: 'عرض اللجنة' },
  };

  const defaultName = { en: eventName, ar: eventName };
  const name = eventNames[eventName] || defaultName;
  return lang === 'ar' ? name.ar : name.en;
};

export default function AnalyticsPage() {
  const { user, isOrganizer, isAdmin, loading: authLoading } = useAuth();
  const canAccess = Boolean(isOrganizer || isAdmin);
  const router = useRouter();
  const { t, lang } = useI18n();
  
  // Use SWR to fetch analytics data from BigQuery API
  const [analyticsData, setAnalyticsData] = React.useState<BigQueryAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<any>(null);
  const [selectedTab, setSelectedTab] = React.useState<'overview' | 'users' | 'devices' | 'geography'>('overview');
  const [dateRange, setDateRange] = React.useState<number>(30);

  React.useEffect(() => {
    if (!canAccess) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/analytics?days=${dateRange}`);
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const data = await response.json();
        setAnalyticsData(data);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [canAccess, dateRange]);

  React.useEffect(() => {
    if (!authLoading && (!user || !canAccess)) {
      router.push('/login');
    }
  }, [user, canAccess, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !canAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                  <BarChart3 className="w-8 h-8 mr-3 text-[#25818a]" />
                  {lang === 'ar' ? 'لوحة التحليلات' : 'Analytics Dashboard'}
                </h1>
                <p className="text-gray-600">
                  {lang === 'ar' ? 'نظرة عامة على أداء المنصة ونشاط المستخدمين' : 'Overview of platform performance and user activity'}
                </p>
              </div>
              
              {/* Date Range Picker */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <div className="flex gap-2">
                  {[7, 30, 90, 365].map((days) => (
                    <Button
                      key={days}
                      onClick={() => setDateRange(days)}
                      variant={dateRange === days ? 'default' : 'outline'}
                      className={`${dateRange === days ? 'bg-[#25818a] text-white' : ''}`}
                    >
                      {days === 7 ? '7d' : days === 30 ? '30d' : days === 90 ? '90d' : '365d'}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setSelectedTab('overview')}
                className={`px-4 py-2 font-medium transition-colors ${
                  selectedTab === 'overview'
                    ? 'border-b-2 border-[#25818a] text-[#25818a]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {lang === 'ar' ? 'نظرة عامة' : 'Overview'}
              </button>
              <button
                onClick={() => setSelectedTab('users')}
                className={`px-4 py-2 font-medium transition-colors ${
                  selectedTab === 'users'
                    ? 'border-b-2 border-[#25818a] text-[#25818a]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {lang === 'ar' ? 'المستخدمون' : 'Users'}
              </button>
              <button
                onClick={() => setSelectedTab('devices')}
                className={`px-4 py-2 font-medium transition-colors ${
                  selectedTab === 'devices'
                    ? 'border-b-2 border-[#25818a] text-[#25818a]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {lang === 'ar' ? 'الأجهزة' : 'Devices'}
              </button>
              <button
                onClick={() => setSelectedTab('geography')}
                className={`px-4 py-2 font-medium transition-colors ${
                  selectedTab === 'geography'
                    ? 'border-b-2 border-[#25818a] text-[#25818a]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {lang === 'ar' ? 'الجغرافيا' : 'Geography'}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600">
                  {lang === 'ar' ? 'جارٍ تحميل التحليلات...' : 'Loading analytics...'}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-600">
              {lang === 'ar' ? 'خطأ في تحميل البيانات' : 'Error loading analytics data'}
            </div>
          ) : analyticsData ? (
            <div>
              {/* Overview Tab */}
              {selectedTab === 'overview' && (
                <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Users */}
                <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {lang === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}
                    </CardTitle>
                    <Users className="w-5 h-5 text-[#25818a]" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {analyticsData.totalUsers.toLocaleString(lang === 'ar' ? 'ar' : 'en')}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {lang === 'ar' ? 'الحسابات المسجلة' : 'Registered accounts'}
                    </p>
                  </CardContent>
                </Card>

                {/* Daily Active Users */}
                <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {lang === 'ar' ? 'المستخدمون النشطون' : 'Active Users'}
                    </CardTitle>
                    <Activity className="w-5 h-5 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {analyticsData.activeUsersByDay.reduce((sum, day) => sum + day.count, 0).toLocaleString(lang === 'ar' ? 'ar' : 'en')}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {lang === 'ar' ? 'آخر 30 يوم' : 'Last 30 days'}
                    </p>
                  </CardContent>
                </Card>

                {/* Total Events */}
                <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {lang === 'ar' ? 'إجمالي الأحداث' : 'Total Events'}
                    </CardTitle>
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {analyticsData.eventsFrequency.reduce((sum, event) => sum + event.count, 0).toLocaleString(lang === 'ar' ? 'ar' : 'en')}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {lang === 'ar' ? 'جميع الأحداث' : 'All events tracked'}
                    </p>
                  </CardContent>
                </Card>

                {/* Screen Views */}
                <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {lang === 'ar' ? 'مشاهدات الصفحات' : 'Screen Views'}
                    </CardTitle>
                    <Eye className="w-5 h-5 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {analyticsData.screenViews.reduce((sum, screen) => sum + screen.count, 0).toLocaleString(lang === 'ar' ? 'ar' : 'en')}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {lang === 'ar' ? 'جميع المشاهدات' : 'All screen views'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Weekly Active Users */}
                {analyticsData.weeklyActiveUsers && (
                  <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        {lang === 'ar' ? 'المستخدمون النشطون أسبوعياً' : 'Weekly Active Users'}
                      </CardTitle>
                      <Activity className="w-5 h-5 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">
                        {analyticsData.weeklyActiveUsers.toLocaleString(lang === 'ar' ? 'ar' : 'en')}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {lang === 'ar' ? 'الأسبوع الحالي' : 'Current week'}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Monthly Active Users */}
                {analyticsData.monthlyActiveUsers && (
                  <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        {lang === 'ar' ? 'المستخدمون النشطون شهرياً' : 'Monthly Active Users'}
                      </CardTitle>
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">
                        {analyticsData.monthlyActiveUsers.toLocaleString(lang === 'ar' ? 'ar' : 'en')}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {lang === 'ar' ? 'الشهر الحالي' : 'Current month'}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* New Users */}
                {analyticsData.newUsers && (
                  <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        {lang === 'ar' ? 'المستخدمون الجدد' : 'New Users'}
                      </CardTitle>
                      <Users className="w-5 h-5 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">
                        {analyticsData.newUsers.toLocaleString(lang === 'ar' ? 'ar' : 'en')}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {analyticsData.totalUsers > 0 
                          ? `${Math.round((analyticsData.newUsers / analyticsData.totalUsers) * 100).toLocaleString(lang === 'ar' ? 'ar' : 'en')}% ${lang === 'ar' ? 'من إجمالي' : 'of total'}`
                          : lang === 'ar' ? 'المستخدمون الجدد' : 'New users'}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Returning Users */}
                {analyticsData.returningUsers && (
                  <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        {lang === 'ar' ? 'المستخدمون المتكررون' : 'Returning Users'}
                      </CardTitle>
                      <Users className="w-5 h-5 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">
                        {analyticsData.returningUsers.toLocaleString(lang === 'ar' ? 'ar' : 'en')}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {analyticsData.totalUsers > 0
                          ? `${Math.round((analyticsData.returningUsers / analyticsData.totalUsers) * 100).toLocaleString(lang === 'ar' ? 'ar' : 'en')}% ${lang === 'ar' ? 'من إجمالي' : 'of total'}`
                          : lang === 'ar' ? 'المستخدمون المتكررون' : 'Returning users'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Daily Active Users Line Chart */}
                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      {lang === 'ar' ? 'المستخدمون النشطون اليوميون' : 'Daily Active Users'}
                    </CardTitle>
                    <CardDescription>
                      {lang === 'ar' ? 'عدد المستخدمين النشطين خلال آخر 30 يوم' : 'Number of active users over the last 30 days'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {RechartsComponents ? (
                      <RechartsComponents.ResponsiveContainer width="100%" height={300}>
                        <RechartsComponents.LineChart data={analyticsData.activeUsersByDay}>
                          <RechartsComponents.CartesianGrid strokeDasharray="3 3" />
                          <RechartsComponents.XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value: string) => {
                              const date = new Date(value);
                              return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });
                            }}
                          />
                          <RechartsComponents.YAxis tick={{ fontSize: 12 }} />
                          <RechartsComponents.Tooltip 
                            labelFormatter={(label: string) => {
                              const date = new Date(label);
                              return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              });
                            }}
                          />
                          <RechartsComponents.Legend />
                          <RechartsComponents.Line 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#25818a" 
                            strokeWidth={2} 
                            dot={{ fill: '#25818a', r: 4 }}
                            name={lang === 'ar' ? 'المستخدمون' : 'Users'}
                          />
                        </RechartsComponents.LineChart>
                      </RechartsComponents.ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        {lang === 'ar' ? 'تثبيت حزمة recharts لعرض البيانات' : 'Install recharts package to display data'}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Event Frequency Bar Chart */}
                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      {lang === 'ar' ? 'تردد الأحداث' : 'Event Frequency'}
                    </CardTitle>
                    <CardDescription>
                      {lang === 'ar' ? 'الأحداث الأكثر شيوعاً' : 'Most common events'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {RechartsComponents ? (
                      <RechartsComponents.ResponsiveContainer width="100%" height={300}>
                        <RechartsComponents.BarChart data={analyticsData.eventsFrequency.map(item => ({
                          ...item,
                          displayName: getEventName(item.eventName, lang as 'en' | 'ar')
                        }))}>
                          <RechartsComponents.CartesianGrid strokeDasharray="3 3" />
                          <RechartsComponents.XAxis 
                            dataKey="displayName"
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={100}
                          />
                          <RechartsComponents.YAxis tick={{ fontSize: 12 }} />
                          <RechartsComponents.Tooltip 
                            formatter={(value: any, payload: any) => [
                              value,
                              lang === 'ar' ? 'العدد' : 'Count'
                            ]}
                          />
                          <RechartsComponents.Legend />
                          <RechartsComponents.Bar dataKey="count" fill="#25818a" name={lang === 'ar' ? 'العدد' : 'Count'} />
                        </RechartsComponents.BarChart>
                      </RechartsComponents.ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        {lang === 'ar' ? 'تثبيت حزمة recharts لعرض البيانات' : 'Install recharts package to display data'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Screen Views Pie Chart */}
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {lang === 'ar' ? 'توزيع مشاهدات الصفحات' : 'Screen Views Distribution'}
                  </CardTitle>
                  <CardDescription>
                    {lang === 'ar' ? 'أكثر الصفحات زيارة' : 'Most visited pages'}
                  </CardDescription>
                </CardHeader>
                  <CardContent>
                    {RechartsComponents ? (
                      <RechartsComponents.ResponsiveContainer width="100%" height={400}>
                        <RechartsComponents.PieChart>
                          <RechartsComponents.Pie
                            data={analyticsData.screenViews.map(item => ({
                              ...item,
                              displayName: getPageName(item.screenName, lang as 'en' | 'ar')
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ displayName, percent }: any) => `${displayName}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {analyticsData.screenViews.map((entry, index) => (
                              <RechartsComponents.Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </RechartsComponents.Pie>
                          <RechartsComponents.Tooltip 
                            formatter={(value: any, payload: any) => [
                              value,
                              payload[0]?.payload?.displayName || ''
                            ]}
                          />
                          <RechartsComponents.Legend 
                            formatter={(value: string, entry: any) => entry.payload.displayName}
                          />
                        </RechartsComponents.PieChart>
                      </RechartsComponents.ResponsiveContainer>
                    ) : (
                      <div className="h-[400px] flex items-center justify-center text-gray-500">
                        {lang === 'ar' ? 'تثبيت حزمة recharts لعرض البيانات' : 'Install recharts package to display data'}
                      </div>
                    )}
                  </CardContent>
              </Card>

              {/* Devices & Platforms Section */}
              {analyticsData.devices && analyticsData.devices.length > 0 && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-12">
                    {lang === 'ar' ? 'الأجهزة والمنصات' : 'Devices & Platforms'}
                  </h2>
                  
                  <Card className="bg-white border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-gray-900">
                        {lang === 'ar' ? 'توزيع الأجهزة' : 'Device Distribution'}
                      </CardTitle>
                      <CardDescription>
                        {lang === 'ar' ? 'الأجهزة والأنظمة المستخدمة للوصول إلى المنصة' : 'Devices and operating systems used to access the platform'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {RechartsComponents ? (
                        <RechartsComponents.ResponsiveContainer width="100%" height={400}>
                          <RechartsComponents.BarChart data={analyticsData.devices} layout="vertical">
                            <RechartsComponents.CartesianGrid strokeDasharray="3 3" />
                            <RechartsComponents.XAxis type="number" tick={{ fontSize: 12 }} />
                            <RechartsComponents.YAxis 
                              dataKey="deviceCategory" 
                              type="category" 
                              tick={{ fontSize: 12 }}
                              width={100}
                            />
                            <RechartsComponents.Tooltip 
                              formatter={(value: any, payload: any) => [
                                value,
                                payload[0]?.payload?.os || ''
                              ]}
                            />
                            <RechartsComponents.Legend />
                            <RechartsComponents.Bar dataKey="uniqueUsers" fill="#3b82f6" name={lang === 'ar' ? 'المستخدمون' : 'Users'} />
                            <RechartsComponents.Bar dataKey="totalEvents" fill="#10b981" name={lang === 'ar' ? 'الأحداث' : 'Events'} />
                          </RechartsComponents.BarChart>
                        </RechartsComponents.ResponsiveContainer>
                      ) : (
                        <div className="h-[400px] flex items-center justify-center text-gray-500">
                          {lang === 'ar' ? 'تثبيت حزمة recharts لعرض البيانات' : 'Install recharts package to display data'}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Geographic Distribution Section */}
              {analyticsData.geography && analyticsData.geography.length > 0 && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-12">
                    {lang === 'ar' ? 'التوزيع الجغرافي' : 'Geographic Distribution'}
                  </h2>
                  
                  <Card className="bg-white border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-gray-900">
                        {lang === 'ar' ? 'المستخدمون حسب الدولة' : 'Users by Country'}
                      </CardTitle>
                      <CardDescription>
                        {lang === 'ar' ? 'توزيع المستخدمين حسب البلدان' : 'Distribution of users by country'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {RechartsComponents ? (
                        <RechartsComponents.ResponsiveContainer width="100%" height={400}>
                          <RechartsComponents.BarChart data={analyticsData.geography}>
                            <RechartsComponents.CartesianGrid strokeDasharray="3 3" />
                            <RechartsComponents.XAxis 
                              dataKey="country" 
                              tick={{ fontSize: 12 }}
                              angle={-45}
                              textAnchor="end"
                              height={100}
                            />
                            <RechartsComponents.YAxis tick={{ fontSize: 12 }} />
                            <RechartsComponents.Tooltip 
                              formatter={(value: any, payload: any) => [
                                `${value} (${payload[0]?.payload?.percentage || 0}%)`,
                                lang === 'ar' ? 'المستخدمون' : 'Users'
                              ]}
                            />
                            <RechartsComponents.Legend />
                            <RechartsComponents.Bar dataKey="uniqueUsers" fill="#f59e0b" name={lang === 'ar' ? 'المستخدمون' : 'Users'} />
                          </RechartsComponents.BarChart>
                        </RechartsComponents.ResponsiveContainer>
                      ) : (
                        <div className="h-[400px] flex items-center justify-center text-gray-500">
                          {lang === 'ar' ? 'تثبيت حزمة recharts لعرض البيانات' : 'Install recharts package to display data'}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
                </div>
              )}

              {/* Users Tab */}
              {selectedTab === 'users' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {lang === 'ar' ? 'تحليل المستخدمين' : 'User Analytics'}
                  </h2>
                  <p className="text-gray-600">
                    {lang === 'ar' ? 'تحليل دقيق لنشاط المستخدمين' : 'Detailed analysis of user activity'}
                  </p>
                </div>
              )}

              {/* Devices Tab */}
              {selectedTab === 'devices' && analyticsData.devices && analyticsData.devices.length > 0 && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {lang === 'ar' ? 'تحليل الأجهزة' : 'Device Analytics'}
                  </h2>
                  
                  <Card className="bg-white border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-gray-900">
                        {lang === 'ar' ? 'توزيع الأجهزة' : 'Device Distribution'}
                      </CardTitle>
                      <CardDescription>
                        {lang === 'ar' ? 'الأجهزة والأنظمة المستخدمة للوصول إلى المنصة' : 'Devices and operating systems used to access the platform'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {RechartsComponents ? (
                        <RechartsComponents.ResponsiveContainer width="100%" height={400}>
                          <RechartsComponents.BarChart data={analyticsData.devices} layout="vertical">
                            <RechartsComponents.CartesianGrid strokeDasharray="3 3" />
                            <RechartsComponents.XAxis type="number" tick={{ fontSize: 12 }} />
                            <RechartsComponents.YAxis 
                              dataKey="deviceCategory" 
                              type="category" 
                              tick={{ fontSize: 12 }}
                              width={100}
                            />
                            <RechartsComponents.Tooltip 
                              formatter={(value: any, payload: any) => [
                                value,
                                payload[0]?.payload?.os || ''
                              ]}
                            />
                            <RechartsComponents.Legend />
                            <RechartsComponents.Bar dataKey="uniqueUsers" fill="#3b82f6" name={lang === 'ar' ? 'المستخدمون' : 'Users'} />
                            <RechartsComponents.Bar dataKey="totalEvents" fill="#10b981" name={lang === 'ar' ? 'الأحداث' : 'Events'} />
                          </RechartsComponents.BarChart>
                        </RechartsComponents.ResponsiveContainer>
                      ) : (
                        <div className="h-[400px] flex items-center justify-center text-gray-500">
                          {lang === 'ar' ? 'تثبيت حزمة recharts لعرض البيانات' : 'Install recharts package to display data'}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Geography Tab */}
              {selectedTab === 'geography' && analyticsData.geography && analyticsData.geography.length > 0 && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {lang === 'ar' ? 'التحليل الجغرافي' : 'Geographic Analytics'}
                  </h2>
                  
                  <Card className="bg-white border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-gray-900">
                        {lang === 'ar' ? 'المستخدمون حسب الدولة' : 'Users by Country'}
                      </CardTitle>
                      <CardDescription>
                        {lang === 'ar' ? 'توزيع المستخدمين حسب البلدان' : 'Distribution of users by country'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {RechartsComponents ? (
                        <RechartsComponents.ResponsiveContainer width="100%" height={400}>
                          <RechartsComponents.BarChart data={analyticsData.geography}>
                            <RechartsComponents.CartesianGrid strokeDasharray="3 3" />
                            <RechartsComponents.XAxis 
                              dataKey="country" 
                              tick={{ fontSize: 12 }}
                              angle={-45}
                              textAnchor="end"
                              height={100}
                            />
                            <RechartsComponents.YAxis tick={{ fontSize: 12 }} />
                            <RechartsComponents.Tooltip 
                              formatter={(value: any, payload: any) => [
                                `${value} (${payload[0]?.payload?.percentage || 0}%)`,
                                lang === 'ar' ? 'المستخدمون' : 'Users'
                              ]}
                            />
                            <RechartsComponents.Legend />
                            <RechartsComponents.Bar dataKey="uniqueUsers" fill="#f59e0b" name={lang === 'ar' ? 'المستخدمون' : 'Users'} />
                          </RechartsComponents.BarChart>
                        </RechartsComponents.ResponsiveContainer>
                      ) : (
                        <div className="h-[400px] flex items-center justify-center text-gray-500">
                          {lang === 'ar' ? 'تثبيت حزمة recharts لعرض البيانات' : 'Install recharts package to display data'}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
