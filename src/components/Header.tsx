import React, { useState, useEffect } from 'react';
import { CurrentUser, firebaseAuth, AuthSession } from '../services/firebaseAuth';
import { lpgStorage } from '../services/lpgStorage';
import {
  Flame,
  Shield,
  Truck,
  LogIn,
  LogOut,
  RefreshCw,
  Smartphone,
  Monitor,
  Code2,
  AlertTriangle
} from 'lucide-react';
import { DEMO_AGENCY_INFO } from '../data/initialData';
import { LoginModal } from './LoginModal';

interface Props {
  currentUser: CurrentUser | null;
  authSession: AuthSession;
  isPhoneView: boolean;
  onToggleView: () => void;
  onOpenAndroidCode: () => void;
}

export const Header: React.FC<Props> = ({
  currentUser,
  authSession,
  isPhoneView,
  onToggleView,
  onOpenAndroidCode
}) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const updateQueue = () => {
      setOfflineCount(lpgStorage.getOfflineQueue().length);
    };
    updateQueue();
    const unsub = lpgStorage.subscribe(updateQueue);
    return unsub;
  }, []);

  const handleSyncOffline = async () => {
    setIsSyncing(true);
    await lpgStorage.syncOfflineQueue();
    setIsSyncing(false);
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <>
      <header className="bg-slate-900/95 border-b border-slate-800 px-3 sm:px-4 py-2.5 flex items-center justify-between shrink-0 backdrop-blur-md z-20">
        {/* Brand & Agency Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
            <Flame className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-sm tracking-tight">
                LPG Manager
              </span>
              <span className="flex items-center gap-1 text-[10px] bg-emerald-950/80 text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-800/60 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>CLOUD</span>
              </span>
            </div>
            <div className="text-[10px] text-slate-400 hidden sm:block truncate max-w-[200px]">
              {DEMO_AGENCY_INFO.agencyName}
            </div>
          </div>
        </div>

        {/* Center / Offline Queue Badge */}
        {offlineCount > 0 && (
          <button
            onClick={handleSyncOffline}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-2 py-1 bg-amber-950/60 border border-amber-800/60 text-amber-300 rounded-lg text-xs font-semibold animate-pulse"
            title="Pending transactions logged offline. Click to synchronize with Firestore."
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{offlineCount} Offline Pending</span>
          </button>
        )}

        {/* Right Controls: User Profile / Auth Gate, View Mode, Android Code */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowLoginModal(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                  isAdmin
                    ? 'bg-orange-950/40 border-orange-800/60 text-orange-300 hover:bg-orange-900/40'
                    : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/40'
                }`}
                title="Account Session"
              >
                {isAdmin ? (
                  <Shield className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                ) : (
                  <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
                <span className="truncate max-w-[120px] sm:max-w-[140px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] uppercase font-bold px-1 py-0.2 rounded bg-slate-950/80 border border-slate-800">
                  {currentUser.role}
                </span>
              </button>

              <button
                onClick={() => firebaseAuth.signOut()}
                className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-xl transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/20 transition-all active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}

          {/* View Mode Switcher */}
          <button
            onClick={onToggleView}
            title={isPhoneView ? 'Switch to Fullscreen Counter' : 'Switch to Android View'}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors hidden sm:flex items-center gap-1"
          >
            {isPhoneView ? (
              <Monitor className="w-4 h-4 text-cyan-400" />
            ) : (
              <Smartphone className="w-4 h-4 text-orange-400" />
            )}
          </button>

          {/* Android Code */}
          <button
            onClick={onOpenAndroidCode}
            title="View Native Android Kotlin Source"
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 rounded-xl text-xs font-semibold transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Android Code</span>
          </button>
        </div>
      </header>

      {/* Login & Verification Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        currentUser={currentUser}
        authSession={authSession}
      />
    </>
  );
};
