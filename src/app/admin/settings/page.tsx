"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { settingsApi, WebsiteSettings } from "@/lib/firestore";
import Navigation from "@/components/Navigation";
import LoadingSpinner from "@/components/register/LoadingSpinner";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ArrowLeft,
    Globe,
    Users,
    CreditCard,
    Check,
    AlertCircle,
} from "lucide-react";

interface SettingToggleProps {
    label: string;
    description: string;
    icon: React.ReactNode;
    enabled: boolean;
    saving: boolean;
    onToggle: () => void;
}

function SettingToggle({ label, description, icon, enabled, saving, onToggle }: SettingToggleProps) {
    return (
        <div className="flex items-center justify-between py-4">
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg mt-0.5 ${enabled ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                </div>
            </div>
            <button
                onClick={onToggle}
                disabled={saving}
                aria-label={`Toggle ${label}`}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#25818a] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${enabled ? "bg-[#25818a]" : "bg-gray-200"
                    }`}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? "translate-x-5" : "translate-x-0"
                        }`}
                />
            </button>
        </div>
    );
}

export default function AdminSettingsPage() {
    const { user, userProfile, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();

    const [settings, setSettings] = useState<WebsiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<keyof WebsiteSettings | null>(null);
    const [savedKey, setSavedKey] = useState<keyof WebsiteSettings | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Redirect non-admins
    useEffect(() => {
        if (!authLoading && userProfile !== null) {
            if (!user) router.push("/login");
            else if (!isAdmin) router.push("/");
        }
    }, [user, userProfile, isAdmin, authLoading, router]);

    // Load settings
    useEffect(() => {
        if (user && isAdmin) {
            settingsApi.getWebsiteSettings().then((s) => {
                setSettings(s);
                setLoading(false);
            }).catch(() => {
                setError("Failed to load settings.");
                setLoading(false);
            });
        }
    }, [user, isAdmin]);

    const handleToggle = async (key: keyof WebsiteSettings) => {
        if (!settings) return;
        const newValue = !settings[key];
        setSaving(key);
        setError(null);

        const optimistic = { ...settings, [key]: newValue };
        setSettings(optimistic);

        try {
            await settingsApi.updateWebsiteSettings({ [key]: newValue });
            setSavedKey(key);
            setTimeout(() => setSavedKey(null), 2000);
        } catch {
            // Revert on error
            setSettings(settings);
            setError("Failed to save setting. Please try again.");
        } finally {
            setSaving(null);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!user || !isAdmin) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main className="max-w-2xl mx-auto py-6 px-4 sm:px-6 pt-24">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/admin")}
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Admin
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Website Settings</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Control which pages are publicly accessible
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Page Visibility */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Globe className="h-4 w-4 text-[#25818a]" />
                            Page Visibility
                        </CardTitle>
                        <CardDescription>
                            Toggle pages on or off. Disabled pages show an "unavailable" message to visitors.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="divide-y divide-gray-100">
                        {settings && (
                            <>
                                <SettingToggle
                                    label="Team Page"
                                    description="Shows leadership, committees and members by region (/team)"
                                    icon={<Users className="h-4 w-4" />}
                                    enabled={settings.teamPageEnabled}
                                    saving={saving === "teamPageEnabled"}
                                    onToggle={() => handleToggle("teamPageEnabled")}
                                />
                                <SettingToggle
                                    label="Member Card Page"
                                    description="Lets members view and download their digital membership card (/member)"
                                    icon={<CreditCard className="h-4 w-4" />}
                                    enabled={settings.memberPageEnabled}
                                    saving={saving === "memberPageEnabled"}
                                    onToggle={() => handleToggle("memberPageEnabled")}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Save confirmation toast */}
                {savedKey && (
                    <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-green-600 text-white text-sm rounded-lg px-4 py-3 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Check className="h-4 w-4" />
                        Setting saved successfully
                    </div>
                )}
            </main>
        </div>
    );
}
