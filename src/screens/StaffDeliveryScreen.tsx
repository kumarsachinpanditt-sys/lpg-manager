import React, { useState } from 'react';
import { CurrentUser } from '../services/firebaseAuth';
import { lpgStorage } from '../services/lpgStorage';
import { CylinderType, Customer, PaymentMode } from '../types/lpg';
import {
  Truck,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  IndianRupee,
  Phone,
  MapPin,
  Calendar,
  Share2,
  FileText
} from 'lucide-react';

interface Props {
  currentUser: CurrentUser | null;
}

export const StaffDeliveryScreen: React.FC<Props> = ({ currentUser }) => {
  const staffList = lpgStorage.getStaff();
  const customers = lpgStorage.getCustomers();
  const pricing = lpgStorage.getPricing();

  // Active staff member (either logged in staff or first active van)
  const activeStaff =
    currentUser?.role === 'STAFF'
      ? staffList.find((s) => s.id === currentUser.id) || staffList[0]
      : staffList[0];

  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [cylinderType, setCylinderType] = useState<CylinderType>('14.2KG');
  const [quantity, setQuantity] = useState(1);
  const [emptyReturned, setEmptyReturned] = useState(1);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CREDIT'>('CASH');
  const [paidAmount, setPaidAmount] = useState(803);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error'; receipt?: string } | null>(null);

  // Standalone empty return modal state
  const [showEmptyReturnModal, setShowEmptyReturnModal] = useState(false);
  const [returnCustId, setReturnCustId] = useState(customers[0]?.id || '');
  const [returnType, setReturnType] = useState<CylinderType>('14.2KG');
  const [returnCount, setReturnCount] = useState(1);

  // Update paid amount when cylinder type or quantity changes
  React.useEffect(() => {
    const p = pricing.find((item) => item.cylinderType === cylinderType);
    const unit = p ? p.refillPrice : 803;
    setPaidAmount(unit * quantity);
  }, [cylinderType, quantity, pricing]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStaff) {
      setFeedback({ text: 'No active delivery vehicle selected.', type: 'error' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    const p = pricing.find((item) => item.cylinderType === cylinderType);
    const unitPrice = p ? p.refillPrice : 803;

    const res = await lpgStorage.recordCustomerDelivery({
      staffId: activeStaff.id,
      staffName: activeStaff.name,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      consumerNo: selectedCustomer.consumerNo,
      cylinderType,
      quantity: Number(quantity),
      emptyReturned: Number(emptyReturned),
      unitPrice,
      paymentMode,
      paidAmount: Number(paidAmount)
    });

    setLoading(false);

    if (res.success) {
      const receipt = `
DELIVERY CASH MEMO
Customer: ${selectedCustomer.name} (${selectedCustomer.consumerNo})
Delivered: ${quantity} x ${cylinderType}
Empties Returned: ${emptyReturned}
Amount: ₹${paidAmount} (${paymentMode})
Staff: ${activeStaff.name} (${activeStaff.vehicleNo})
Ref: ${res.txnId} ${res.isOffline ? '[Offline Queued]' : '[Cloud Synced]'}
      `.trim();

      setFeedback({
        text: `Delivery recorded successfully! ${res.isOffline ? '(Saved offline, pending cloud sync)' : ''}`,
        type: 'success',
        receipt
      });
    } else {
      setFeedback({ text: res.error || 'Failed to record delivery.', type: 'error' });
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStaff) return;

    setLoading(true);
    const cust = customers.find((c) => c.id === returnCustId) || customers[0];
    const res = await lpgStorage.recordCustomerEmptyReturn({
      staffId: activeStaff.id,
      staffName: activeStaff.name,
      customerId: cust.id,
      customerName: cust.name,
      cylinderType: returnType,
      emptyCount: Number(returnCount)
    });
    setLoading(false);

    if (res.success) {
      setFeedback({ text: `Returned ${returnCount} empty cylinders from ${cust.name}!`, type: 'success' });
      setShowEmptyReturnModal(false);
    } else {
      setFeedback({ text: res.error || 'Empty return failed.', type: 'error' });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 p-4 space-y-4 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            <span>Delivery Fleet & Customer Dispatch</span>
          </h1>
          <p className="text-xs text-slate-400">
            Field refill distribution, empty cylinder recovery, and digital memo generation.
          </p>
        </div>

        <button
          onClick={() => setShowEmptyReturnModal(true)}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Empty Return</span>
        </button>
      </div>

      {/* Notifications & Digital Receipt */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex flex-col gap-2 font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
              : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{feedback.text}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>

          {feedback.receipt && (
            <div className="mt-2 p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 whitespace-pre-wrap flex justify-between items-end">
              <div>{feedback.receipt}</div>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: 'LPG Delivery Receipt', text: feedback.receipt }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(feedback.receipt!);
                    alert('Receipt copied!');
                  }
                }}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1"
              >
                <Share2 className="w-3 h-3" />
                <span>Share</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Vehicle Status */}
      {activeStaff && (
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">{activeStaff.name} ({activeStaff.vehicleNo})</div>
                <div className="text-[10px] text-slate-400">{activeStaff.vehicleType}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-emerald-400 font-mono">₹{activeStaff.cashInHand.toLocaleString()} Cash</div>
              <div className="text-[10px] text-cyan-400 font-mono">₹{activeStaff.upiInHand.toLocaleString()} UPI</div>
            </div>
          </div>

          {/* Vehicle Onboard Stock Chips */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-xs text-center font-mono">
            <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-emerald-400 font-bold">{activeStaff.stock['14.2KG'].full}</span> / <span className="text-amber-400">{activeStaff.stock['14.2KG'].empty}</span>
              <span className="text-[10px] text-slate-500 block">14.2KG (F/E)</span>
            </div>
            <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-emerald-400 font-bold">{activeStaff.stock['19KG'].full}</span> / <span className="text-amber-400">{activeStaff.stock['19KG'].empty}</span>
              <span className="text-[10px] text-slate-500 block">19KG (F/E)</span>
            </div>
            <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-emerald-400 font-bold">{activeStaff.stock['5KG'].full}</span> / <span className="text-amber-400">{activeStaff.stock['5KG'].empty}</span>
              <span className="text-[10px] text-slate-500 block">5KG (F/E)</span>
            </div>
          </div>
        </div>
      )}

      {/* Customer Delivery Form */}
      <form onSubmit={handleDeliverySubmit} className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">Record Delivery Memo</h2>

        <div>
          <label className="text-xs text-slate-400 font-semibold mb-1 block">Select Customer</label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.consumerNo}) - {c.type} {c.paymentDue > 0 ? `[Due ₹${c.paymentDue}]` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-400 font-semibold mb-1 block">Cylinder Category</label>
            <select
              value={cylinderType}
              onChange={(e) => setCylinderType(e.target.value as CylinderType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
            >
              <option value="14.2KG">14.2 KG Domestic</option>
              <option value="19KG">19 KG Commercial</option>
              <option value="5KG">5 KG Compact</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-semibold mb-1 block">Quantity Delivered</label>
            <input
              type="number"
              min="1"
              max="20"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-400 font-semibold mb-1 block">Empties Collected</label>
            <input
              type="number"
              min="0"
              max="20"
              value={emptyReturned}
              onChange={(e) => setEmptyReturned(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-semibold mb-1 block">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as 'CASH' | 'UPI' | 'CREDIT')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
            >
              <option value="CASH">Cash on Delivery</option>
              <option value="UPI">UPI / QR Code</option>
              <option value="CREDIT">Credit (Add to Ledger)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 font-semibold mb-1 block">Amount Collected (₹)</label>
          <input
            type="number"
            value={paidAmount}
            onChange={(e) => setPaidAmount(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono font-bold"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 mt-2 active:scale-[0.98] disabled:opacity-50"
        >
          <span>{loading ? 'Processing Delivery...' : 'Confirm Delivery & Generate Memo'}</span>
        </button>
      </form>

      {/* Standalone Empty Return Modal */}
      {showEmptyReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Record Standalone Empty Return</h2>
              </div>
              <button onClick={() => setShowEmptyReturnModal(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Select Customer</label>
                <select
                  value={returnCustId}
                  onChange={(e) => setReturnCustId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.consumerNo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Cylinder Category</label>
                <select
                  value={returnType}
                  onChange={(e) => setReturnType(e.target.value as CylinderType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="14.2KG">14.2 KG Domestic</option>
                  <option value="19KG">19 KG Commercial</option>
                  <option value="5KG">5 KG Compact</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Empty Cylinders Returned</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={returnCount}
                  onChange={(e) => setReturnCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all mt-4"
              >
                Log Empty Return
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
