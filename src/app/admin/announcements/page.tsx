"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { announcementsApi, usersApi } from "@/lib/firestore";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { Announcement } from "@/types";
import Navigation from "@/components/Navigation";
import LoadingSpinner from "@/components/register/LoadingSpinner";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Input from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Megaphone,
    Send,
    Trash2,
    Plus,
    ArrowLeft,
    Users,
    UserCheck,
    X,
} from "lucide-react";

export default function AdminAnnouncementsPage() {
    const { user, userProfile, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [publishing, setPublishing] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    // Create form state
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [audience, setAudience] = useState<"all" | "specific">("all");
    const [emailInput, setEmailInput] = useState("");
    const [emails, setEmails] = useState<string[]>([]);
    const [creating, setCreating] = useState(false);
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // SendGrid Credits State
    const [credits, setCredits] = useState<{ remain: number; total: number; reset_date: string; error?: string } | null>(null);
    const [loadingCredits, setLoadingCredits] = useState(false);
    const [totalUserCount, setTotalUserCount] = useState<number | null>(null);

    // Fetch SendGrid Credits and User Count
    useEffect(() => {
        const fetchCredits = async () => {
            if (user && isAdmin) {
                try {
                    setLoadingCredits(true);
                    const getCredits = httpsCallable(functions, 'getSendGridCredits');
                    const result = await getCredits();
                    setCredits(result.data as any);
                } catch (err) {
                    console.error("Error fetching SendGrid credits:", err);
                } finally {
                    setLoadingCredits(false);
                }
            }
        };

        const fetchUserCount = async () => {
            if (user && isAdmin) {
                const count = await usersApi.getAllUsersCount();
                setTotalUserCount(count);
            }
        };

        fetchCredits();
        fetchUserCount();
    }, [user, isAdmin]);

    // Search users when email input changes
    useEffect(() => {
        const searchUsers = async () => {
            if (emailInput.length >= 2 && audience === "specific") {
                setIsSearching(true);
                try {
                    const results = await usersApi.searchUsers(emailInput);
                    // Filter out already selected emails
                    setSearchResults(results.filter(email => !emails.includes(email)));
                } catch (err) {
                    console.error("Error searching users:", err);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        };

        const timeoutId = setTimeout(searchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [emailInput, audience, emails]);

    // Redirect non-admins
    useEffect(() => {
        if (!authLoading && userProfile !== null) {
            if (!user) {
                router.push("/login");
            } else if (!isAdmin) {
                router.push("/");
            }
        }
    }, [user, userProfile, isAdmin, authLoading, router]);

    // Load announcements
    useEffect(() => {
        if (user && isAdmin) {
            loadAnnouncements();
        }
    }, [user, isAdmin]);

    const loadAnnouncements = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await announcementsApi.getAllAnnouncements();
            setAnnouncements(data);
        } catch (err) {
            console.error("Error loading announcements:", err);
            setError("Failed to load announcements.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddEmail = () => {
        const trimmed = emailInput.trim().toLowerCase();
        if (trimmed && !emails.includes(trimmed) && trimmed.includes("@")) {
            setEmails((prev) => [...prev, trimmed]);
            setEmailInput("");
            setSearchResults([]);
        }
    };

    const handleSelectEmail = (email: string) => {
        if (!emails.includes(email)) {
            setEmails((prev) => [...prev, email]);
            setEmailInput("");
            setSearchResults([]);
        }
    };

    const handleRemoveEmail = (email: string) => {
        setEmails((prev) => prev.filter((e) => e !== email));
    };

    const handleCreate = async () => {
        if (!title.trim() || !body.trim()) {
            setError("Title and body are required.");
            return;
        }
        if (audience === "specific" && emails.length === 0) {
            setError("Please add at least one recipient email.");
            return;
        }
        if (!user || !userProfile) return;

        try {
            setCreating(true);
            setError(null);
            await announcementsApi.createAnnouncement({
                title: title.trim(),
                body: body.trim(),
                audience,
                recipientEmails: audience === "specific" ? emails : [],
                createdBy: user.uid,
                createdByName: userProfile.displayName || "Admin",
                createdByEmail: user.email || "",
            });
            // Reset form
            setTitle("");
            setBody("");
            setAudience("all");
            setEmails([]);
            setEmailInput("");
            setShowForm(false);
            await loadAnnouncements();
        } catch (err) {
            console.error("Error creating announcement:", err);
            setError("Failed to create announcement.");
        } finally {
            setCreating(false);
        }
    };

    const handlePublish = async (announcementId: string) => {
        if (!confirm("Publish this announcement? An email will be sent to the audience.")) return;
        try {
            setPublishing(announcementId);
            await announcementsApi.publishAnnouncement(announcementId);
            await loadAnnouncements();
        } catch (err) {
            console.error("Error publishing:", err);
            setError("Failed to publish announcement.");
        } finally {
            setPublishing(null);
        }
    };

    const handleDelete = async (announcementId: string) => {
        if (!confirm("Delete this announcement? This cannot be undone.")) return;
        try {
            setDeleting(announcementId);
            await announcementsApi.deleteAnnouncement(announcementId);
            await loadAnnouncements();
        } catch (err) {
            console.error("Error deleting:", err);
            setError("Failed to delete announcement.");
        } finally {
            setDeleting(null);
        }
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        }).format(date);
    };

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

    if (!user || !isAdmin) return null;

    return (
        <div className="min-h-screen bg-white bg-cover bg-center bg-fixed pt-16">
            <Navigation />

            <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
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
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900">
                                Announcements
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Create and manage announcements for your users
                            </p>
                        </div>

                        {/* Credits Display */}
                        {loadingCredits ? (
                            <div className="text-sm text-gray-500">Loading credits...</div>
                        ) : credits ? (
                            credits.error === 'forbidden' ? (
                                <div className="bg-yellow-50 p-2 px-3 rounded-lg border border-yellow-200 text-xs text-yellow-700 font-medium">
                                    API Key Access Restricted
                                </div>
                            ) : (
                                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${credits.remain < 1000 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        <Send className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Remaining Emails</p>
                                        <p className="text-lg font-bold text-gray-900">{credits.remain?.toLocaleString() ?? '-'}</p>
                                    </div>
                                </div>
                            )
                        ) : null}
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Create Button / Form */}
                    {!showForm ? (
                        <Button
                            onClick={() => setShowForm(true)}
                            className="mb-6 bg-[#25818a] hover:bg-[#1e6b73]"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Announcement
                        </Button>
                    ) : (
                        <Card className="mb-8 border-[#25818a]/20">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Megaphone className="h-5 w-5 text-[#25818a]" />
                                    New Announcement
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Title */}
                                <div>
                                    <Label htmlFor="ann-title">Title</Label>
                                    <Input
                                        id="ann-title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Announcement title"
                                        className="mt-1"
                                    />
                                </div>

                                {/* Body */}
                                <div>
                                    <Label htmlFor="ann-body">Content</Label>
                                    <Textarea
                                        id="ann-body"
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        placeholder="Write your announcement content here..."
                                        rows={6}
                                        className="mt-1"
                                    />
                                </div>

                                {/* Audience Selector */}
                                <div>
                                    <Label>Target Audience</Label>
                                    <div className="flex gap-3 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => setAudience("all")}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${audience === "all"
                                                ? "border-[#25818a] bg-[#25818a]/10 text-[#25818a]"
                                                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                                }`}
                                        >
                                            <Users className="h-4 w-4" />
                                            All Users {totalUserCount !== null ? `(${totalUserCount.toLocaleString()})` : ''}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAudience("specific")}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${audience === "specific"
                                                ? "border-[#25818a] bg-[#25818a]/10 text-[#25818a]"
                                                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                                }`}
                                        >
                                            <UserCheck className="h-4 w-4" />
                                            Specific Users {emails.length > 0 ? `(${emails.length})` : ''}
                                        </button>
                                    </div>
                                </div>

                                {/* Specific Users Email Input */}
                                {audience === "specific" && (
                                    <div>
                                        <Label>Recipient Emails</Label>
                                        <div className="flex gap-2 mt-1 relative">
                                            <Input
                                                value={emailInput}
                                                onChange={(e) => setEmailInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        handleAddEmail();
                                                    }
                                                }}
                                                placeholder="user@example.com"
                                                className="flex-1"
                                                autoComplete="off"
                                            />
                                            {/* Autocomplete Dropdown */}
                                            {searchResults.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                                    {searchResults.map((email) => (
                                                        <button
                                                            key={email}
                                                            type="button"
                                                            onClick={() => handleSelectEmail(email)}
                                                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                                                        >
                                                            {email}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleAddEmail}
                                            >
                                                Add
                                            </Button>
                                        </div>
                                        {emails.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {emails.map((email) => (
                                                    <span
                                                        key={email}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#25818a]/10 text-[#25818a] rounded-full text-sm"
                                                    >
                                                        {email}
                                                        <button
                                                            onClick={() => handleRemoveEmail(email)}
                                                            className="hover:text-red-600 transition-colors"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-500 mt-2">
                                            Press Enter or click Add to add each email
                                        </p>
                                    </div>
                                )}

                                {/* Form Actions */}
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        onClick={handleCreate}
                                        disabled={creating}
                                        className="bg-[#25818a] hover:bg-[#1e6b73]"
                                    >
                                        {creating ? "Creating..." : "Create Draft"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowForm(false);
                                            setTitle("");
                                            setBody("");
                                            setAudience("all");
                                            setEmails([]);
                                            setError(null);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Announcements List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="text-center py-16">
                            <Megaphone className="mx-auto h-12 w-12 text-gray-300" />
                            <h3 className="mt-4 text-lg font-medium text-gray-900">
                                No announcements yet
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Create your first announcement to get started.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {announcements.map((ann) => (
                                <Card
                                    key={ann.id}
                                    className="hover:shadow-md transition-shadow"
                                >
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                        {ann.title}
                                                    </h3>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ann.status === "published"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-yellow-100 text-yellow-800"
                                                            }`}
                                                    >
                                                        {ann.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 line-clamp-2 whitespace-pre-line">
                                                    {ann.body}
                                                </p>
                                                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                                    <span>
                                                        {ann.audience === "all"
                                                            ? "All Users"
                                                            : `${ann.recipientEmails.length} recipient(s)`}
                                                    </span>
                                                    <span>·</span>
                                                    <span>
                                                        Created {formatDate(ann.createdAt)}
                                                    </span>
                                                    {ann.publishedAt && (
                                                        <>
                                                            <span>·</span>
                                                            <span>
                                                                Published {formatDate(ann.publishedAt)}
                                                            </span>
                                                        </>
                                                    )}
                                                    <span>·</span>
                                                    <span>by {ann.createdByName}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {ann.status === "draft" && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handlePublish(ann.id)}
                                                        disabled={publishing === ann.id}
                                                        className="bg-[#25818a] hover:bg-[#1e6b73]"
                                                    >
                                                        <Send className="h-3.5 w-3.5 mr-1" />
                                                        {publishing === ann.id
                                                            ? "Publishing..."
                                                            : "Publish"}
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(ann.id)}
                                                    disabled={deleting === ann.id}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
