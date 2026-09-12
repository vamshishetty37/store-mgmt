import React, { useState } from 'react';
import { Truck, Plus, Phone, FileText, X, Check } from 'lucide-react';
import { Distributor } from '../types';

interface DistributorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  distributors: Distributor[];
  onAddDistributor: (data: { name: string; phone?: string; notes?: string }) => Promise<Distributor>;
}

export const DistributorsModal: React.FC<DistributorsModalProps> = ({
  isOpen,
  onClose,
  distributors,
  onAddDistributor
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Distributor name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onAddDistributor({ name, phone, notes });
      setName('');
      setPhone('');
      setNotes('');
      setIsAdding(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add distributor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Supplier & Distributor Directory
              </h3>
              <p className="text-xs text-slate-500">
                Registered suppliers linked to purchase invoices
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Add Button / Form Toggle */}
          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Register New Distributor
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-slate-800">New Distributor Details</h4>
              {errorMsg && (
                <p className="text-xs text-rose-600">{errorMsg}</p>
              )}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Company / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Agro Supplies"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+91 98860 12345"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Notes / Terms</label>
                <input
                  type="text"
                  placeholder="e.g. Delivers every Monday, net 15 terms"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs"
                >
                  {isSubmitting ? 'Saving...' : 'Save Distributor'}
                </button>
              </div>
            </form>
          )}

          {/* Distributors List */}
          <div className="space-y-2.5">
            {distributors.map(d => (
              <div
                key={d.id}
                className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{d.name}</h4>
                  {d.phone && (
                    <p className="text-slate-600 flex items-center gap-1.5 mt-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">{d.phone}</span>
                    </p>
                  )}
                  {d.notes && (
                    <p className="text-slate-500 mt-1 italic">
                      "{d.notes}"
                    </p>
                  )}
                </div>

                <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded">
                  {d.id}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
