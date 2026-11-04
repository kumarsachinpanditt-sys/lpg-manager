import React, { useState } from 'react';
import { Customer } from '../types/lpg';
import { CurrentUser, lpgStorage } from '../services/lpgStorage';
import {
  Building2,
  IndianRupee,
  RotateCcw,
  CheckCircle2,
  X,
  CreditCard,
  FileCheck
} from 'lucide-react';

interface Props {
  customer: Customer;
  currentUser: CurrentUser;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const CommercialSettlementModal: React.FC<Props> = ({
  customer,
  currentUser,
  onClose,
  onSuccess
}) => {
  const current19Due = customer.cylinderDues['19KG'] || 0;
  const currentCredit = customer.paymentDue || 0;

  const [returned19Empties, setReturned19Empties] = useState<number>(current19Due);
  const [paymentAmount, setPaymentAmount] = useState<number>(currentCredit);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI'>('CASH');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = lpgStorage.settleCommercialAccount({
      currentUser,
      customerId: customer.id,
      returned19Empties: Number(returned19Empties),
      paymentAmount: Number(paymentAmount),
      paymentMode,
      staffId: currentUser.role === 'STAFF' ? currentUser.staffId : undefined,
      notes: notes.trim()
    });

    if (res.success) {
      onSuccess(
        `Commercial account settled for ${customer.firmName || customer.name}. Received ${returned19Empties}x 19KG empties & ₹${paymentAmount}.`
      );
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to process settlement.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Settle 19 KG Commercial Account
              </h2>
              <p className="text-xs text-slate-400">
                Bulk empty cylinder recovery & credit balance settlement
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Commercial Header Info */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-white text-sm">
              {customer.firmName || customer.name}
            </span>
            <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 rounded font-mono text-[10px] border border-cyan-800 font-bold">
              {customer.consumerNo}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px]">
            <div>
              <span className="block text-slate-400">Contact Person:</span>
              <span className="text-white font-medium">{customer.name} ({customer.mobile})</span>
            </div>
            <div>
              <span className="block text-slate-400">GSTIN:</span>
              <span className="text-white font-mono font-medium">{customer.gstin || 'UNREGISTERED'}</span>
            </div>
          </div>

          {/* Dues Cards */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 text-[10px] block font-medium">19 KG Empties Due</span>
              <span className="text-lg font-extrabold text-amber-400">
                {current19Due} Cylinders
              </span>
            </div>

            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 text-[10px] block font-medium">Credit Balance Due</span>
              <span className="text-lg font-extrabold text-rose-400">
                ₹{currentCredit.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-medium">
              19 KG Empty Cylinders Collected
            </label>
            <input
              type="number"
              min="0"
              max={current19Due}
              value={returned19Empties}
              onChange={(e) => setReturned19Empties(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold text-xs"
              required
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Remaining Empties Due After Settlement: {Math.max(0, current19Due - returned19Empties)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-medium">
                Payment Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                max={currentCredit}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold text-xs"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Remaining Credit Due: ₹{Math.max(0, currentCredit - paymentAmount).toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-medium">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as 'CASH' | 'UPI')}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold"
              >
                <option value="CASH">Cash Counter</option>
                <option value="UPI">UPI / Digital / NEFT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-medium">
              Settlement Notes / Reference
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Weekly payment settled by manager Gurpreet..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold shadow transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Settlement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
