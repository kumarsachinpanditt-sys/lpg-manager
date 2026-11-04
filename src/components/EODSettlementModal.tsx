import React, { useState } from 'react';
import { CurrentUser } from '../services/firebaseAuth';
import { lpgStorage } from '../services/lpgStorage';
import { CheckCircle2, AlertCircle, X, ShieldCheck, IndianRupee } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser | null;
}

export const EODSettlementModal: React.FC<Props> = ({ isOpen, onClose, currentUser }) => {
  const staffList = lpgStorage.getStaff();
  const [selectedStaffId, setSelectedStaffId] = useState(staffList[0]?.id || '');
  const staff = staffList.find((s) => s.id === selectedStaffId) || staffList[0];

  const [ret14Full, setRet14Full] = useState(0);
  const [ret14Empty, setRet14Empty] = useState(0);
  const [ret19Full, setRet19Full] = useState(0);
  const [ret19Empty, setRet19Empty] = useState(0);
  const [ret5Full, setRet5Full] = useState(0);
  const [ret5Empty, setRet5Empty] = useState(0);
  const [cashHandover, setCashHandover] = useState(0);
  const [upiHandover, setUpiHandover] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  React.useEffect(() => {
    if (staff) {
      setRet14Full(staff.stock['14.2KG'].full);
      setRet14Empty(staff.stock['14.2KG'].empty);
      setRet19Full(staff.stock['19KG'].full);
      setRet19Empty(staff.stock['19KG'].empty);
      setRet5Full(staff.stock['5KG'].full);
      setRet5Empty(staff.stock['5KG'].empty);
      setCashHandover(staff.cashInHand);
      setUpiHandover(staff.upiInHand);
    }
  }, [selectedStaffId, staff]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setFeedback({ text: 'Please sign in as Admin to verify shift settlement.', type: 'error' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    const res = await lpgStorage.reconcileStaffEOD({
      staffId: staff.id,
      staffName: staff.name,
      returned14Full: Number(ret14Full),
      returned14Empty: Number(ret14Empty),
      returned19Full: Number(ret19Full),
      returned19Empty: Number(ret19Empty),
      returned5Full: Number(ret5Full),
      returned5Empty: Number(ret5Empty),
      cashHandedOver: Number(cashHandover),
      upiHandedOver: Number(upiHandover),
      adminId: currentUser.id,
      adminName: currentUser.name,
      notes
    });

    setLoading(false);
    if (res.success) {
      setFeedback({ text: `Shift settlement reconciled for ${staff.name} (Ref: ${res.settlementId})`, type: 'success' });
      setTimeout(onClose, 800);
    } else {
      setFeedback({ text: res.error || 'Settlement failed.', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Staff End-of-Day Checkout</h2>
              <p className="text-xs text-slate-400">Stock Reversal & Cash Safe Deposit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedback && (
          <div
            className={`mx-5 mt-4 p-3 rounded-2xl text-xs flex items-center gap-2 font-medium ${
              feedback.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{feedback.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-semibold mb-1 block">Select Staff Member</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.vehicleNo})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="text-xs font-bold text-slate-300">Physical Stock Returned to Godown</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">14.2 KG Full / Empty</span>
                <div className="flex gap-1 mt-1">
                  <input
                    type="number"
                    value={ret14Full}
                    onChange={(e) => setRet14Full(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-white"
                  />
                  <input
                    type="number"
                    value={ret14Empty}
                    onChange={(e) => setRet14Empty(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-white"
                  />
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">19 KG Full / Empty</span>
                <div className="flex gap-1 mt-1">
                  <input
                    type="number"
                    value={ret19Full}
                    onChange={(e) => setRet19Full(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-white"
                  />
                  <input
                    type="number"
                    value={ret19Empty}
                    onChange={(e) => setRet19Empty(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-white"
                  />
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">5 KG Full / Empty</span>
                <div className="flex gap-1 mt-1">
                  <input
                    type="number"
                    value={ret5Full}
                    onChange={(e) => setRet5Full(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-white"
                  />
                  <input
                    type="number"
                    value={ret5Empty}
                    onChange={(e) => setRet5Empty(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1 block">Cash Handover (₹)</label>
              <input
                type="number"
                value={cashHandover}
                onChange={(e) => setCashHandover(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1 block">UPI Collections (₹)</label>
              <input
                type="number"
                value={upiHandover}
                onChange={(e) => setUpiHandover(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-semibold mb-1 block">Audit Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified by agency counter manager"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2 mt-4 active:scale-[0.98] disabled:opacity-50"
          >
            <span>{loading ? 'Reconciling Shift...' : 'Sign Off & Deposit Into Safe'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
