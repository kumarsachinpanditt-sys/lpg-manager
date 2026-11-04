import React, { useState } from 'react';
import { firebaseAuth, CurrentUser, AuthSession } from '../services/firebaseAuth';
import {
  Shield,
  Truck,
  LogIn,
  KeyRound,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  Flame,
  LogOut,
  Lock
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser | null;
  authSession: AuthSession;
}

export const LoginModal: React.FC<Props> = ({ isOpen, onClose, currentUser, authSession }) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'staff'>('admin');
  const [staffPhone, setStaffPhone] = useState('+91 98111 22334');
  const [staffPin, setStaffPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setFeedback(null);
    const res = await firebaseAuth.signInWithGoogle();
    setIsLoading(false);
    if (res.success) {
      setFeedback({ text: 'Authenticated successfully with Google Account!', type: 'success' });
      setTimeout(onClose, 800);
    } else {
      setFeedback({ text: res.error || 'Failed to authenticate via Google.', type: 'error' });
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    const res = await firebaseAuth.loginStaffWithPin(staffPhone, staffPin);
    setIsLoading(false);

    if (res.success && res.user) {
      setFeedback({ text: `Staff login verified: ${res.user.name} (${res.user.vehicleNo})`, type: 'success' });
      setStaffPin('');
      setTimeout(onClose, 800);
    } else {
      setFeedback({ text: res.error || 'Invalid phone number or 4-digit PIN.', type: 'error' });
    }
  };

  const handleSignOut = async () => {
    await firebaseAuth.signOut();
    setFeedback({ text: 'Signed out of session.', type: 'success' });
    setTimeout(onClose, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Flame className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Agency Authentication</h2>
              <p className="text-xs text-slate-400">Firebase Verified Access Gate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Session Card (if signed in) */}
        {currentUser && (
          <div className="p-4 mx-4 mt-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${currentUser.role === 'ADMIN' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {currentUser.role === 'ADMIN' ? <Shield className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400">{currentUser.phone || authSession.firebaseUser?.email}</div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="px-2.5 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors border border-rose-900/50"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Tab Selection */}
        <div className="grid grid-cols-2 p-2 bg-slate-950/40 border-b border-slate-800/80 gap-1 text-xs">
          <button
            onClick={() => setActiveTab('admin')}
            className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'admin'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Admin (Google Auth)</span>
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'staff'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Staff (Phone & PIN)</span>
          </button>
        </div>

        {/* Notification / Feedback */}
        {feedback && (
          <div
            className={`mx-5 mt-4 p-3 rounded-2xl text-xs flex items-center gap-2 font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'admin' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-orange-950/20 border border-orange-800/40 space-y-2">
                <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider">
                  <Shield className="w-4 h-4" />
                  <span>Verified Agency Administrator</span>
                </div>
                <p className="text-xs text-white font-mono bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                  Kumarsachinpandit@gmail.com
                </p>
                <p className="text-[11px] text-slate-400">
                  Full administrative permissions: Plant inward receiving, pricing management, godown facilities, staff creation, and EOD settlement signoff.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-white/5 active:scale-[0.98] disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isLoading ? 'Connecting Google Account...' : 'Sign in with Google Account'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <form onSubmit={handleStaffLogin} className="space-y-3.5">
              <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-300">
                Enter your registered mobile number and 4-digit PIN configured by the agency administrator.
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Staff Mobile Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="+91 98111 22334"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">4-Digit Security PIN</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    maxLength={6}
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono tracking-widest"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 mt-4 active:scale-[0.98] disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isLoading ? 'Verifying PIN...' : 'Verify PIN & Start Shift'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
