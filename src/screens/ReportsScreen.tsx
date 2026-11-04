import React, { useState } from 'react';
import { CurrentUser } from '../services/firebaseAuth';
import { lpgStorage } from '../services/lpgStorage';
import { TrendingUp, FileText, Download, Share2, IndianRupee, Warehouse, Truck } from 'lucide-react';
import { DEMO_AGENCY_INFO } from '../data/initialData';
import { EODSummaryModal } from '../components/EODSummaryModal';

interface Props {
  currentUser: CurrentUser | null;
}

export const ReportsScreen: React.FC<Props> = ({ currentUser }) => {
  const [showSummary, setShowSummary] = useState(false);
  const txns = lpgStorage.getTransactions();
  const godown = lpgStorage.getGodownStock();
  const office = lpgStorage.getOfficeStock();
  const staff = lpgStorage.getStaff();

  const totalDelivered = txns.filter((t) => t.txnType === 'STAFF_TO_CUSTOMER').reduce((acc, t) => acc + t.quantity, 0);
  const totalCashCollected = txns.filter((t) => t.paymentMode === 'CASH').reduce((acc, t) => acc + t.paidAmount, 0);
  const totalUpiCollected = txns.filter((t) => t.paymentMode === 'UPI').reduce((acc, t) => acc + t.paidAmount, 0);

  return (
    <div className="flex-1 overflow-y-auto pb-24 p-4 space-y-4 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            <span>Reports & Financial Auditing</span>
          </h1>
          <p className="text-xs text-slate-400">
            End-of-day reconciliation, cash audit, and bottling plant compliance statements.
          </p>
        </div>

        <button
          onClick={() => setShowSummary(true)}
          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>One-Click EOD Summary</span>
        </button>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-1">
          <div className="text-xs text-slate-400">Total Refills Delivered</div>
          <div className="text-2xl font-black text-white font-mono">{totalDelivered}</div>
          <div className="text-[10px] text-slate-500">Across Domestic & Commercial accounts</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-1">
          <div className="text-xs text-slate-400">Cash Collected</div>
          <div className="text-2xl font-black text-emerald-400 font-mono">₹{totalCashCollected.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500">Physically deposited into agency safe</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-1">
          <div className="text-xs text-slate-400">UPI Digital Collections</div>
          <div className="text-2xl font-black text-cyan-400 font-mono">₹{totalUpiCollected.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500">Credited to agency bank account</div>
        </div>
      </div>

      {/* Van Settlements Table */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">Fleet Shift Reconciliation</h2>
        <div className="space-y-2">
          {staff.map((s) => (
            <div key={s.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-white">{s.name} ({s.vehicleNo})</div>
                <div className="text-[10px] text-slate-400">
                  Stock: {s.stock['14.2KG'].full}F / {s.stock['14.2KG'].empty}E
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-emerald-400 font-bold">₹{s.cashInHand.toLocaleString()} Cash</div>
                <div className="text-cyan-400">₹{s.upiInHand.toLocaleString()} UPI</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showSummary && <EODSummaryModal isOpen={true} onClose={() => setShowSummary(false)} />}
    </div>
  );
};
