import React, { useState, useEffect } from 'react';
import { CurrentUser, firebaseAuth, AuthSession } from './services/firebaseAuth';
import { lpgStorage } from './services/lpgStorage';
import { testConnection } from './services/firebase';
import { Header } from './components/Header';
import { AndroidFrame } from './components/AndroidFrame';
import { AndroidCodeModal } from './components/AndroidCodeModal';
import { DashboardScreen } from './screens/DashboardScreen';
import { GodownScreen } from './screens/GodownScreen';
import { StaffDeliveryScreen } from './screens/StaffDeliveryScreen';
import { CustomerScreen } from './screens/CustomerScreen';
import { TransactionsScreen } from './screens/TransactionsScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { PricingSettingsScreen } from './screens/PricingSettingsScreen';
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  FileText,
  TrendingUp,
  Settings
} from 'lucide-react';

export default function App() {
  const [authSession, setAuthSession] = useState<AuthSession>(firebaseAuth.getSession());
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(authSession.currentUser);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isPhoneView, setIsPhoneView] = useState<boolean>(true);
  const [showAndroidCode, setShowAndroidCode] = useState<boolean>(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    testConnection();
    const unsubAuth = firebaseAuth.subscribe((session) => {
      setAuthSession(session);
      setCurrentUser(session.currentUser);
    });
    const unsubStorage = lpgStorage.subscribe(() => {
      setTick((t) => t + 1);
    });
    return () => {
      unsubAuth();
      unsubStorage();
    };
  }, []);

  const isAdmin = currentUser?.role === 'ADMIN';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'godown', label: 'Godown', icon: Package },
    { id: 'delivery', label: 'Delivery', icon: Truck },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'transactions', label: 'Ledger', icon: FileText },
    ...(isAdmin
      ? [
          { id: 'reports', label: 'Reports', icon: TrendingUp },
          { id: 'pricing', label: 'Pricing', icon: Settings }
        ]
      : [])
  ];

  return (
    <AndroidFrame
      isPhoneView={isPhoneView}
      onToggleView={() => setIsPhoneView(!isPhoneView)}
    >
      <Header
        currentUser={currentUser}
        authSession={authSession}
        isPhoneView={isPhoneView}
        onToggleView={() => setIsPhoneView(!isPhoneView)}
        onOpenAndroidCode={() => setShowAndroidCode(true)}
      />

      {/* Cloud Authentication Status Strip */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-3 py-1 flex items-center justify-between text-[11px] backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-1.5 truncate">
          <span className={`w-2 h-2 rounded-full ${authSession.firebaseUser ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-slate-300 font-medium truncate">
            {authSession.firebaseUser
              ? `Cloud Verified: ${authSession.firebaseUser.email || authSession.firebaseUser.displayName || 'Staff'}`
              : 'Public Catalog Read (Sign In with Google for Live Writes)'}
          </span>
        </div>
        {!authSession.firebaseUser && (
          <button
            onClick={() => firebaseAuth.signInWithGoogle()}
            className="text-[10px] bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold px-2 py-0.5 rounded-lg transition-all ml-2 shrink-0 shadow-sm shadow-orange-500/20"
          >
            Google Admin Sign In
          </button>
        )}
      </div>

      {/* Main Viewport Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-950">
        {activeTab === 'dashboard' && (
          <DashboardScreen
            currentUser={currentUser}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'godown' && <GodownScreen currentUser={currentUser} />}
        {activeTab === 'delivery' && <StaffDeliveryScreen currentUser={currentUser} />}
        {activeTab === 'customers' && <CustomerScreen currentUser={currentUser} />}
        {activeTab === 'transactions' && <TransactionsScreen currentUser={currentUser} />}
        {activeTab === 'reports' && <ReportsScreen currentUser={currentUser} />}
        {activeTab === 'pricing' && (
          <PricingSettingsScreen
            currentUser={currentUser}
            onOpenAndroidCode={() => setShowAndroidCode(true)}
          />
        )}

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 right-0 h-16 bg-slate-900/95 border-t border-slate-800/80 px-2 flex items-center justify-around backdrop-blur-lg z-20">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                  isActive ? 'text-orange-400 font-bold' : 'text-slate-400 hover:text-slate-200 font-medium'
                }`}
              >
                <div
                  className={`px-3 py-1 rounded-full transition-all flex items-center justify-center ${
                    isActive ? 'bg-orange-500/20 text-orange-400' : 'bg-transparent text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[58px]">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </main>

      {/* Android Kotlin & Compose Source Code Modal */}
      <AndroidCodeModal
        isOpen={showAndroidCode}
        onClose={() => setShowAndroidCode(false)}
      />
    </AndroidFrame>
  );
}
