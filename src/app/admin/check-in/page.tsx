'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { eventsApi } from '@/lib/firestore';
import { checkInRegistration, CheckInResult } from '@/lib/check-in';
import { Event } from '@/types';
import Navigation from '@/components/Navigation';

// Brand colors - consistent with project
const BRAND_PRIMARY = '#25818a';
const BRAND_PRIMARY_DARK = '#1a5f66';
const BRAND_ACCENT = '#f8cd5c';

type ScanState =
    | 'ready'
    | 'loading'
    | 'not_found'
    | 'waitlist'
    | 'cancelled'
    | 'already_checked_in'
    | 'checked_in';

const stateConfig: Record<ScanState, {
    bgStyle: React.CSSProperties;
    icon: string;
    title: string;
    showName: boolean;
}> = {
    ready: {
        bgStyle: { background: `linear-gradient(135deg, ${BRAND_PRIMARY} 0%, ${BRAND_PRIMARY_DARK} 100%)` },
        icon: '⚡️',
        title: 'Ready to Scan',
        showName: false,
    },
    loading: {
        bgStyle: { background: `linear-gradient(135deg, ${BRAND_PRIMARY} 0%, ${BRAND_PRIMARY_DARK} 100%)` },
        icon: '⏳',
        title: 'Validating Ticket...',
        showName: false,
    },
    not_found: {
        bgStyle: { background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' },
        icon: '❌',
        title: 'Ticket Not Found',
        showName: false,
    },
    waitlist: {
        bgStyle: { background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)' },
        icon: '⏳',
        title: 'Not Accepted Yet',
        showName: true,
    },
    cancelled: {
        bgStyle: { background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' },
        icon: '❌',
        title: 'Registration Cancelled',
        showName: true,
    },
    already_checked_in: {
        bgStyle: { background: `linear-gradient(135deg, ${BRAND_ACCENT} 0%, #d97706 100%)` },
        icon: '⚠️',
        title: 'Already Checked In',
        showName: true,
    },
    checked_in: {
        bgStyle: { background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)' },
        icon: '✅',
        title: 'Check-in Successful',
        showName: true,
    },
};

export default function CheckInPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [scanState, setScanState] = useState<ScanState>('ready');
    const [scanResult, setScanResult] = useState<CheckInResult | null>(null);
    const [scannedCode, setScannedCode] = useState('');
    const [isLocked, setIsLocked] = useState(false);
    const [showFlash, setShowFlash] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const scanBufferRef = useRef('');
    const lockTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const successAudioRef = useRef<HTMLAudioElement | null>(null);
    const errorAudioRef = useRef<HTMLAudioElement | null>(null);

    // Auth check
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?from=/admin/check-in');
        }
    }, [user, authLoading, router]);

    // Fetch events
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const { events: fetchedEvents } = await eventsApi.getEvents(undefined, 50);
                setEvents(fetchedEvents);
                if (fetchedEvents.length > 0 && !selectedEventId) {
                    setSelectedEventId(fetchedEvents[0].id);
                }
            } catch (error) {
                console.error('Error fetching events:', error);
            }
        };

        if (user) {
            fetchEvents();
        }
    }, [user, selectedEventId]);

    // Time update
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Initialize audio
    useEffect(() => {
        // Create simple beep sounds using Web Audio API
        const createBeep = (frequency: number, duration: number) => {
            return () => {
                try {
                    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    oscillator.frequency.value = frequency;
                    oscillator.type = 'sine';

                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + duration);
                } catch (e) {
                    console.warn('Audio playback failed:', e);
                }
            };
        };

        (successAudioRef as any).current = createBeep(880, 0.15); // Higher pitch for success
        (errorAudioRef as any).current = createBeep(220, 0.3); // Lower pitch for error
    }, []);

    // Play sound based on state
    const playSound = useCallback((success: boolean) => {
        if (success && (successAudioRef as any).current) {
            (successAudioRef as any).current();
        } else if (!success && (errorAudioRef as any).current) {
            (errorAudioRef as any).current();
        }
    }, []);

    // Process scanned code
    const processCheckIn = useCallback(async (registrationId: string) => {
        if (!registrationId.trim()) return;

        setScannedCode(registrationId);
        setScanState('loading');
        setShowFlash(true);

        // Clear flash after animation
        setTimeout(() => setShowFlash(false), 300);

        try {
            const result = await checkInRegistration(registrationId);
            setScanResult(result);
            setScanState(result.status);
            playSound(result.success);
        } catch (error) {
            console.error('Check-in error:', error);
            setScanState('not_found');
            setScanResult({
                success: false,
                status: 'not_found',
                message: 'An error occurred during check-in.',
            });
            playSound(false);
        }

        // Lock input for 1.5 seconds
        setIsLocked(true);
        lockTimeoutRef.current = setTimeout(() => {
            setIsLocked(false);
        }, 1500);

        // Auto-reset to ready state after 3 seconds
        resetTimeoutRef.current = setTimeout(() => {
            setScanState('ready');
            setScanResult(null);
            setScannedCode('');
        }, 3000);
    }, [playSound]);

    // Keyboard listener for scanner input
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if locked or if typing in an input
            if (isLocked || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
                return;
            }

            if (e.key === 'Enter') {
                // Process the buffered input
                const code = scanBufferRef.current.trim();
                scanBufferRef.current = '';

                if (code) {
                    // Clear any existing timeouts
                    if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
                    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);

                    processCheckIn(code);
                }
            } else if (e.key.length === 1) {
                // Add character to buffer (single characters only)
                scanBufferRef.current += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLocked, processCheckIn]);

    // Cleanup timeouts
    useEffect(() => {
        return () => {
            if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
            if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        };
    }, []);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white text-2xl">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const config = stateConfig[scanState];
    const selectedEvent = events.find(e => e.id === selectedEventId);

    return (
        <div className="min-h-screen transition-all duration-300 flex flex-col relative overflow-hidden pt-22" style={config.bgStyle}>
            <Navigation colorScheme="dark" />

            {/* Flash overlay for new scan */}
            {showFlash && (
                <div className="absolute inset-0 bg-white z-50 animate-flash pointer-events-none" />
            )}

            {/* Header - Glass pills style */}
            <header className="px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-evenly  z-10 pointer-events-none relative">
                {/* Left Pill: Logo & Time */}
                <div className="flex items-center gap-4 bg-black/20 backdrop-blur-md rounded-full pl-2 pr-6 py-2 border border-white/10 pointer-events-auto shadow-lg">
                    <button
                        onClick={() => router.push('/admin')}
                        className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer"
                        title="Back to Admin"
                    >
                        <span className="sr-only">Back</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <img
                        src="/EW.svg"
                        alt="Energy Club"
                        className="h-10 w-auto"
                    />
                    <div className="text-white flex flex-col">
                        <span className="text-sm font-bold leading-tight">Event Check-in</span>
                        <span className="text-xs opacity-80">
                            {currentTime.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </span>
                    </div>

                </div>

                {/* Right Pill: Controls */}
                <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md rounded-full p-4 border border-white/10 pointer-events-auto shadow-lg">
                    <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="bg-transparent text-white border-r border-white/10 px-4 py-1 text-sm focus:outline-none min-w-[140px] appearance-none cursor-pointer hover:bg-white/5 rounded-l-full"
                        style={{ backgroundImage: 'none' }}
                    >
                        {events.map((event) => (
                            <option key={event.id} value={event.id} className="text-black">
                                {event.title}
                            </option>
                        ))}
                    </select>
                </div>
            </header>



            {/* Main content */}
            <main className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="text-center animate-fade-in-up">
                    {/* Icon */}
                    <div className={`text-[120px] sm:text-[180px] mb-4 ${scanState === 'checked_in' ? 'animate-bounce-custom' : ''}`}>
                        {config.icon}
                    </div>

                    {/* Status title */}
                    <h2 className={`text-4xl sm:text-6xl lg:text-8xl font-bold text-white mb-4 tracking-tight ${scanState === 'checked_in' ? 'check-in-success-glow' : ''
                        }`}>
                        {config.title}
                    </h2>

                    {/* User name */}
                    {config.showName && scanResult?.registration && (
                        <div className="mt-6">
                            <p className="text-3xl sm:text-5xl lg:text-7xl font-semibold text-white/90 mb-2">
                                {scanResult.registration.userName}
                            </p>
                            <p className="text-lg sm:text-2xl text-white/70">
                                {scanResult.registration.userEmail}
                            </p>
                        </div>
                    )}

                    {/* Ready state helper text */}
                    {scanState === 'ready' && (
                        <div className="mt-8">
                            <p className="text-xl sm:text-2xl text-white/60 animate-pulse">
                                Scan a QR code to check in...
                            </p>
                            <div className="mt-6 flex items-center justify-center gap-3 text-white/40">
                                <div className="w-3 h-3 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '0s' }} />
                                <div className="w-3 h-3 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '0.2s' }} />
                                <div className="w-3 h-3 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '0.4s' }} />
                            </div>
                        </div>
                    )}

                    {/* Loading spinner */}
                    {scanState === 'loading' && (
                        <div className="mt-8">
                            <div className="inline-block w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        </div>
                    )}

                    {/* Scanned code display (for debugging) */}
                    {scannedCode && scanState !== 'ready' && scanState !== 'loading' && (
                        <p className="mt-6 text-sm text-white/40 font-mono">
                            ID: {scannedCode.substring(0, 20)}{scannedCode.length > 20 ? '...' : ''}
                        </p>
                    )}
                </div>
            </main>

            {/* Footer with stats */}
            <footer className="p-4 bg-black/20 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-8 text-white/60 text-sm">
                    <span>🔒 {isLocked ? 'Processing...' : 'Ready'}</span>
                    <span>📊 Event: {selectedEvent?.title || 'None selected'}</span>
                </div>
            </footer>

            {/* CSS for animations */}
            <style jsx>{`
        @keyframes flash {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        
        .animate-flash {
          animation: flash 0.3s ease-out forwards;
        }

        .check-in-success-glow {
          text-shadow: 0 0 40px rgba(16, 185, 129, 0.6),
                       0 0 80px rgba(16, 185, 129, 0.4),
                       0 0 120px rgba(16, 185, 129, 0.2);
        }
      `}</style>
        </div>
    );
}
