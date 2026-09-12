import React, { useState } from 'react';
import { 
  Users, 
  CreditCard, 
  ArrowDownLeft, 
  ArrowUpRight, 
  DollarSign, 
  Search, 
  Check, 
  Phone,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { CreditRecord } from '../types';

interface CreditLedgerModuleProps {
  credits: CreditRecord[];
  onPaymentRecorded: () => void;
  recordPayment: (creditId: string, amount: number, notes?: string) => Promise<CreditRecord>;
}

export const CreditLedgerModule: React.FC<CreditLedgerModuleProps> = ({
  credits,
  onPaymentRecorded,
  recordPayment
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CreditRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const totalDues = credits.reduce((sum, c) => sum + c.outstanding_dues, 0);

  const filteredCredits = credits.filter(c =>
    !searchQuery ||
    c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.customer_phone && c.customer_phone.includes(searchQuery))
  );

  const openPaymentModal = (record: CreditRecord) => {
    setSelectedCustomer(record);
    setPaymentAmount(record.outstanding_dues);
    setPaymentNotes('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (paymentAmount <= 0) {
      setErrorMsg('Payment amount must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await recordPayment(selectedCustomer.id, paymentAmount, paymentNotes);
      setSuccessMsg(`Payment of ₹${paymentAmount.toFixed(2)} recorded for ${selectedCustomer.customer_name}.`);
      onPaymentRecorded();
      setSelectedCustomer(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Outstanding Dues
            </span>
            <div className="text-2xl font-black text-amber-700 font-mono mt-0.5">
              ₹{totalDues.toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-400">Total owed by credit customers</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Credit Accounts
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {credits.length}
            </div>
            <span className="text-[11px] text-slate-400">Customers registered in Khata</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Khata Status
            </span>
            <div className="text-sm font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              Synced with POS
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">
              Credit checkouts auto-add here
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="font-bold text-emerald-900">Dismiss</button>
        </div>
      )}

      {/* Customer Dues Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Customer Credit Ledger</h3>
            <p className="text-xs text-slate-500">Track credit purchases and record settlement payments</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search customer name or phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 min-w-[200px]">Customer Name</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4 text-right">Outstanding Dues</th>
                <th className="py-3 px-4 text-center">Transactions</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCredits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No credit records found. Complete a POS checkout with payment method "Credit" to record dues.
                  </td>
                </tr>
              ) : (
                filteredCredits.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {c.customer_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {c.customer_phone || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-700 text-sm">
                      ₹{c.outstanding_dues.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-500">
                      {c.transactions.length} entries
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => openPaymentModal(c)}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-semibold text-xs transition-colors"
                      >
                        Record Payment
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">
                Record Settlement Payment
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Customer: <strong className="text-slate-800">{selectedCustomer.customer_name}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                  {errorMsg}
                </div>
              )}

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center text-xs">
                <span className="text-amber-900 font-medium">Current Outstanding:</span>
                <span className="font-mono font-bold text-amber-900 text-base">
                  ₹{selectedCustomer.outstanding_dues.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount Received (₹) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  required
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Notes / Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref #88912 or Cash received"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              {/* Past Transactions for this customer */}
              <div className="pt-2">
                <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Recent Ledger History
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {selectedCustomer.transactions.map(tx => (
                    <div key={tx.id} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between text-slate-700">
                      <div>
                        <div className="font-medium text-[11px]">
                          {tx.type === 'sale' ? 'Credit Purchase' : 'Payment Received'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(tx.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`font-mono font-bold ${tx.type === 'sale' ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {tx.type === 'sale' ? `+₹${tx.amount.toFixed(2)}` : `-₹${tx.amount.toFixed(2)}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  {isSubmitting ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
