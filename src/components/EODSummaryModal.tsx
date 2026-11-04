import React from 'react';
import { lpgStorage } from '../services/lpgStorage';
import { DEMO_AGENCY_INFO } from '../data/initialData';
import { FileText, Download, Share2, X, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const EODSummaryModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const godown = lpgStorage.getGodownStock();
  const office = lpgStorage.getOfficeStock();
  const staff = lpgStorage.getStaff();
  const txns = lpgStorage.getTransactions();

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTxns = txns.filter((t) => t.timestamp.startsWith(todayStr));

  const totalDelivered = todayTxns.filter((t) => t.txnType === 'STAFF_TO_CUSTOMER').reduce((acc, t) => acc + t.quantity, 0);
  const totalEmpties = todayTxns.filter((t) => t.txnType === 'STAFF_TO_CUSTOMER' || t.txnType === 'CUSTOMER_EMPTY_RETURN').reduce((acc, t) => acc + t.emptyReturned, 0);
  const cashCollected = todayTxns.filter((t) => t.paymentMode === 'CASH').reduce((acc, t) => acc + t.paidAmount, 0);
  const upiCollected = todayTxns.filter((t) => t.paymentMode === 'UPI').reduce((acc, t) => acc + t.paidAmount, 0);

  const reportContent = `
LPG AGENCY END-OF-DAY SUMMARY REPORT
Agency: ${DEMO_AGENCY_INFO.agencyName}
Date: ${todayStr}

1. GODOWN CLOSING STOCK
- 14.2 KG: Full ${godown['14.2KG'].full} | Empty ${godown['14.2KG'].empty} | Defective ${godown['14.2KG'].defective}
- 19 KG: Full ${godown['19KG'].full} | Empty ${godown['19KG'].empty} | Defective ${godown['19KG'].defective}
- 5 KG: Full ${godown['5KG'].full} | Empty ${godown['5KG'].empty} | Defective ${godown['5KG'].defective}

2. OFFICE COUNTER STOCK
- 14.2 KG: Full ${office['14.2KG'].full} | Empty ${office['14.2KG'].empty}
- 19 KG: Full ${office['19KG'].full} | Empty ${office['19KG'].empty}

3. DAILY OPERATIONS SUMMARY
- Total Delivered Cylinders: ${totalDelivered}
- Total Empty Cylinders Recovered: ${totalEmpties}
- Total Cash Collected: ₹${cashCollected.toLocaleString('en-IN')}
- Total UPI Collected: ₹${upiCollected.toLocaleString('en-IN')}
- Gross Turnover: ₹${(cashCollected + upiCollected).toLocaleString('en-IN')}
  `.trim();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `LPG EOD Summary - ${todayStr}`,
        text: reportContent
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(reportContent);
      alert('Report copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">End-of-Day Summary Report</h2>
              <p className="text-xs text-slate-400">One-Click Operational Audit Export</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed select-text">
            {reportContent}
          </pre>

          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Share2 className="w-4 h-4" />
              <span>Share / Copy Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
