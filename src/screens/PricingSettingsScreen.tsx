import React, { useState } from 'react';
import { CurrentUser } from '../services/firebaseAuth';
import { lpgStorage } from '../services/lpgStorage';
import { CylinderPricing } from '../types/lpg';
import { Settings, Save, CheckCircle2, AlertCircle, Code2 } from 'lucide-react';
import { lpgFirestore } from '../services/lpgFirestore';

interface Props {
  currentUser: CurrentUser | null;
  onOpenAndroidCode: () => void;
}

export const PricingSettingsScreen: React.FC<Props> = ({ currentUser, onOpenAndroidCode }) => {
  const pricing = lpgStorage.getPricing();
  const [list, setList] = useState<CylinderPricing[]>(pricing);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handlePriceChange = (index: number, field: 'refillPrice' | 'purchasePrice' | 'depositPrice', val: number) => {
    const updated = [...list];
    updated[index] = { ...updated[index], [field]: val };
    setList(updated);
  };

  const handleSave = async (item: CylinderPricing) => {
    setLoading(true);
    setMessage(null);
    try {
      await lpgFirestore.updatePricing(item);
      setLoading(false);
      setMessage({ text: `Updated ${item.title} pricing in Firestore master!`, type: 'success' });
    } catch {
      setLoading(false);
      setMessage({ text: 'Failed to update pricing.', type: 'error' });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 p-4 space-y-4 text-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-400" />
            <span>Cylinder Tariff & Pricing Settings</span>
          </h1>
          <p className="text-xs text-slate-400">
            Configure retail refill rates, OMC purchase price, and security deposits.
          </p>
        </div>

        <button
          onClick={onOpenAndroidCode}
          className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 rounded-xl text-xs font-semibold flex items-center gap-1.5"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Android Code</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-2xl text-xs flex items-center gap-2 font-medium ${
            message.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="space-y-3">
        {list.map((item, idx) => (
          <div key={item.cylinderType} className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">{item.title}</div>
                <div className="text-[10px] text-slate-400">{item.subtitle}</div>
              </div>
              <button
                onClick={() => handleSave(item)}
                disabled={loading}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 mb-1 block">Refill Price (₹)</label>
                <input
                  type="number"
                  value={item.refillPrice}
                  onChange={(e) => handlePriceChange(idx, 'refillPrice', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 mb-1 block">Purchase Price (₹)</label>
                <input
                  type="number"
                  value={item.purchasePrice}
                  onChange={(e) => handlePriceChange(idx, 'purchasePrice', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 mb-1 block">New Connection Deposit (₹)</label>
                <input
                  type="number"
                  value={item.depositPrice}
                  onChange={(e) => handlePriceChange(idx, 'depositPrice', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
