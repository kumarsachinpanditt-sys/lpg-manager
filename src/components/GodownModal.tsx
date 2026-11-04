import React, { useState } from 'react';
import { CurrentUser } from '../services/firebaseAuth';
import { lpgStorage } from '../services/lpgStorage';
import { CylinderType } from '../types/lpg';
import { Warehouse, ArrowRightLeft, Plus, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser | null;
  mode: 'CREATE_GODOWN' | 'GODOWN_TO_OFFICE' | 'OFFICE_TO_GODOWN';
}

export const GodownModal: React.FC<Props> = ({ isOpen, onClose, currentUser, mode }) => {
  // New Godown state
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState(1000);

  // Transfer state
  const [cylinderType, setCylinderType] = useState<CylinderType>('14.2KG');
  const [quantity, setQuantity] = useState(10);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setFeedback({ text: 'Please log in to perform this action.', type: 'error' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    if (mode === 'CREATE_GODOWN') {
      const res = await lpgStorage.createGodown({
        name,
        location,
        capacityCylinders: Number(capacity)
      });
      setLoading(false);
      if (res.success) {
        setFeedback({ text: `Godown facility "${name}" registered successfully!`, type: 'success' });
        setTimeout(onClose, 800);
      } else {
        setFeedback({ text: res.error || 'Failed to create godown.', type: 'error' });
      }
    } else if (mode === 'GODOWN_TO_OFFICE') {
      const res = await lpgStorage.transferGodownToOffice({
        cylinderType,
        quantity: Number(quantity),
        currentUser,
        notes
      });
      setLoading(false);
      if (res.success) {
        setFeedback({ text: `Transferred ${quantity} ${cylinderType} filled cylinders to Office Counter!`, type: 'success' });
        setTimeout(onClose, 800);
      } else {
        setFeedback({ text: res.error || 'Transfer failed.', type: 'error' });
      }
    } else if (mode === 'OFFICE_TO_GODOWN') {
      const res = await lpgStorage.transferOfficeToGodown({
        cylinderType,
        quantity: Number(quantity),
        currentUser,
        notes
      });
      setLoading(false);
      if (res.success) {
        setFeedback({ text: `Returned ${quantity} empty ${cylinderType} cylinders to Godown!`, type: 'success' });
        setTimeout(onClose, 800);
      } else {
        setFeedback({ text: res.error || 'Transfer failed.', type: 'error' });
      }
    }
  };

  const title =
    mode === 'CREATE_GODOWN'
      ? 'Register Godown Facility'
      : mode === 'GODOWN_TO_OFFICE'
      ? 'Transfer: Godown → Office Counter'
      : 'Transfer: Office Counter → Godown';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center">
              {mode === 'CREATE_GODOWN' ? <Warehouse className="w-5 h-5" /> : <ArrowRightLeft className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
              <p className="text-xs text-slate-400">Inventory Movement & Logistics</p>
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {mode === 'CREATE_GODOWN' ? (
            <>
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Godown Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. North Highway Storage Depot"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Physical Location / Address</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Plot 45, Industrial Zone"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Licensed Cylinder Capacity</label>
                <input
                  type="number"
                  min="50"
                  max="10000"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Cylinder Category</label>
                <select
                  value={cylinderType}
                  onChange={(e) => setCylinderType(e.target.value as CylinderType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="14.2KG">14.2 KG Domestic</option>
                  <option value="19KG">19 KG Commercial</option>
                  <option value="5KG">5 KG Compact / Chhotu</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">
                  {mode === 'GODOWN_TO_OFFICE' ? 'Full Cylinders to Transfer' : 'Empty Cylinders to Return'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Notes / Handover Reference</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Counter morning refill quota"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2 mt-4 active:scale-[0.98] disabled:opacity-50"
          >
            <span>{loading ? 'Processing...' : 'Confirm Action'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
