'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Building2,
  Check,
  AlertTriangle,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  HardHat,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface InvitationData {
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  entitlements: {
    modules: Record<string, boolean>;
    limits: { storageGB: number; maxUsers: number; maxProjects: number };
  };
  expiresAt: string;
}

const MODULE_LABELS: Record<string, string> = {
  projects: 'Projects',
  tasks: 'Tasks',
  documents: 'Documents',
  rfis: 'RFIs',
  submittals: 'Submittals',
  changeOrders: 'Change Orders',
  dailyReports: 'Daily Reports',
  safety: 'Safety Management',
  reports: 'Reports & Analytics',
  team: 'Team Management',
};

export default function AcceptInvitationClient({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await fetch(`/api/invitations/validate?token=${token}`);
        const data = await res.json();
        
        if (data.valid && data.invitation) {
          setInvitation(data.invitation);
        } else {
          setError(data.error || 'Invalid invitation');
        }
      } catch (e) {
        setError('Failed to validate invitation');
      } finally {
        setLoading(false);
      }
    };
    
    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.error || 'Failed to accept invitation');
      }
    } catch (e) {
      setError('Failed to accept invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const passwordStrength = () => {
    if (password.length < 8) return { text: 'Too short', color: 'text-red-500' };
    if (password.length < 12) return { text: 'Fair', color: 'text-yellow-500' };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
      return { text: 'Strong', color: 'text-green-500' };
    }
    return { text: 'Good', color: 'text-blue-500' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Validating your invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/login">
              <Button className="bg-purple-600 hover:bg-purple-700">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full"
        >
          <Card>
            <CardContent className="pt-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="h-10 w-10 text-green-600" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to CortexBuild Pro!
              </h2>
              <p className="text-gray-600 mb-2">
                Your company <strong>{invitation?.companyName}</strong> has been created.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Redirecting you to login in a few seconds...
              </p>
              <Link href="/login">
                <Button className="bg-purple-600 hover:bg-purple-700">Login Now</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <HardHat className="h-10 w-10 text-purple-600" />
            <span className="text-2xl font-bold text-gray-900">CortexBuild Pro</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Accept Your Invitation</h1>
          <p className="text-gray-600">
            Complete your registration to get started
          </p>
        </div>

        <div className="grid gap-6">
          {/* Company Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  Your Company
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {invitation?.companyName}
                    </h3>
                    <p className="text-gray-600">
                      {invitation?.ownerName} • {invitation?.ownerEmail}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <Badge variant="outline">
                        {invitation?.entitlements?.limits?.storageGB || 10} GB Storage
                      </Badge>
                      <Badge variant="outline">
                        Up to {invitation?.entitlements?.limits?.maxUsers || 50} Users
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enabled Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Enabled Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(invitation?.entitlements?.modules || {})
                    .filter(([_, enabled]) => enabled)
                    .map(([key]) => (
                      <Badge key={key} className="bg-purple-100 text-purple-800">
                        <Check className="h-3 w-3 mr-1" />
                        {MODULE_LABELS[key] || key}
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Password Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-purple-600" />
                  Create Your Password
                </CardTitle>
                <CardDescription>
                  Set a secure password for your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-4 w-4" />
                      {error}
                    </div>
                  )}
                  
                  <div>
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter a secure password"
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {password && (
                      <p className={`text-xs mt-1 ${passwordStrength().color}`}>
                        Password strength: {passwordStrength().text}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Confirm Password</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs mt-1 text-red-500">Passwords do not match</p>
                    )}
                    {confirmPassword && password === confirmPassword && password.length >= 8 && (
                      <p className="text-xs mt-1 text-green-500 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Passwords match
                      </p>
                    )}
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={submitting || password.length < 8 || password !== confirmPassword}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Complete Registration
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          Already have an account?{' '}
          <Link href="/login" className="text-purple-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
