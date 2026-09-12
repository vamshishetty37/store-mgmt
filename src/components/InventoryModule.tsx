import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Boxes, 
  Calendar,
  Check,
  X,
  Sparkles,
  Globe
} from 'lucide-react';
import { Product } from '../types';
import { MarketPriceModal } from './MarketPriceModal';

interface InventoryModuleProps {
  products: Product[];
  onProductUpdated: () => void;
  addProduct: (data: Partial<Product>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<Product>;
  updateProductPricing?: (id: string, markup_percent: number) => Promise<Product>;
  onNavigateToPricing: () => void;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  products,
  onProductUpdated,
  addProduct,
  updateProduct,
  updateProductPricing,
  onNavigateToPricing
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedMarketProduct, setSelectedMarketProduct] = useState<Product | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Add / Edit
  const [formState, setFormState] = useState({
    name: '',
    unit: 'pcs',
    current_stock: 10,
    average_cost: 100,
    markup_percent: 20,
    reorder_threshold: 5,
    category: 'General',
    expiry_date: '',
    barcode: ''
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q));
      const isLow = p.current_stock <= (p.reorder_threshold ?? 5);
      const matchLow = !showLowStockOnly || isLow;
      return matchCat && matchQuery && matchLow;
    });
  }, [products, selectedCategory, searchQuery, showLowStockOnly]);

  // Valuation metrics
  const totalValuation = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.current_stock * p.average_cost), 0);
  }, [products]);

  const totalRetailPotential = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.current_stock * p.selling_price), 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => p.current_stock <= (p.reorder_threshold ?? 5)).length;
  }, [products]);

  const openAddModal = () => {
    setFormError(null);
    setFormState({
      name: '',
      unit: 'pcs',
      current_stock: 10,
      average_cost: 100,
      markup_percent: 20,
      reorder_threshold: 5,
      category: 'General',
      expiry_date: '',
      barcode: ''
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setFormError(null);
    setEditingProduct(prod);
    setFormState({
      name: prod.name,
      unit: prod.unit,
      current_stock: prod.current_stock,
      average_cost: prod.average_cost,
      markup_percent: prod.markup_percent,
      reorder_threshold: prod.reorder_threshold ?? 5,
      category: prod.category || 'General',
      expiry_date: prod.expiry_date || '',
      barcode: prod.barcode || ''
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formState.name.trim()) {
      setFormError('Product name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: formState.name.trim(),
          unit: formState.unit.trim(),
          current_stock: Number(formState.current_stock),
          average_cost: Number(formState.average_cost),
          markup_percent: Number(formState.markup_percent),
          reorder_threshold: Number(formState.reorder_threshold),
          category: formState.category.trim(),
          expiry_date: formState.expiry_date || null,
          barcode: formState.barcode?.trim() || undefined
        });
        setEditingProduct(null);
      } else {
        await addProduct({
          name: formState.name.trim(),
          unit: formState.unit.trim(),
          current_stock: Number(formState.current_stock),
          average_cost: Number(formState.average_cost),
          markup_percent: Number(formState.markup_percent),
          reorder_threshold: Number(formState.reorder_threshold),
          category: formState.category.trim(),
          expiry_date: formState.expiry_date || null,
          barcode: formState.barcode?.trim() || undefined
        });
        setIsAddModalOpen(false);
      }
      onProductUpdated();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Metric Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Catalog Items</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{products.length}</div>
            <span className="text-[11px] text-slate-400">Total active SKUs</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inventory Valuation</span>
            <div className="text-2xl font-black text-emerald-800 font-mono mt-0.5">₹{totalValuation.toLocaleString()}</div>
            <span className="text-[11px] text-slate-400">At weighted average cost</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Potential Sales Value</span>
            <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">₹{totalRetailPotential.toLocaleString()}</div>
            <span className="text-[11px] text-slate-400">At current selling prices</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Alerts</span>
            <div className="text-2xl font-black text-amber-700 mt-0.5">{lowStockCount}</div>
            <span className="text-[11px] text-slate-400">Below reorder threshold</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Category, Low Stock filter & Add Product */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="inventory-search-input"
              type="text"
              placeholder="Search by product name, barcode, or category..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              showLowStockOnly
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Low Stock Only</span>
          </button>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            id="add-product-btn"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 min-w-[220px]">Product / Category</th>
                <th className="py-3.5 px-3">Stock Level</th>
                <th className="py-3.5 px-3 min-w-[150px] bg-slate-100/50">
                  <span className="flex items-center gap-1 text-slate-800">
                    Weighted Avg Cost
                    <span className="text-[9px] font-normal lowercase text-slate-400">(running)</span>
                  </span>
                </th>
                <th className="py-3.5 px-3">Markup</th>
                <th className="py-3.5 px-3 bg-emerald-50/50 text-emerald-900">
                  Selling Price
                </th>
                <th className="py-3.5 px-3">Unit Profit</th>
                <th className="py-3.5 px-3">Reorder Alert</th>
                <th className="py-3.5 px-3">Expiry</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(p => {
                const isOutOfStock = p.current_stock <= 0;
                const threshold = p.reorder_threshold ?? 5;
                const isLowStock = !isOutOfStock && p.current_stock <= threshold;
                const profitPerUnit = p.selling_price - p.average_cost;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                        {p.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] uppercase font-semibold text-slate-400">
                          {p.category || 'General'}
                        </span>
                        {p.barcode && (
                          <span className="text-[10px] font-mono text-slate-400">
                            #{p.barcode}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-slate-800">
                          {p.current_stock}
                        </span>
                        <span className="text-[11px] text-slate-500">{p.unit}</span>
                      </div>
                      {isOutOfStock ? (
                        <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                          Out of stock
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                          Low stock
                        </span>
                      ) : (
                        <span className="inline-block mt-0.5 text-[9px] font-medium text-emerald-600">
                          Healthy
                        </span>
                      )}
                    </td>

                    {/* Running Weighted Avg Cost */}
                    <td className="py-3 px-3 bg-slate-100/30">
                      <div className="font-mono font-bold text-slate-900 text-xs">
                        ₹{p.average_cost.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Valuation: ₹{(p.current_stock * p.average_cost).toFixed(0)}
                      </div>
                    </td>

                    {/* Markup */}
                    <td className="py-3 px-3 font-mono font-medium text-slate-700">
                      +{p.markup_percent}%
                    </td>

                    {/* Selling Price */}
                    <td className="py-3 px-3 bg-emerald-50/40">
                      <div className="font-mono font-bold text-emerald-800 text-sm">
                        ₹{p.selling_price.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-emerald-600">
                        Server-computed
                      </div>
                    </td>

                    {/* Profit Margin per unit */}
                    <td className="py-3 px-3">
                      <span className="font-mono font-semibold text-xs text-slate-800">
                        +₹{profitPerUnit.toFixed(2)}
                      </span>
                    </td>

                    {/* Reorder Threshold */}
                    <td className="py-3 px-3 font-mono text-slate-500">
                      ≤ {p.reorder_threshold ?? 5} {p.unit}
                    </td>

                    {/* Expiry */}
                    <td className="py-3 px-3 text-[11px] text-slate-500">
                      {p.expiry_date ? (
                        <span className="font-mono">{p.expiry_date}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedMarketProduct(p)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                          title="Detect real-time market prices across Blinkit, Zepto, BigBasket, Amazon"
                        >
                          <Globe className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                          title="Edit product details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingProduct ? 'Edit Catalog Product' : 'Add New Catalog Product'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Stock and weighted average cost calculate automatically during purchases & sales.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. India Gate Basmati Rice 5kg"
                  value={formState.name}
                  onChange={e => setFormState({ ...formState, name: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Grains, Dairy, Oils"
                    value={formState.category}
                    onChange={e => setFormState({ ...formState, category: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    placeholder="pcs, kg, bag, pouch, box"
                    value={formState.unit}
                    onChange={e => setFormState({ ...formState, unit: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formState.current_stock}
                    onChange={e => setFormState({ ...formState, current_stock: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Average Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formState.average_cost}
                    onChange={e => setFormState({ ...formState, average_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Markup %</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formState.markup_percent}
                    onChange={e => setFormState({ ...formState, markup_percent: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Live Preview of Calculated Selling Price */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                <span className="text-emerald-900 font-medium">Calculated Selling Price:</span>
                <span className="font-mono font-bold text-emerald-800 text-base">
                  ₹{(formState.average_cost * (1 + (formState.markup_percent || 0) / 100)).toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={formState.reorder_threshold}
                    onChange={e => setFormState({ ...formState, reorder_threshold: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={formState.expiry_date}
                    onChange={e => setFormState({ ...formState, expiry_date: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  {isSubmitting ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add to Inventory')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real-Time Market Price Intelligence Modal */}
      <MarketPriceModal
        isOpen={!!selectedMarketProduct}
        onClose={() => setSelectedMarketProduct(null)}
        product={selectedMarketProduct}
        onPriceUpdated={onProductUpdated}
        updateProductPricing={updateProductPricing}
      />
    </div>
  );
};
