import React, { useState } from 'react';
import { CurrentUser } from '../services/firebaseAuth';
import { lpgStorage } from '../services/lpgStorage';
import { Customer, CustomerType } from '../types/lpg';
import {
  Users,
  Search,
  Plus,
  IndianRupee,
  Phone,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  RotateCcw
} from 'lucide-react';

interface Props {
  currentUser: CurrentUser | null;
}

export const CustomerScreen: React.FC<Props> = ({ currentUser }) => {
  const customers = lpgStorage.getCustomers();
  const [filterType, setFilterType] = useState<'ALL' | 'DOMESTIC' | 'COMMERCIAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment modal state
  const [payCustomer, setPayCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMode, setPayMode] = useState<'CASH' | 'UPI'>('CASH');

  // New Customer modal state
  const [showNewCustModal, setShowNewCustModal] = useState(false);
  const [custName, setCustName] = useState('');
  const [custMobile, setCustMobile] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custType, setCustType] = useState<CustomerType>('DOMESTIC');
  const [custFirm, setCustFirm] = useState('');
  const [custGstin, setCustGstin] = useState('');

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const filtered = customers.filter((c) => {
    if (filterType !== 'ALL' && c.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.consumerNo.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        (c.firmName && c.firmName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payCustomer || !currentUser) return;

    setLoading(true);
    const res = await lpgStorage.recordPaymentCollection({
      staffId: currentUser.id,
      staffName: currentUser.name,
      customerId: payCustomer.id,
      customerName: payCustomer.name,
      amount: Number(payAmount),
      paymentMode: payMode
    });
    setLoading(false);

    if (res.success) {
      setFeedback({ text: `Recorded ₹${payAmount} payment from ${payCustomer.name}!`, type: 'success' });
      setPayCustomer(null);
    } else {
      setFeedback({ text: res.error || 'Payment recording failed.', type: 'error' });
    }
  };

  const handleNewCustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const consumerNo = `IND-${Date.now().toString().slice(-6)}`;
    try {
      await lpgStorage.createCustomer({
        consumerNo,
        name: custName,
        mobile: custMobile,
        address: custAddress,
        type: custType,
        firmName: custType === 'COMMERCIAL' ? custFirm : undefined,
        gstin: custType === 'COMMERCIAL' ? custGstin : undefined,
        cylinderDues: { '14.2KG': 0, '19KG': 0, '5KG': 0 },
        paymentDue: 0,
        connectionDate: new Date().toISOString().split('T')[0]
      });
      setLoading(false);
      setFeedback({ text: `Customer "${custName}" added successfully (${consumerNo})!`, type: 'success' });
      setShowNewCustModal(false);
      setCustName('');
      setCustMobile('');
      setCustAddress('');
      setCustFirm('');
      setCustGstin('');
    } catch {
      setLoading(false);
      setFeedback({ text: 'Failed to create customer record.', type: 'error' });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 p-4 space-y-4 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span>Customer Directory & Commercial Ledger</span>
          </h1>
          <p className="text-xs text-slate-400">
            Domestic connections, 19 KG commercial credit dues, and empty cylinder tracking.
          </p>
        </div>

        <button
          onClick={() => setShowNewCustModal(true)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Customer</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-2xl text-xs flex items-center justify-between font-medium ${
            feedback.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by consumer name, firm, number..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1 text-xs font-semibold">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 rounded-xl transition-colors ${filterType === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('DOMESTIC')}
            className={`px-3 py-1 rounded-xl transition-colors ${filterType === 'DOMESTIC' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Domestic (14.2)
          </button>
          <button
            onClick={() => setFilterType('COMMERCIAL')}
            className={`px-3 py-1 rounded-xl transition-colors ${filterType === 'COMMERCIAL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Commercial (19)
          </button>
        </div>
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {filtered.map((c) => {
          const isCommercial = c.type === 'COMMERCIAL';
          const empty19Owed = c.cylinderDues['19KG'] || 0;
          const empty14Owed = c.cylinderDues['14.2KG'] || 0;

          return (
            <div
              key={c.id}
              className={`p-4 rounded-3xl bg-slate-900 border transition-all ${
                isCommercial ? 'border-blue-900/60' : 'border-slate-800/80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{c.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isCommercial
                          ? 'bg-blue-950/80 text-blue-300 border-blue-800/60'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {c.type}
                    </span>
                  </div>

                  {c.firmName && (
                    <div className="text-xs font-semibold text-blue-300 mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{c.firmName}</span>
                      {c.gstin && <span className="text-[10px] text-slate-500 font-mono">({c.gstin})</span>}
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <span className="font-mono">Ref: {c.consumerNo}</span>
                    <span>Mob: {c.mobile}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">{c.address}</div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Payment Due</div>
                  <div
                    className={`text-base font-black font-mono ${
                      c.paymentDue > 0 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    ₹{c.paymentDue.toLocaleString()}
                  </div>

                  {c.paymentDue > 0 && (
                    <button
                      onClick={() => {
                        setPayCustomer(c);
                        setPayAmount(c.paymentDue);
                      }}
                      className="mt-2 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 ml-auto transition-all shadow"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Pay Dues</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Outstanding Empty Cylinders Bar */}
              {(empty19Owed > 0 || empty14Owed > 0) && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Unreturned Empty Cylinders:</span>
                  <div className="flex gap-2">
                    {empty19Owed > 0 && (
                      <span className="px-2 py-0.5 rounded-lg bg-blue-950/80 text-blue-300 border border-blue-800/60 font-mono font-bold text-[11px]">
                        19 KG: {empty19Owed} Owed
                      </span>
                    )}
                    {empty14Owed > 0 && (
                      <span className="px-2 py-0.5 rounded-lg bg-orange-950/80 text-orange-300 border border-orange-800/60 font-mono font-bold text-[11px]">
                        14.2 KG: {empty14Owed} Owed
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment Collection Modal */}
      {payCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Record Credit Payment</h2>
              </div>
              <button onClick={() => setPayCustomer(null)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-5 space-y-3.5">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-xs text-slate-400">Customer</div>
                <div className="text-sm font-bold text-white">{payCustomer.name} ({payCustomer.consumerNo})</div>
                <div className="text-xs text-amber-400 font-mono mt-1">Outstanding Balance: ₹{payCustomer.paymentDue}</div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Payment Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  max={payCustomer.paymentDue}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Payment Method</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value as 'CASH' | 'UPI')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="CASH">Cash Collection</option>
                  <option value="UPI">UPI Digital Transfer</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all mt-4"
              >
                Confirm Payment Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {showNewCustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold text-white">Register Consumer Account</h2>
              </div>
              <button onClick={() => setShowNewCustModal(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleNewCustSubmit} className="p-5 space-y-3.5 overflow-y-auto">
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Account Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustType('DOMESTIC')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      custType === 'DOMESTIC' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Domestic (14.2 KG)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustType('COMMERCIAL')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      custType === 'COMMERCIAL' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Commercial (19 KG)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Contact Person Name</label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  required
                />
              </div>

              {custType === 'COMMERCIAL' && (
                <>
                  <div>
                    <label className="text-xs text-slate-400 font-semibold mb-1 block">Commercial Firm / Hotel Name</label>
                    <input
                      type="text"
                      value={custFirm}
                      onChange={(e) => setCustFirm(e.target.value)}
                      placeholder="e.g. Grand Palace Banquet"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-semibold mb-1 block">GSTIN Number</label>
                    <input
                      type="text"
                      value={custGstin}
                      onChange={(e) => setCustGstin(e.target.value)}
                      placeholder="07AAAAA0000A1Z5"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono uppercase"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Mobile Number</label>
                <input
                  type="text"
                  value={custMobile}
                  onChange={(e) => setCustMobile(e.target.value)}
                  placeholder="98765 43210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Delivery Address</label>
                <input
                  type="text"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="House / Shop No, Street, Landmark"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all mt-4"
              >
                Register Consumer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
