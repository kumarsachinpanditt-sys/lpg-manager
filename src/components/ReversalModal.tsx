import React, { useState } from 'react';
import { Transaction } from '../types/lpg';
import { CurrentUser, lpgStorage } from '../services/lpgStorage';
import { AlertTriangle, RotateCcw, X, ShieldAlert, ArrowRight } from 'lucide-react';

interface Props {
  transaction: Transaction | null;
  currentUser: CurrentUser;
  onClose: () => void;
  onSuccess: (revTxnId: string) => void;
}

export const ReversalModal: React.FC<Props> = ({
  transaction,
  currentUser,
  onClose,
  onSuccess
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!transaction) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError('Please provide a detailed audit reason (at least 5 characters).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = lpgStorage.reverseTransaction({
      adminUser: currentUser,
      originalTxnId: transaction.id,
      reason: reason.trim()
    });

    setIsSubmitting(false);

    if (result.success && result.revTxnId) {
      onSuccess(result.revTxnId);
      onClose();
    } else {
      setError(result.error || 'Reversal failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 text-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Top Header */}
        <div className="bg-rose-950/70 border-b border-rose-800/60 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="font-semibold text-sm text-rose-200">Admin Reversal</h3>
              <p className="text-[11px] text-rose-300/70">Immutable Ledger Correction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-rose-300 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Warning Banner */}
          <div className="p-3 bg-amber-950/40 border border-amber-700/50 rounded-xl flex items-start gap-2.5 text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-amber-300">
                Regulatory Invariant: Records cannot be deleted.
              </p>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                This operation creates a linked <strong>Audit Reversal Entry</strong> without altering original ledger logs, and restores cylinder inventory and financial balances.
              </p>
            </div>
          </div>

          {/* Original Transaction Summary */}
          <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl space-y-2">
            <div className="text-[11px] text-slate-400 font-medium">Original Transaction Details</div>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div>
                <span className="text-slate-500 block">Transaction ID:</span>
                <span className="font-mono font-bold text-orange-400">{transaction.id}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Type:</span>
                <span className="font-medium text-white">{transaction.txnType}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Cylinders:</span>
                <span className="text-white font-semibold">
                  {transaction.quantity} × {transaction.cylinderType}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Amount:</span>
                <span className="text-emerald-400 font-semibold">₹{transaction.totalAmount}</span>
              </div>
              {transaction.customerName && (
                <div className="col-span-2">
                  <span className="text-slate-500 block">Customer:</span>
                  <span className="text-slate-200">{transaction.customerName} ({transaction.consumerNo})</span>
                </div>
              )}
            </div>
          </div>

          {/* Stock Restoration Impact Preview */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5 text-slate-300">
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Restoration Impact:</span>
            </div>
            <div className="text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ArrowRight className="w-3 h-3" />
                <span>Full cylinders {transaction.cylinderType} restored (+{transaction.quantity})</span>
              </div>
              {transaction.emptyReturned > 0 && (
                <div className="flex items-center gap-1.5 text-amber-400">
                  <ArrowRight className="w-3 h-3" />
                  <span>Collected empties reverted (-{transaction.emptyReturned})</span>
                </div>
              )}
              {transaction.paidAmount > 0 && (
                <div className="flex items-center gap-1.5 text-rose-400">
                  <ArrowRight className="w-3 h-3" />
                  <span>Collected payment balance reversed (-₹{transaction.paidAmount})</span>
                </div>
              )}
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-slate-300">
              Audit Reason (Required) <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Incorrect consumer selected, order cancelled post-dispatch..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 text-xs"
              required
            />
          </div>

          {error && (
            <div className="p-2.5 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-[11px]">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-medium text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Confirm Reversal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
