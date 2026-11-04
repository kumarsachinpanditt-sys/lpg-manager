import React, { useState } from 'react';
import { CurrentUser } from '../services/firebaseAuth';
import { lpgStorage } from '../services/lpgStorage';
import { TransactionType } from '../types/lpg';
import {
  FileText,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  IndianRupee,
  Calendar
} from 'lucide-react';

interface Props {
  currentUser: CurrentUser | null;
}

export const TransactionsScreen: React.FC<Props> = ({ currentUser }) => {
  const transactions = lpgStorage.getTransactions();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = transactions.filter((t) => {
    if (filterType !== 'ALL' && t.txnType !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        (t.customerName && t.customerName.toLowerCase().includes(q)) ||
        (t.staffName && t.staffName.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getTxnBadge = (type: TransactionType) => {
    switch (type) {
      case 'SUPPLIER_INWARD':
        return <span className="px-2 py-0.5 rounded-lg bg-orange-950/80 text-orange-400 border border-orange-800/60 font-bold">Plant Inward</span>;
      case 'GODOWN_TO_STAFF':
        return <span className="px-2 py-0.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold">Van Load</span>;
      case 'GODOWN_TO_OFFICE':
        return <span className="px-2 py-0.5 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-bold">Office Counter</span>;
      case 'OFFICE_TO_GODOWN':
        return <span className="px-2 py-0.5 rounded-lg bg-blue-950/80 text-blue-400 border border-blue-800/60 font-bold">Office Return</span>;
      case 'STAFF_TO_CUSTOMER':
        return <span className="px-2 py-0.5 rounded-lg bg-purple-950/80 text-purple-400 border border-purple-800/60 font-bold">Delivery Memo</span>;
      case 'CUSTOMER_EMPTY_RETURN':
        return <span className="px-2 py-0.5 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/60 font-bold">Empty Return</span>;
      case 'PAYMENT_COLLECTION':
        return <span className="px-2 py-0.5 rounded-lg bg-green-950/80 text-green-400 border border-green-800/60 font-bold">Credit Payment</span>;
      default:
        return <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-bold">{type}</span>;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 p-4 space-y-4 text-slate-100">
      {/* Header */}
      <div>
        <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          <span>Immutable Audit Ledger</span>
        </h1>
        <p className="text-xs text-slate-400">
          Permanent chronological log of all stock transfers, payments, returns, and plant inward receipts.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by transaction ID, staff, customer..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
        >
          <option value="ALL">All Operations</option>
          <option value="SUPPLIER_INWARD">Plant Inward</option>
          <option value="GODOWN_TO_STAFF">Godown → Van</option>
          <option value="GODOWN_TO_OFFICE">Godown → Office</option>
          <option value="OFFICE_TO_GODOWN">Office → Godown</option>
          <option value="STAFF_TO_CUSTOMER">Delivery Memos</option>
          <option value="CUSTOMER_EMPTY_RETURN">Empty Returns</option>
          <option value="PAYMENT_COLLECTION">Payments</option>
        </select>
      </div>

      {/* Transaction List */}
      <div className="space-y-2.5">
        {filtered.map((t) => (
          <div key={t.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getTxnBadge(t.txnType)}
                <span className="font-mono text-slate-400 text-[11px]">{t.id}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {new Date(t.timestamp).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <div>
                {t.customerName && <div>Customer: <span className="font-bold text-white">{t.customerName}</span></div>}
                {t.staffName && <div>Staff: <span className="font-semibold text-slate-200">{t.staffName}</span></div>}
                {t.notes && <div className="text-[11px] text-slate-500 mt-0.5">{t.notes}</div>}
              </div>

              <div className="text-right font-mono">
                {t.quantity > 0 && <div className="text-emerald-400 font-bold">{t.quantity} x {t.cylinderType}</div>}
                {t.emptyReturned > 0 && <div className="text-amber-400">-{t.emptyReturned} Empty</div>}
                {t.totalAmount > 0 && <div className="text-white font-bold">₹{t.totalAmount.toLocaleString()}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
