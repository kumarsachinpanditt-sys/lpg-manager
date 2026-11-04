import React, { useState } from 'react';
import { lpgStorage } from '../services/lpgStorage';
import { Truck, Plus, X, CheckCircle2, AlertCircle, Phone, Lock, Hash } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [vehicleNo, setVehicleNo] = useState('DL 01 LPG ');
  const [vehicleType, setVehicleType] = useState('Tata Ace Delivery Van');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setFeedback({ text: 'PIN must be at least 4 digits.', type: 'error' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    const res = await lpgStorage.createStaff({
      name,
      phone,
      vehicleNo,
      vehicleType,
      pin
    });
    setLoading(false);

    if (res.success) {
      setFeedback({ text: `Delivery staff "${name}" registered with secure PIN!`, type: 'success' });
      setTimeout(onClose, 800);
    } else {
      setFeedback({ text: res.error || 'Failed to register staff.', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Register Delivery Staff</h2>
              <p className="text-xs text-slate-400">Personnel & Vehicle Credential Setup</p>
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
            <label className="text-xs text-slate-400 font-semibold mb-1 block">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-semibold mb-1 block">Mobile Number (Login ID)</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1 block">Assigned Vehicle No</label>
              <input
                type="text"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono uppercase"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1 block">Vehicle Type</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Tata Ace Delivery Van">Tata Ace Delivery Van</option>
                <option value="Electric Cargo Rickshaw">Electric Cargo Rickshaw</option>
                <option value="Mahindra Bolero Pickup">Mahindra Bolero Pickup</option>
                <option value="Three-Wheeler Tempo">Three-Wheeler Tempo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-semibold mb-1 block">4-Digit Access PIN</label>
            <input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono tracking-widest"
              required
            />
            <p className="text-[10px] text-slate-500 mt-1">Staff will use this PIN to log in on their mobile device.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 mt-4 active:scale-[0.98] disabled:opacity-50"
          >
            <span>{loading ? 'Registering Staff...' : 'Create Staff Profile'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
