import React, { useState } from 'react';
import { CurrentUser } from '../services/firebaseAuth';
import { lpgStorage } from '../services/lpgStorage';
import { CylinderType } from '../types/lpg';
import {
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  AlertCircle,
  Truck,
  CheckCircle2,
  X,
  IndianRupee,
  ShieldCheck,
  Building2,
  Warehouse,
  ArrowRightLeft,
  FileSpreadsheet,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { DefectiveCylinderModal } from '../components/DefectiveCylinderModal';
import { EODSettlementModal } from '../components/EODSettlementModal';
import { EODSummaryModal } from '../components/EODSummaryModal';
import { GodownModal } from '../components/GodownModal';
import { StaffModal } from '../components/StaffModal';

interface Props {
  currentUser: CurrentUser | null;
}

export const GodownScreen: React.FC<Props> = ({ currentUser }) => {
  const godown = lpgStorage.getGodownStock();
  const office = lpgStorage.getOfficeStock();
  const godownsList = lpgStorage.getGodowns();
  const staffList = lpgStorage.getStaff();
  const isAdmin = currentUser?.role === 'ADMIN';

  // Modal States
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showDefectiveModal, setShowDefectiveModal] = useState(false);
  const [showEODSettlement, setShowEODSettlement] = useState(false);
  const [showEODSummary, setShowEODSummary] = useState(false);
  const [godownModalMode, setGodownModalMode] = useState<'CREATE_GODOWN' | 'GODOWN_TO_OFFICE' | 'OFFICE_TO_GODOWN' | null>(null);
  const [showStaffModal, setShowStaffModal] = useState(false);

  // Inward Form State
  const [inwardTruck, setInwardTruck] = useState('');
  const [inwardInvoice, setInwardInvoice] = useState('');
  const [inwardType, setInwardType] = useState<CylinderType>('14.2KG');
  const [inwardFull, setInwardFull] = useState(300);
  const [inwardEmpty, setInwardEmpty] = useState(300);
  const [inwardPrice, setInwardPrice] = useState(765);
  const [inwardNotes, setInwardNotes] = useState('');

  // Issue Form State
  const [issueStaffId, setIssueStaffId] = useState(staffList[0]?.id || '');
  const [issueType, setIssueType] = useState<CylinderType>('14.2KG');
  const [issueQty, setIssueQty] = useState(30);

  // Status/Error notification
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Handler for Plant Inward
  const handleInwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isAdmin) {
      setMessage({ text: 'Administrative credentials required for plant inward receipts.', type: 'error' });
      return;
    }

    const res = await lpgStorage.receivePlantStock({
      truckNo: inwardTruck || 'TRUCK-INW',
      invoiceNo: inwardInvoice || 'INV-001',
      cylinderType: inwardType,
      fullReceived: Number(inwardFull),
      emptyDespatched: Number(inwardEmpty),
      unitPurchasePrice: Number(inwardPrice),
      adminUser: currentUser,
      notes: inwardNotes
    });

    if (res.success) {
      setMessage({
        text: `Plant inward stock logged successfully (+${inwardFull} ${inwardType} Full, -${inwardEmpty} Empty). Ref: ${res.txnId}`,
        type: 'success'
      });
      setShowInwardModal(false);
      setInwardTruck('');
      setInwardInvoice('');
    } else {
      setMessage({ text: res.error || 'Failed to record plant inward.', type: 'error' });
    }
  };

  // Handler for Issue to Staff
  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isAdmin) {
      setMessage({ text: 'Administrative credentials required to issue stock to vehicles.', type: 'error' });
      return;
    }

    const res = await lpgStorage.issueStockToStaff({
      staffId: issueStaffId,
      cylinderType: issueType,
      quantity: Number(issueQty),
      adminUser: currentUser
    });

    if (res.success) {
      setMessage({
        text: `Cylinders loaded into delivery vehicle successfully (${issueQty} ${issueType} Full). Ref: ${res.txnId}`,
        type: 'success'
      });
      setShowIssueModal(false);
    } else {
      setMessage({ text: res.error || 'Failed to issue cylinders.', type: 'error' });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 p-4 space-y-4 text-slate-100">
      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-400" />
            <span>Godown Inventory & Storage Logistics</span>
          </h1>
          <p className="text-xs text-slate-400">
            Plant receiving, vehicle loading, office counter transfers, and quarantine storage.
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowInwardModal(true)}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-colors"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Plant Inward</span>
            </button>

            <button
              onClick={() => setShowIssueModal(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-colors"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Load Van</span>
            </button>

            <button
              onClick={() => setGodownModalMode('CREATE_GODOWN')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Godown</span>
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`p-3 rounded-2xl text-xs flex items-center justify-between font-medium ${
            message.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
              : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Godowns Selector Strip */}
      <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between overflow-x-auto gap-2">
        <div className="flex items-center gap-2">
          <Warehouse className="w-4 h-4 text-orange-400 shrink-0" />
          <span className="text-xs font-bold text-white shrink-0">Facilities:</span>
          {godownsList.map((g) => (
            <span
              key={g.id}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 border ${
                g.isPrimary
                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              {g.name} ({g.capacityCylinders} cap)
            </span>
          ))}
        </div>
      </div>

      {/* Godown Master Stock Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 14.2 KG */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-400 uppercase">14.2 KG Domestic</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-950/80 text-orange-300 border border-orange-800/50">
              Household
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-lg font-black text-emerald-400 font-mono">{godown['14.2KG'].full}</span>
              <span className="text-[10px] text-slate-500 block">Full</span>
            </div>
            <div className="p-2 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-lg font-black text-amber-400 font-mono">{godown['14.2KG'].empty}</span>
              <span className="text-[10px] text-slate-500 block">Empty</span>
            </div>
            <div className="p-2 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-lg font-black text-rose-400 font-mono">{godown['14.2KG'].defective}</span>
              <span className="text-[10px] text-slate-500 block">Quarantined</span>
            </div>
          </div>
        </div>

        {/* 19 KG */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 uppercase">19 KG Commercial</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/50">
              Hotels & Industry
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-lg font-black text-emerald-400 font-mono">{godown['19KG'].full}</span>
              <span className="text-[10px] text-slate-500 block">Full</span>
            </div>
            <div className="p-2 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-lg font-black text-amber-400 font-mono">{godown['19KG'].empty}</span>
              <span className="text-[10px] text-slate-500 block">Empty</span>
            </div>
            <div className="p-2 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-lg font-black text-rose-400 font-mono">{godown['19KG'].defective}</span>
              <span className="text-[10px] text-slate-500 block">Quarantined</span>
            </div>
          </div>
        </div>

        {/* 5 KG */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase">5 KG Compact / Chhotu</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
              Free Trade LPG
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-lg font-black text-emerald-400 font-mono">{godown['5KG'].full}</span>
              <span className="text-[10px] text-slate-500 block">Full</span>
            </div>
            <div className="p-2 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-lg font-black text-amber-400 font-mono">{godown['5KG'].empty}</span>
              <span className="text-[10px] text-slate-500 block">Empty</span>
            </div>
            <div className="p-2 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-lg font-black text-rose-400 font-mono">{godown['5KG'].defective}</span>
              <span className="text-[10px] text-slate-500 block">Quarantined</span>
            </div>
          </div>
        </div>
      </div>

      {/* Office Showroom Counter Stock & Transfer Console */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Agency Office Showroom Counter</h2>
              <p className="text-[10px] text-slate-400">Walk-in refills, point-of-sale customer pickup, and empty cylinder return</p>
            </div>
          </div>

          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={() => setGodownModalMode('GODOWN_TO_OFFICE')}
                className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Godown → Office</span>
              </button>

              <button
                onClick={() => setGodownModalMode('OFFICE_TO_GODOWN')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Office → Godown</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="text-[10px] text-slate-400 mb-1">14.2 KG Counter</div>
            <div className="flex justify-between items-center font-mono">
              <span className="text-emerald-400 font-bold">{office['14.2KG'].full} Full</span>
              <span className="text-amber-400">{office['14.2KG'].empty} Empty</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="text-[10px] text-slate-400 mb-1">19 KG Counter</div>
            <div className="flex justify-between items-center font-mono">
              <span className="text-emerald-400 font-bold">{office['19KG'].full} Full</span>
              <span className="text-amber-400">{office['19KG'].empty} Empty</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="text-[10px] text-slate-400 mb-1">5 KG Counter</div>
            <div className="flex justify-between items-center font-mono">
              <span className="text-emerald-400 font-bold">{office['5KG'].full} Full</span>
              <span className="text-amber-400">{office['5KG'].empty} Empty</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="text-[10px] text-slate-400 mb-1">Counter Cash in Safe</div>
            <div className="text-sm font-bold text-white font-mono">₹{office.cashInHand.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Action Bar for Defective, Staff Setup, and EOD */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          onClick={() => setShowDefectiveModal(true)}
          className="p-3 bg-rose-950/30 border border-rose-800/40 hover:bg-rose-900/30 rounded-2xl text-xs font-bold text-rose-300 flex items-center justify-between transition-colors"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Quarantine Defective Cylinder</span>
          </span>
          <ArrowRightLeft className="w-3.5 h-3.5" />
        </button>

        {isAdmin && (
          <button
            onClick={() => setShowStaffModal(true)}
            className="p-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-2xl text-xs font-bold text-slate-200 flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Create Delivery Staff (PIN)</span>
            </span>
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setShowEODSettlement(true)}
            className="p-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-2xl text-xs font-bold text-slate-200 flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              <span>Staff EOD Checkout</span>
            </span>
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Modals */}
      {godownModalMode && (
        <GodownModal
          isOpen={true}
          onClose={() => setGodownModalMode(null)}
          currentUser={currentUser}
          mode={godownModalMode}
        />
      )}

      {showStaffModal && (
        <StaffModal
          isOpen={true}
          onClose={() => setShowStaffModal(false)}
        />
      )}

      {showDefectiveModal && (
        <DefectiveCylinderModal
          isOpen={true}
          onClose={() => setShowDefectiveModal(false)}
          currentUser={currentUser}
        />
      )}

      {showEODSettlement && (
        <EODSettlementModal
          isOpen={true}
          onClose={() => setShowEODSettlement(false)}
          currentUser={currentUser}
        />
      )}

      {showEODSummary && (
        <EODSummaryModal
          isOpen={true}
          onClose={() => setShowEODSummary(false)}
        />
      )}

      {/* Plant Inward Modal */}
      {showInwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-orange-400" />
                <h2 className="text-base font-bold text-white">Bottling Plant Inward Receiving</h2>
              </div>
              <button onClick={() => setShowInwardModal(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInwardSubmit} className="p-5 space-y-3.5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Truck Vehicle No</label>
                  <input
                    type="text"
                    value={inwardTruck}
                    onChange={(e) => setInwardTruck(e.target.value)}
                    placeholder="DL 01 TR 9021"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white uppercase font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Plant Invoice No</label>
                  <input
                    type="text"
                    value={inwardInvoice}
                    onChange={(e) => setInwardInvoice(e.target.value)}
                    placeholder="IOCL-9842"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white uppercase font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Cylinder Category</label>
                <select
                  value={inwardType}
                  onChange={(e) => setInwardType(e.target.value as CylinderType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="14.2KG">14.2 KG Domestic</option>
                  <option value="19KG">19 KG Commercial</option>
                  <option value="5KG">5 KG Compact</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Full Received (+)</label>
                  <input
                    type="number"
                    value={inwardFull}
                    onChange={(e) => setInwardFull(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Empties Returned (-)</label>
                  <input
                    type="number"
                    value={inwardEmpty}
                    onChange={(e) => setInwardEmpty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Billing Purchase Price (₹)</label>
                <input
                  type="number"
                  value={inwardPrice}
                  onChange={(e) => setInwardPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all mt-4"
              >
                Confirm Plant Receiving
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Issue Stock to Van Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">Load Delivery Vehicle</h2>
              </div>
              <button onClick={() => setShowIssueModal(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Select Delivery Van</label>
                <select
                  value={issueStaffId}
                  onChange={(e) => setIssueStaffId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.vehicleNo} - {s.vehicleType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Cylinder Category</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value as CylinderType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="14.2KG">14.2 KG Domestic</option>
                  <option value="19KG">19 KG Commercial</option>
                  <option value="5KG">5 KG Compact</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Quantity to Load</label>
                <input
                  type="number"
                  min="1"
                  max="150"
                  value={issueQty}
                  onChange={(e) => setIssueQty(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all mt-4"
              >
                Transfer to Vehicle
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
