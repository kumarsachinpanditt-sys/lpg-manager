import React from 'react';
import { Transaction } from '../types/lpg';
import { DEMO_AGENCY_INFO } from '../data/initialData';
import { Printer, X, ShieldCheck, Share2 } from 'lucide-react';

interface Props {
  transaction: Transaction | null;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<Props> = ({ transaction, onClose }) => {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm bg-white text-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-orange-400" />
            <span className="font-semibold text-sm">Delivery Cash Memo</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Slip Content */}
        <div id="thermal-receipt" className="p-5 font-mono text-xs leading-relaxed text-slate-800 bg-amber-50/40">
          <div className="text-center border-b border-dashed border-slate-300 pb-3">
            <div className="font-bold text-sm text-slate-900 uppercase tracking-wide">
              {DEMO_AGENCY_INFO.agencyName}
            </div>
            <div className="text-[11px] text-slate-600 font-sans">{DEMO_AGENCY_INFO.agencySubtitle}</div>
            <div className="text-[10px] text-slate-500 mt-1">{DEMO_AGENCY_INFO.address}</div>
            <div className="text-[10px] text-slate-500">
              GSTIN: <span className="font-semibold text-slate-700">{DEMO_AGENCY_INFO.gstin}</span>
            </div>
            <div className="text-[10px] text-slate-500">
              Distributor Code: <span className="font-semibold text-slate-700">{DEMO_AGENCY_INFO.distributorCode}</span>
            </div>
          </div>

          {/* Bill Meta */}
          <div className="py-2 border-b border-dashed border-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Receipt No:</span>
              <span className="font-bold text-slate-900">{transaction.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Time:</span>
              <span>{new Date(transaction.timestamp).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Consumer No:</span>
              <span className="font-bold text-orange-600">{transaction.consumerNo || 'WALK-IN'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[170px]">{transaction.customerName || 'N/A'}</span>
            </div>
            {transaction.staffName && (
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Staff:</span>
                <span className="text-slate-700">{transaction.staffName}</span>
              </div>
            )}
          </div>

          {/* Cylinder Items */}
          <div className="py-3 border-b border-dashed border-slate-300">
            <div className="flex justify-between font-bold text-slate-700 border-b border-slate-200 pb-1 mb-1">
              <span>Item Description</span>
              <span className="text-right">Qty × Rate</span>
              <span className="text-right">Total</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <div>
                <div className="font-semibold text-slate-900">{transaction.cylinderType} Refill</div>
                <div className="text-[10px] text-slate-500">Empty Received: {transaction.emptyReturned}</div>
              </div>
              <div className="text-right text-slate-600">
                {transaction.quantity} × ₹{transaction.unitPrice}
              </div>
              <div className="text-right font-bold text-slate-900">
                ₹{transaction.totalAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="py-2 border-b border-dashed border-slate-300 space-y-1">
            <div className="flex justify-between text-slate-700">
              <span>Net Payable:</span>
              <span className="font-bold text-slate-900">₹{transaction.totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Paid ({transaction.paymentMode}):</span>
              <span className="font-bold text-emerald-700">₹{transaction.paidAmount.toLocaleString('en-IN')}</span>
            </div>
            {transaction.balanceDue > 0 && (
              <div className="flex justify-between text-rose-600 font-bold">
                <span>Balance Due:</span>
                <span>₹{transaction.balanceDue.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-[11px] pt-1">
              <span className="text-slate-500">Empty Cylinder Status:</span>
              <span className="font-semibold text-slate-800">
                {transaction.emptyReturned === transaction.quantity
                  ? '✓ Returned & Deposited'
                  : `⚠️ ${transaction.quantity - transaction.emptyReturned} Cylinder Due`}
              </span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-3 text-center text-[10px] text-slate-500 space-y-1">
            <div className="flex items-center justify-center gap-1 text-emerald-600 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cylinder Pre-checked for Weight & Soundness</span>
            </div>
            <div>LPG Emergency Helpline: <strong>1906</strong></div>
            <div className="font-sans text-[9px] text-slate-400">Stay Safe • Turn off regulator at night</div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => {
              const text = `*${DEMO_AGENCY_INFO.agencyName} (${DEMO_AGENCY_INFO.agencySubtitle})*\nCustomer: ${transaction.customerName || 'Customer'}\nReceipt No: ${transaction.id}\nItem: ${transaction.quantity}x ${transaction.cylinderType} Refill\nTotal: ₹${transaction.totalAmount}\nPaid: ₹${transaction.paidAmount} (${transaction.paymentMode})\n${transaction.balanceDue > 0 ? `Balance Due: ₹${transaction.balanceDue}` : 'Status: Fully Paid'}\nEmpty Cylinders: ${transaction.emptyReturned === transaction.quantity ? 'Returned' : `${transaction.quantity - transaction.emptyReturned} Due`}\nHelpline: 1906`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-medium text-xs shadow-sm transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share via WhatsApp</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white rounded-xl font-medium text-xs shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Memo</span>
          </button>
          <button
            onClick={onClose}
            className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
