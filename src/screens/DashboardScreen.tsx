import React from 'react';
import { CurrentUser } from '../services/firebaseAuth';
import { lpgStorage } from '../services/lpgStorage';
import {
  Package,
  Truck,
  Users,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Warehouse,
  IndianRupee,
  ShieldCheck,
  Building2
} from 'lucide-react';

interface Props {
  currentUser: CurrentUser | null;
  onNavigate: (tab: string) => void;
}

export const DashboardScreen: React.FC<Props> = ({ currentUser, onNavigate }) => {
  const godown = lpgStorage.getGodownStock();
  const office = lpgStorage.getOfficeStock();
  const staff = lpgStorage.getStaff();
  const customers = lpgStorage.getCustomers();
  const defectives = lpgStorage.getDefectives();
  const txns = lpgStorage.getTransactions();

  const totalFilledGodown = godown['14.2KG'].full + godown['19KG'].full + godown['5KG'].full;
  const totalEmptyGodown = godown['14.2KG'].empty + godown['19KG'].empty + godown['5KG'].empty;
  const totalOfficeFilled = office['14.2KG'].full + office['19KG'].full + office['5KG'].full;
  const totalVanFilled = staff.reduce((acc, s) => acc + s.stock['14.2KG'].full + s.stock['19KG'].full + s.stock['5KG'].full, 0);

  const totalOutstandingDues = customers.reduce((acc, c) => acc + (c.paymentDue || 0), 0);
  const totalCommercialEmptyDues = customers
    .filter((c) => c.type === 'COMMERCIAL')
    .reduce((acc, c) => acc + (c.cylinderDues['19KG'] || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto pb-24 p-4 space-y-4 text-slate-100">
      {/* Welcome Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-orange-600/30 via-slate-900 to-slate-900 border border-orange-500/30 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Gas Agency Management Console</span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-white">
            {currentUser ? `Welcome, ${currentUser.name}` : 'Agency Operations Overview'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-godown stock, office counter inventory, delivery fleet, and commercial dues tracking.
          </p>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Godown Stock */}
        <div
          onClick={() => onNavigate('godown')}
          className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl cursor-pointer hover:border-orange-500/40 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Godown Full</span>
            <Warehouse className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-xl font-black text-white font-mono">{totalFilledGodown}</div>
          <div className="text-[10px] text-slate-500 mt-1">Empties: {totalEmptyGodown}</div>
        </div>

        {/* Office Counter */}
        <div
          onClick={() => onNavigate('godown')}
          className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl cursor-pointer hover:border-cyan-500/40 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Office Counter</span>
            <Building2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-black text-white font-mono">{totalOfficeFilled}</div>
          <div className="text-[10px] text-slate-500 mt-1">Cash: ₹{office.cashInHand.toLocaleString()}</div>
        </div>

        {/* Vans in Transit */}
        <div
          onClick={() => onNavigate('delivery')}
          className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl cursor-pointer hover:border-emerald-500/40 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Van Transit</span>
            <Truck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-white font-mono">{totalVanFilled}</div>
          <div className="text-[10px] text-slate-500 mt-1">{staff.length} Active Vans</div>
        </div>

        {/* Commercial Dues */}
        <div
          onClick={() => onNavigate('customers')}
          className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl cursor-pointer hover:border-amber-500/40 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Pending Dues</span>
            <IndianRupee className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-400 font-mono">₹{totalOutstandingDues.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-1">19KG Empty Owed: {totalCommercialEmptyDues}</div>
        </div>
      </div>

      {/* Quick Access Action Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => onNavigate('godown')}
          className="p-3 bg-slate-900 border border-slate-800/80 hover:bg-slate-800 rounded-2xl text-xs font-bold text-left flex items-center justify-between transition-colors"
        >
          <span className="flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-orange-400" />
            <span>Godown Inward</span>
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
        </button>

        <button
          onClick={() => onNavigate('delivery')}
          className="p-3 bg-slate-900 border border-slate-800/80 hover:bg-slate-800 rounded-2xl text-xs font-bold text-left flex items-center justify-between transition-colors"
        >
          <span className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-400" />
            <span>Van Delivery</span>
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
        </button>

        <button
          onClick={() => onNavigate('customers')}
          className="p-3 bg-slate-900 border border-slate-800/80 hover:bg-slate-800 rounded-2xl text-xs font-bold text-left flex items-center justify-between transition-colors"
        >
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Commercial Ledger</span>
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
        </button>

        <button
          onClick={() => onNavigate('transactions')}
          className="p-3 bg-slate-900 border border-slate-800/80 hover:bg-slate-800 rounded-2xl text-xs font-bold text-left flex items-center justify-between transition-colors"
        >
          <span className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span>Audit Ledger</span>
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>

      {/* Category Inventory Breakdown */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Cylinder Category Stock</h2>
          <span className="text-[10px] text-slate-500 font-mono">Real-time Godown Counts</span>
        </div>

        <div className="space-y-2">
          {/* 14.2 KG */}
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">14.2 KG Domestic Refill</div>
              <div className="text-[10px] text-slate-400">Subsidized & Non-Subsidized Household</div>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <span className="text-sm font-bold text-emerald-400 font-mono">{godown['14.2KG'].full}</span>
                <span className="text-[10px] text-slate-500 block">Full</span>
              </div>
              <div>
                <span className="text-sm font-bold text-amber-400 font-mono">{godown['14.2KG'].empty}</span>
                <span className="text-[10px] text-slate-500 block">Empty</span>
              </div>
              <div>
                <span className="text-sm font-bold text-rose-400 font-mono">{godown['14.2KG'].defective}</span>
                <span className="text-[10px] text-slate-500 block">Defective</span>
              </div>
            </div>
          </div>

          {/* 19 KG */}
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">19 KG Commercial Cylinder</div>
              <div className="text-[10px] text-slate-400">Hotels, Restaurants, & Caterers</div>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <span className="text-sm font-bold text-emerald-400 font-mono">{godown['19KG'].full}</span>
                <span className="text-[10px] text-slate-500 block">Full</span>
              </div>
              <div>
                <span className="text-sm font-bold text-amber-400 font-mono">{godown['19KG'].empty}</span>
                <span className="text-[10px] text-slate-500 block">Empty</span>
              </div>
              <div>
                <span className="text-sm font-bold text-rose-400 font-mono">{godown['19KG'].defective}</span>
                <span className="text-[10px] text-slate-500 block">Defective</span>
              </div>
            </div>
          </div>

          {/* 5 KG */}
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">5 KG Compact / Chhotu</div>
              <div className="text-[10px] text-slate-400">Portable & FTL Free Trade LPG</div>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <span className="text-sm font-bold text-emerald-400 font-mono">{godown['5KG'].full}</span>
                <span className="text-[10px] text-slate-500 block">Full</span>
              </div>
              <div>
                <span className="text-sm font-bold text-amber-400 font-mono">{godown['5KG'].empty}</span>
                <span className="text-[10px] text-slate-500 block">Empty</span>
              </div>
              <div>
                <span className="text-sm font-bold text-rose-400 font-mono">{godown['5KG'].defective}</span>
                <span className="text-[10px] text-slate-500 block">Defective</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
