'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Input from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/i18n/index';

export default function LoginPage() {
  const { signInWithEmail, signUpWithEmail, resetPassword, loading, user } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  // Redirect if already authenticated
  React.useEffect(() => {
    console.log('Login page: user =', user, 'loading =', loading);
    if (user && !loading) {
      console.log('Login page: Redirecting to /events');
      router.push('/events');
    }
  }, [user, loading, router]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError(null);
      setIsSigningIn(true);
      await signInWithEmail(email, password);
      // Redirect will happen via useEffect when user state updates
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setError(null);
      setIsSigningIn(true);
      await signUpWithEmail(email, password, displayName);
      // Redirect will happen via useEffect when user state updates
    } catch (error: any) {
      console.error('Sign up error:', error);
      setError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setError('Please enter your email address');
      return;
    }

    try {
      setError(null);
      await resetPassword(resetEmail);
      setResetMessage('Password reset email sent! Check your inbox.');
      setResetEmail('');
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to send password reset email.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <span className="loading loading-infinity loading-xl"></span>
          <span>{t('login.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    //login page UI
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 bg-[url('/BG.PNG')] bg-cover bg-center bg-fixed">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('login.title')}
          </h1>
          <p className="text-gray-600">
            {t('login.subtitle')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{showResetPassword ? 'Reset Password' : (isSignUp ? 'Create Account' : 'Sign In')}</CardTitle>
            <CardDescription>
              {showResetPassword ? 'Enter your email to reset your password' : (isSignUp ? 'Create a new account to get started' : 'Sign in to your account')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {resetMessage && (
              <Alert>
                <AlertDescription>{resetMessage}</AlertDescription>
              </Alert>
            )}

            {showResetPassword ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail">Email</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isSigningIn}>
                  Send Reset Email
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => {
                    setShowResetPassword(false);
                    setError(null);
                    setResetMessage('');
                  }}
                >
                  Back to Sign In
                </Button>
              </form>
            ) : (
              <form onSubmit={isSignUp ? handleEmailSignUp : handleEmailSignIn} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Full Name</Label>
                    <Input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  {isSignUp && (
                    <p className="text-sm text-gray-500">Password must be at least 6 characters long</p>
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={isSigningIn}>
                  {isSigningIn ? (
                    <span className="loading loading-infinity loading-xl"></span>
                  ) : (
                    isSignUp ? 'Create Account' : 'Sign In'
                  )}
                </Button>
                
                <div className="text-center space-y-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="text-sm"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setError(null);
                      setEmail('');
                      setPassword('');
                      setDisplayName('');
                    }}
                  >
                    {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                  </Button>
                  
                  {!isSignUp && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="text-sm"
                      onClick={() => {
                        setShowResetPassword(true);
                        setError(null);
                      }}
                    >
                      Forgot your password?
                    </Button>
                  )}
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>{t('login.help')}</p>
        </div>
      </div>
    </div>
  );
}