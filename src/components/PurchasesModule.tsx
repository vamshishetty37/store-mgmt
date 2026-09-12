import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Upload, 
  Camera, 
  FileText, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  Info, 
  ChevronRight, 
  History, 
  DollarSign, 
  Receipt,
  FileCheck2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { 
  Distributor, 
  Product, 
  Purchase, 
  GstTreatment, 
  PriceBasis, 
  ScanDraftItem 
} from '../types';
import { computeLandedCostPerUnit } from '../utils/costCalculation';

interface PurchasesModuleProps {
  distributors: Distributor[];
  products: Product[];
  purchases: Purchase[];
  onPurchaseCreated: () => void;
  createPurchase: (data: any) => Promise<Purchase>;
  scanInvoice: (payload: any) => Promise<any>;
  getSampleInvoices: () => Promise<any[]>;
}

export const PurchasesModule: React.FC<PurchasesModuleProps> = ({
  distributors,
  products,
  purchases,
  onPurchaseCreated,
  createPurchase,
  scanInvoice,
  getSampleInvoices
}) => {
  const [subTab, setSubTab] = useState<'scanner' | 'manual' | 'history'>('scanner');
  
  // Scanner state
  const [sampleInvoices, setSampleInvoices] = useState<any[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  
  // Draft Form State
  const [distributorId, setDistributorId] = useState<string>(distributors[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [gstTreatment, setGstTreatment] = useState<GstTreatment>('include_as_cost');
  const [draftItems, setDraftItems] = useState<ScanDraftItem[]>([]);
  const [confidenceNote, setConfidenceNote] = useState<string | null>(null);
  const [isSavingPurchase, setIsSavingPurchase] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Raw text or image upload
  const [rawText, setRawText] = useState('');
  const [selectedImageName, setSelectedImageName] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  // Selected Purchase for detail modal
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);

  useEffect(() => {
    getSampleInvoices().then(samples => {
      setSampleInvoices(samples);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (distributors.length > 0 && !distributorId) {
      setDistributorId(distributors[0].id);
    }
  }, [distributors]);

  // Recalculate landed costs for all draft items whenever gstTreatment changes
  useEffect(() => {
    setDraftItems(prev => prev.map(item => ({
      ...item,
      computed_landed_cost_per_unit: computeLandedCostPerUnit({
        listed_price: item.listed_price,
        quantity: item.quantity,
        price_basis: item.price_basis,
        gst_included: item.gst_included,
        gst_rate_percent: item.gst_rate_percent,
        gst_treatment: gstTreatment
      })
    })));
  }, [gstTreatment]);

  // Handle Scan from Preset
  const handleScanSample = async (sampleId: string) => {
    setIsScanning(true);
    setScanError(null);
    setSaveSuccessMessage(null);
    setSelectedSampleId(sampleId);

    try {
      const result = await scanInvoice({
        sample_id: sampleId,
        gst_treatment: gstTreatment
      });

      // Match distributor
      if (result.distributor_name) {
        const matchedDist = distributors.find(d => 
          d.name.toLowerCase().includes(result.distributor_name.toLowerCase()) ||
          result.distributor_name.toLowerCase().includes(d.name.toLowerCase())
        );
        if (matchedDist) {
          setDistributorId(matchedDist.id);
        }
      }

      setInvoiceNumber(result.invoice_number || `INV-${Date.now().toString().slice(-4)}`);
      setPurchaseDate(result.purchase_date || new Date().toISOString().split('T')[0]);
      setGstTreatment(result.gst_treatment || gstTreatment);
      setDraftItems(result.items);
      setConfidenceNote(result.confidence_notes || null);
    } catch (err: any) {
      setScanError(err.message || 'Failed to scan invoice');
    } finally {
      setIsScanning(false);
    }
  };

  // Handle Image Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImageName(file.name);
    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = reader.result as string;
      setImageBase64(b64);
      runAiScanOnPayload({ image_base64: b64, mime_type: file.type });
    };
    reader.readAsDataURL(file);
  };

  const runAiScanOnPayload = async (payload: any) => {
    setIsScanning(true);
    setScanError(null);
    setSaveSuccessMessage(null);

    try {
      const result = await scanInvoice({
        ...payload,
        gst_treatment: gstTreatment
      });

      if (result.distributor_name) {
        const matchedDist = distributors.find(d => 
          d.name.toLowerCase().includes(result.distributor_name.toLowerCase()) ||
          result.distributor_name.toLowerCase().includes(d.name.toLowerCase())
        );
        if (matchedDist) setDistributorId(matchedDist.id);
      }

      setInvoiceNumber(result.invoice_number || `INV-${Date.now().toString().slice(-4)}`);
      setPurchaseDate(result.purchase_date || new Date().toISOString().split('T')[0]);
      setDraftItems(result.items || []);
      setConfidenceNote(result.confidence_notes || 'Extracted via Gemini Vision AI');
    } catch (err: any) {
      setScanError(err.message || 'AI Invoice extraction failed');
    } finally {
      setIsScanning(false);
    }
  };

  // Update a single item in draft table
  const updateDraftItem = (index: number, field: keyof ScanDraftItem, value: any) => {
    setDraftItems(prev => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };

      // Recompute landed cost per unit
      item.computed_landed_cost_per_unit = computeLandedCostPerUnit({
        listed_price: Number(item.listed_price) || 0,
        quantity: Number(item.quantity) || 1,
        price_basis: item.price_basis,
        gst_included: Boolean(item.gst_included),
        gst_rate_percent: Number(item.gst_rate_percent) || 0,
        gst_treatment: gstTreatment
      });

      next[index] = item;
      return next;
    });
  };

  const addDraftRow = () => {
    const newItem: ScanDraftItem = {
      temp_id: `draft-new-${Date.now()}`,
      product_name: '',
      quantity: 1,
      unit: 'pcs',
      listed_price: 100,
      price_basis: 'per_unit',
      gst_included: true,
      gst_rate_percent: 5,
      matched_product_id: null,
      computed_landed_cost_per_unit: 100
    };
    setDraftItems(prev => [...prev, newItem]);
  };

  const removeDraftRow = (index: number) => {
    setDraftItems(prev => prev.filter((_, i) => i !== index));
  };

  // Compute total invoice sum
  const draftInvoiceTotal = draftItems.reduce((sum, item) => {
    const lineVal = item.price_basis === 'line_total' 
      ? item.listed_price 
      : (item.listed_price * item.quantity);
    return sum + lineVal;
  }, 0);

  // Save Purchase to database & update product catalog
  const handleSavePurchase = async () => {
    setScanError(null);
    if (!distributorId) {
      setScanError('Please select a distributor.');
      return;
    }
    if (draftItems.length === 0) {
      setScanError('Please add at least one line item.');
      return;
    }

    setIsSavingPurchase(true);
    try {
      await createPurchase({
        distributor_id: distributorId,
        invoice_number: invoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
        purchase_date: purchaseDate,
        gst_treatment: gstTreatment,
        items: draftItems.map(item => ({
          product_id: item.matched_product_id || null,
          product_name: item.product_name || 'Unnamed Item',
          quantity: Number(item.quantity) || 1,
          unit: item.unit || 'pcs',
          listed_price: Number(item.listed_price) || 0,
          price_basis: item.price_basis,
          gst_included: item.gst_included,
          gst_rate_percent: Number(item.gst_rate_percent) || 0
        }))
      });

      setSaveSuccessMessage(
        `Purchase saved successfully! Products were restocked and running weighted average costs were updated in the catalog.`
      );
      setDraftItems([]);
      setInvoiceNumber('');
      onPurchaseCreated();
    } catch (err: any) {
      setScanError(err.message || 'Failed to save purchase');
    } finally {
      setIsSavingPurchase(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header and Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            Purchases & Landed Cost Engine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Extract supplier bills with Gemini AI, compute exact landed cost with GST toggles, and update weighted average inventory.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start">
          <button
            onClick={() => setSubTab('scanner')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              subTab === 'scanner'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            AI Scanner & Review
          </button>

          <button
            onClick={() => {
              setSubTab('manual');
              if (draftItems.length === 0) addDraftRow();
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              subTab === 'manual'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            Manual Bill Entry
          </button>

          <button
            onClick={() => setSubTab('history')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              subTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-slate-600" />
            Past Invoices ({purchases.length})
          </button>
        </div>
      </div>

      {/* Notifications */}
      {scanError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-semibold text-sm">Purchase Engine Alert</p>
            <p className="mt-0.5">{scanError}</p>
          </div>
          <button onClick={() => setScanError(null)} className="text-xs font-semibold text-rose-600">
            Dismiss
          </button>
        </div>
      )}

      {saveSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 shadow-xs">
          <FileCheck2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-semibold text-sm">Invoice Saved & Stock Restocked!</p>
            <p className="mt-0.5">{saveSuccessMessage}</p>
          </div>
          <button onClick={() => setSaveSuccessMessage(null)} className="text-xs font-semibold text-emerald-600">
            Dismiss
          </button>
        </div>
      )}

      {/* SUBTAB: SCANNER & DRAFT REVIEW */}
      {subTab === 'scanner' && (
        <div className="space-y-6">
          {/* Preset Sample Invoices Banner */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Instant One-Click Test Invoices
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Test the scanner immediately with realistic supplier invoices
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {sampleInvoices.map(s => (
                <button
                  key={s.id}
                  id={`sample-btn-${s.id}`}
                  onClick={() => handleScanSample(s.id)}
                  disabled={isScanning}
                  className={`p-3 text-left rounded-xl border transition-all ${
                    selectedSampleId === s.id
                      ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-100'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider">
                      {s.invoice_number}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {s.item_count} items
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-xs mt-1 truncate">
                    {s.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    Supplier: {s.distributor_name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Upload or Capture invoice photo */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-600" />
              Upload Invoice Photo or Document
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Take a photo or upload an invoice (JPEG/PNG/PDF). Gemini 3.8 Flash will read the distributor, invoice date, line items, listed rate, and tax values.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* File input */}
              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors flex flex-col items-center justify-center">
                <Upload className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-700">
                  {selectedImageName || 'Select Invoice Image or Document'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Drag and drop or click to browse
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Text Input / Quick paste */}
              <div className="flex flex-col">
                <textarea
                  placeholder="Or paste invoice text directly here..."
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  rows={3}
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden resize-none"
                />
                <button
                  onClick={() => runAiScanOnPayload({ raw_text: rawText })}
                  disabled={!rawText.trim() || isScanning}
                  className="mt-2 py-1.5 px-3 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 text-white text-xs font-semibold rounded-lg transition-colors self-end"
                >
                  {isScanning ? 'Extracting with AI...' : 'Scan Pasted Text'}
                </button>
              </div>
            </div>

            {isScanning && (
              <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-3 text-teal-800 text-xs">
                <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <span className="font-semibold">
                  Gemini AI is parsing the invoice line items, pricing, and GST details...
                </span>
              </div>
            )}
          </div>

          {/* DRAFT REVIEW SECTION */}
          {draftItems.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Draft Header & GST Treatment Toggle */}
              <div className="p-5 border-b border-slate-200 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">
                        Review & Edit Scanned Draft Items
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                        {draftItems.length} items detected
                      </span>
                    </div>
                    {confidenceNote && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-teal-600" />
                        {confidenceNote}
                      </p>
                    )}
                  </div>

                  {/* KEY SPECIFICATION RULE: GST Treatment Toggle */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      GST Treatment:
                    </span>

                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                      <button
                        type="button"
                        id="gst-treatment-include"
                        onClick={() => setGstTreatment('include_as_cost')}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                          gstTreatment === 'include_as_cost'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        include_as_cost
                      </button>
                      <button
                        type="button"
                        id="gst-treatment-exclude"
                        onClick={() => setGstTreatment('exclude_as_cost')}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                          gstTreatment === 'exclude_as_cost'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        exclude_as_cost (ITC Claimable)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Explanation of the active GST Treatment */}
                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-200">
                  {gstTreatment === 'include_as_cost' ? (
                    <p>
                      <strong className="text-emerald-800">Include As Cost:</strong> GST paid is treated as part of your purchase cost. If GST is not included in the listed rate, it is automatically added on top to compute the landed cost per unit.
                    </p>
                  ) : (
                    <p>
                      <strong className="text-indigo-800">Exclude As Cost (Input Tax Credit):</strong> You will claim GST refund from the government. If the listed rate contains GST, the tax portion is stripped out so landed inventory cost reflects true net expense.
                    </p>
                  )}
                </div>

                {/* Supplier & Invoice metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Distributor / Supplier *
                    </label>
                    <select
                      id="purchase-distributor-select"
                      value={distributorId}
                      onChange={e => setDistributorId(e.target.value)}
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      {distributors.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Invoice Number
                    </label>
                    <input
                      id="purchase-invoice-num"
                      type="text"
                      placeholder="e.g. INV-9821"
                      value={invoiceNumber}
                      onChange={e => setInvoiceNumber(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Purchase Date
                    </label>
                    <input
                      id="purchase-date"
                      type="date"
                      value={purchaseDate}
                      onChange={e => setPurchaseDate(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4 min-w-[200px]">Product / Item Name</th>
                      <th className="py-3 px-3 min-w-[170px]">Catalog Match</th>
                      <th className="py-3 px-2 w-20">Qty</th>
                      <th className="py-3 px-2 w-20">Unit</th>
                      <th className="py-3 px-3 w-28">Listed Price</th>
                      <th className="py-3 px-2 w-28">Basis</th>
                      <th className="py-3 px-2 w-24">GST %</th>
                      <th className="py-3 px-2 w-24 text-center">GST Incl?</th>
                      <th className="py-3 px-4 min-w-[150px] bg-emerald-50/50 text-emerald-900">
                        Computed Landed Cost
                      </th>
                      <th className="py-3 px-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {draftItems.map((item, idx) => (
                      <tr key={item.temp_id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Name */}
                        <td className="py-2.5 px-4">
                          <input
                            type="text"
                            value={item.product_name}
                            onChange={e => updateDraftItem(idx, 'product_name', e.target.value)}
                            placeholder="Product name"
                            className="w-full text-xs font-medium bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white p-1 rounded-sm focus:outline-hidden"
                          />
                        </td>

                        {/* Catalog Match */}
                        <td className="py-2.5 px-3">
                          <select
                            value={item.matched_product_id || ''}
                            onChange={e => updateDraftItem(idx, 'matched_product_id', e.target.value || null)}
                            className={`w-full text-xs p-1.5 rounded-md border ${
                              item.matched_product_id
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
                                : 'bg-slate-50 border-slate-200 text-slate-500'
                            }`}
                          >
                            <option value="">+ Create as New Product</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Stock: {p.current_stock} {p.unit})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Qty */}
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={item.quantity}
                            onChange={e => updateDraftItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                            className="w-16 p-1 text-xs font-mono text-center bg-slate-50 border border-slate-200 rounded-md"
                          />
                        </td>

                        {/* Unit */}
                        <td className="py-2.5 px-2">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={e => updateDraftItem(idx, 'unit', e.target.value)}
                            className="w-16 p-1 text-xs text-center bg-slate-50 border border-slate-200 rounded-md"
                          />
                        </td>

                        {/* Listed Price */}
                        <td className="py-2.5 px-3">
                          <div className="relative">
                            <span className="absolute left-2 top-1.5 text-slate-400 text-xs">₹</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.listed_price}
                              onChange={e => updateDraftItem(idx, 'listed_price', parseFloat(e.target.value) || 0)}
                              className="w-24 pl-5 pr-1 py-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md"
                            />
                          </div>
                        </td>

                        {/* Price Basis */}
                        <td className="py-2.5 px-2">
                          <select
                            value={item.price_basis}
                            onChange={e => updateDraftItem(idx, 'price_basis', e.target.value as PriceBasis)}
                            className="text-[11px] p-1 bg-slate-50 border border-slate-200 rounded-md"
                          >
                            <option value="per_unit">per_unit</option>
                            <option value="line_total">line_total</option>
                          </select>
                        </td>

                        {/* GST % */}
                        <td className="py-2.5 px-2">
                          <select
                            value={item.gst_rate_percent}
                            onChange={e => updateDraftItem(idx, 'gst_rate_percent', parseFloat(e.target.value) || 0)}
                            className="text-[11px] p-1 bg-slate-50 border border-slate-200 rounded-md font-mono"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>

                        {/* GST Included */}
                        <td className="py-2.5 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={item.gst_included}
                            onChange={e => updateDraftItem(idx, 'gst_included', e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
                          />
                        </td>

                        {/* Computed Landed Cost */}
                        <td className="py-2.5 px-4 bg-emerald-50/50">
                          <div className="font-mono font-bold text-emerald-800 text-sm">
                            ₹{item.computed_landed_cost_per_unit.toFixed(2)}
                            <span className="text-[10px] text-emerald-600 font-normal ml-1">
                              /{item.unit}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.price_basis === 'line_total' ? 'Normalized from total' : 'Per unit base'}
                          </div>
                        </td>

                        {/* Remove */}
                        <td className="py-2.5 px-2">
                          <button
                            onClick={() => removeDraftRow(idx)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer & Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={addDraftRow}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Another Item
                  </button>

                  <span className="text-xs text-slate-500">
                    Billed Total: <strong className="font-mono text-slate-900">₹{draftInvoiceTotal.toFixed(2)}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDraftItems([])}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Clear Draft
                  </button>
                  <button
                    id="save-purchase-btn"
                    onClick={handleSavePurchase}
                    disabled={isSavingPurchase}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 disabled:bg-slate-300"
                  >
                    <Check className="w-4 h-4" />
                    {isSavingPurchase ? 'Saving to Database...' : 'Save Purchase & Update Inventory'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB: MANUAL PURCHASE ENTRY */}
      {subTab === 'manual' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Manual Purchase Invoice Entry</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter distributor bills manually. The engine will calculate true landed costs and push weighted average pricing to your catalog.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Distributor *</label>
              <select
                value={distributorId}
                onChange={e => setDistributorId(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                {distributors.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Number</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-1002"
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GST Treatment</label>
              <select
                value={gstTreatment}
                onChange={e => setGstTreatment(e.target.value as GstTreatment)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
              >
                <option value="include_as_cost">include_as_cost (Tax in cost)</option>
                <option value="exclude_as_cost">exclude_as_cost (ITC claimable)</option>
              </select>
            </div>
          </div>

          {/* Quick Item Entry List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Line Items</h4>
            {draftItems.map((item, idx) => (
              <div key={item.temp_id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    placeholder="Product name"
                    value={item.product_name}
                    onChange={e => updateDraftItem(idx, 'product_name', e.target.value)}
                    className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-md font-medium"
                  />
                </div>
                <div className="sm:col-span-2">
                  <select
                    value={item.matched_product_id || ''}
                    onChange={e => updateDraftItem(idx, 'matched_product_id', e.target.value || null)}
                    className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-md"
                  >
                    <option value="">New Product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={e => updateDraftItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                    className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-md text-center font-mono"
                    placeholder="Qty"
                  />
                </div>
                <div className="sm:col-span-1">
                  <input
                    type="text"
                    value={item.unit}
                    onChange={e => updateDraftItem(idx, 'unit', e.target.value)}
                    className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-md text-center"
                    placeholder="Unit"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    value={item.listed_price}
                    onChange={e => updateDraftItem(idx, 'listed_price', parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-md font-mono"
                    placeholder="Price"
                  />
                </div>
                <div className="sm:col-span-1 text-center font-mono font-bold text-xs text-emerald-700">
                  ₹{item.computed_landed_cost_per_unit.toFixed(2)}
                </div>
                <div className="sm:col-span-1 text-right">
                  <button
                    onClick={() => removeDraftRow(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={addDraftRow}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <Plus className="w-3.5 h-3.5" /> Add Row
            </button>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={handleSavePurchase}
              disabled={isSavingPurchase || draftItems.length === 0}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              {isSavingPurchase ? 'Saving...' : 'Save & Restock Inventory'}
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB: PAST INVOICES ARCHIVE */}
      {subTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Past Purchase Invoices Archive</h3>
              <p className="text-xs text-slate-500">
                Full historical ledger of purchases with immutable landed cost per unit snapshots.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Distributor</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">GST Treatment Snapshot</th>
                  <th className="py-3 px-4">Items Count</th>
                  <th className="py-3 px-4 text-right">Invoice Total</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {p.invoice_number || p.id}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {p.distributor_name}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {p.purchase_date}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        p.gst_treatment === 'include_as_cost'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {p.gst_treatment}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {p.items?.length || 0} items
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{p.invoice_total.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setViewingPurchase(p)}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                      >
                        Inspect Line Items
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Purchase Detail Modal */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  Invoice Snapshot
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {viewingPurchase.invoice_number || viewingPurchase.id}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Supplier: {viewingPurchase.distributor_name} • Date: {viewingPurchase.purchase_date}
                </p>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                viewingPurchase.gst_treatment === 'include_as_cost'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}>
                Treatment: {viewingPurchase.gst_treatment}
              </span>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-2 text-center">Qty</th>
                    <th className="py-2.5 px-2">Unit</th>
                    <th className="py-2.5 px-3">Listed Price</th>
                    <th className="py-2.5 px-2">Basis</th>
                    <th className="py-2.5 px-2">GST %</th>
                    <th className="py-2.5 px-3 text-right bg-emerald-50 text-emerald-900">
                      Stored Landed Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {viewingPurchase.items?.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {item.product_name}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-2 text-slate-500">
                        {item.unit}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        ₹{item.listed_price.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2 text-[11px] text-slate-500">
                        {item.price_basis}
                      </td>
                      <td className="py-2.5 px-2 font-mono">
                        {item.gst_rate_percent}% {item.gst_included ? '(incl)' : ''}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 bg-emerald-50/50">
                        ₹{(item.computed_landed_cost_per_unit || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Total Billed:</span>
                <span className="font-mono font-bold text-slate-900 text-base">
                  ₹{viewingPurchase.invoice_total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingPurchase(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
