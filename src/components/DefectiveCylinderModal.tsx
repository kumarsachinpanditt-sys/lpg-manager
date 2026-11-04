import React, { useState } from 'react';
import { CurrentUser } from '../services/firebaseAuth';
import { lpgStorage } from '../services/lpgStorage';
import { CylinderType, DefectType } from '../types/lpg';
import { AlertTriangle, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser | null;
}

export const DefectiveCylinderModal: React.FC<Props> = ({ isOpen, onClose, currentUser }) => {
  const [cylinderType, setCylinderType] = useState<CylinderType>('14.2KG');
  const [defectType, setDefectType] = useState<DefectType>('PIN_LEAK');
  const [serialNo, setSerialNo] = useState('');
  const [source, setSource] = useState<'GODOWN' | 'VAN_DELIVERY' | 'CUSTOMER_RETURN' | 'OFFICE_COUNTER'>('GODOWN');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setFeedback({ text: 'Please sign in to log defectives.', type: 'error' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const id = await lpgStorage.logDefective({
        cylinderType,
        defectType,
        cylinderSerialNo: serialNo || undefined,
        source,
        reportedBy: currentUser.id,
        reportedByName: currentUser.name,
        notes
      });
      setLoading(false);
      setFeedback({ text: `Defective cylinder logged & quarantined (Ref: ${id})`, type: 'success' });
      setTimeout(onClose, 800);
    } catch (err) {
      setLoading(false);
      setFeedback({ text: err instanceof Error ? err.message : 'Failed to log defective cylinder.', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Log Leaking / Defective Cylinder</h2>
              <p className="text-xs text-slate-400">Bottling Plant Warranty Segregation</p>
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

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="text-xs text-slate-400 font-semibold mb-1 block">Cylinder Category</label>
            <select
              value={cylinderType}
              onChange={(e) => setCylinderType(e.target.value as CylinderType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="14.2KG">14.2 KG Domestic</option>
              <option value="19KG">19 KG Commercial</option>
              <option value="5KG">5 KG Compact</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-semibold mb-1 block">Defect Classification</label>
            <select
              value={defectType}
              onChange={(e) => setDefectType(e.target.value as DefectType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="PIN_LEAK">Pin Leakage / Valve O-Ring Failure</option>
              <option value="VALVE_DEFECT">Valve Thread Jam / Damaged Spindle</option>
              <option value="O_RING_DAMAGE">Rubber O-Ring Torn / Dislodged</option>
              <option value="BODY_DENT_LEAK">Cylinder Body Wall Dent / Pinhole Leak</option>
              <option value="WEIGHT_DISCREPANCY">Severe Tare Weight Mismatch</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1 block">Cylinder Serial No</label>
              <input
                type="text"
                value={serialNo}
                onChange={(e) => setSerialNo(e.target.value)}
                placeholder="e.g. IN-23-1092"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1 block">Detection Point</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="GODOWN">Godown Storage</option>
                <option value="VAN_DELIVERY">Delivery Van Transit</option>
                <option value="CUSTOMER_RETURN">Customer Kitchen Return</option>
                <option value="OFFICE_COUNTER">Office Counter</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-semibold mb-1 block">Inspection Observations</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Hissing sound observed during safety cap removal"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2 mt-4 active:scale-[0.98] disabled:opacity-50"
          >
            <span>{loading ? 'Logging Defective...' : 'Quarantine Defective Cylinder'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
