import React, { useState } from 'react';
import { 
  Tags, 
  TrendingUp, 
  Save, 
  Check, 
  Sparkles, 
  Percent, 
  Info,
  Search,
  SlidersHorizontal,
  Globe,
  RefreshCw,
  ExternalLink,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import { Product, MarketPriceAnalysis } from '../types';
import { MarketPriceModal } from './MarketPriceModal';
import { api } from '../api';

interface PricingModuleProps {
  products: Product[];
  onPricingUpdated: () => void;
  updateProductPricing: (id: string, markup_percent: number) => Promise<Product>;
}

export const PricingModule: React.FC<PricingModuleProps> = ({
  products,
  onPricingUpdated,
  updateProductPricing
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [localMarkups, setLocalMarkups] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Market Price Intelligence states
  const [activeRadarProduct, setActiveRadarProduct] = useState<Product | null>(null);
  const [marketCache, setMarketCache] = useState<Record<string, MarketPriceAnalysis>>({});
  const [isScanningBatch, setIsScanningBatch] = useState<boolean>(false);

  const filteredProducts = products.filter(p =>
    !searchQuery || 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleBatchScanMarket = async () => {
    setIsScanningBatch(true);
    setErrorMessage(null);
    try {
      const results = await api.batchDetectMarketPrices(filteredProducts.map(p => p.id));
      const cacheUpdate: Record<string, MarketPriceAnalysis> = {};
      results.forEach(res => {
        cacheUpdate[res.product_id] = res;
      });
      setMarketCache(prev => ({ ...prev, ...cacheUpdate }));
    } catch (err: any) {
      setErrorMessage(err.message || 'Batch market price scan failed');
    } finally {
      setIsScanningBatch(false);
    }
  };

  const getActiveMarkup = (product: Product) => {
    return localMarkups[product.id] !== undefined ? localMarkups[product.id] : product.markup_percent;
  };

  const handleMarkupChange = (productId: string, val: number) => {
    setLocalMarkups(prev => ({ ...prev, [productId]: Math.max(0, val) }));
  };

  const handleSavePricing = async (product: Product) => {
    const markup = getActiveMarkup(product);
    setSavingId(product.id);
    setErrorMessage(null);

    try {
      await updateProductPricing(product.id, markup);
      setSavedSuccessId(product.id);
      setTimeout(() => setSavedSuccessId(null), 2500);
      onPricingUpdated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update pricing');
    } finally {
      setSavingId(null);
    }
  };

  const applyBulkMarkup = async (percent: number) => {
    if (!confirm(`Apply +${percent}% markup across all ${products.length} products in inventory?`)) {
      return;
    }

    setSavingId('bulk');
    setErrorMessage(null);
    try {
      for (const p of products) {
        await updateProductPricing(p.id, percent);
      }
      setLocalMarkups({});
      onPricingUpdated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to apply bulk markup');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Tags className="w-5 h-5 text-emerald-600" />
            Pricing & Margin Controller
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Key rule: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">selling_price = average_cost * (1 + markup_percent / 100)</code> recalculated server-side.
          </p>
        </div>

        {/* Header Actions: Bulk Presets and Live Market Scan */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleBatchScanMarket}
            disabled={isScanningBatch || filteredProducts.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg shadow-2xs transition-all disabled:opacity-50"
            title="Scan live consumer market prices across Blinkit, Zepto, BigBasket, Amazon, DMart"
          >
            <Globe className={`w-3.5 h-3.5 ${isScanningBatch ? 'animate-spin' : ''}`} />
            {isScanningBatch ? 'Scanning Markets...' : 'Scan Live Market Radar'}
          </button>

          <span className="h-4 w-px bg-slate-200 hidden sm:block mx-1" />

          <span className="text-xs text-slate-500 font-medium">Quick Presets:</span>
          {[15, 20, 25, 30].map(pct => (
            <button
              key={pct}
              disabled={savingId === 'bulk'}
              onClick={() => applyBulkMarkup(pct)}
              className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              +{pct}% All
            </button>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
          {errorMessage}
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="pricing-search-input"
            type="text"
            placeholder="Search products to adjust pricing..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>
        <span className="text-xs text-slate-400">
          Showing {filteredProducts.length} items
        </span>
      </div>

      {/* Products Pricing Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 min-w-[220px]">Product / Category</th>
                <th className="py-3.5 px-3 w-32 bg-slate-100/50">Average Cost (Base)</th>
                <th className="py-3.5 px-3 min-w-[240px]">Markup Controller</th>
                <th className="py-3.5 px-3 min-w-[170px] bg-slate-50 text-slate-700">
                  <div className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Market Radar (Live)</span>
                  </div>
                </th>
                <th className="py-3.5 px-3 w-36 bg-emerald-50/50 text-emerald-900">
                  Computed Selling Price
                </th>
                <th className="py-3.5 px-3 w-28">Gross Margin %</th>
                <th className="py-3.5 px-3 w-28">Unit Profit</th>
                <th className="py-3.5 px-4 w-28 text-center">Save</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(product => {
                const markup = getActiveMarkup(product);
                const computedPrice = product.average_cost * (1 + markup / 100);
                const profit = computedPrice - product.average_cost;
                const marginPercent = computedPrice > 0 ? (profit / computedPrice) * 100 : 0;
                const isModified = markup !== product.markup_percent;
                const isSaving = savingId === product.id;
                const isSaved = savedSuccessId === product.id;

                return (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                        {product.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {product.category || 'General'} • Stock: {product.current_stock} {product.unit}
                      </div>
                    </td>

                    {/* Base Cost */}
                    <td className="py-3 px-3 bg-slate-100/30">
                      <div className="font-mono font-bold text-slate-800 text-xs">
                        ₹{product.average_cost.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">per {product.unit}</div>
                    </td>

                    {/* Markup controller */}
                    <td className="py-3 px-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="80"
                            step="1"
                            value={markup}
                            onChange={e => handleMarkupChange(product.id, parseFloat(e.target.value) || 0)}
                            className="w-32 accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                          />
                          <div className="flex items-center">
                            <input
                              type="number"
                              min="0"
                              max="300"
                              step="0.5"
                              value={markup}
                              onChange={e => handleMarkupChange(product.id, parseFloat(e.target.value) || 0)}
                              className="w-16 p-1 text-center font-mono font-bold text-xs bg-slate-50 border border-slate-200 rounded-md"
                            />
                            <span className="text-slate-400 text-xs ml-1">%</span>
                          </div>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex items-center gap-1">
                          {[10, 15, 20, 25, 30].map(pVal => (
                            <button
                              key={pVal}
                              onClick={() => handleMarkupChange(product.id, pVal)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                                markup === pVal
                                  ? 'bg-slate-800 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              +{pVal}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Market Radar Column */}
                    <td className="py-3 px-3">
                      {marketCache[product.id] ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              marketCache[product.id].price_position === 'below_market'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : marketCache[product.id].price_position === 'competitive'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              {marketCache[product.id].price_position === 'below_market'
                                ? 'Under-Priced'
                                : marketCache[product.id].price_position === 'competitive'
                                ? 'Competitive'
                                : 'Above Mkt'}
                            </span>
                            <span className="font-mono text-xs text-slate-800 font-bold">
                              ₹{marketCache[product.id].market_avg.toFixed(0)} avg
                            </span>
                          </div>
                          <button
                            onClick={() => setActiveRadarProduct(product)}
                            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 hover:underline"
                          >
                            View Radar & Insights →
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveRadarProduct(product)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg border border-slate-200 hover:border-emerald-200 transition-colors"
                          title="Detect real-time market price on Blinkit, Zepto, BigBasket, Amazon"
                        >
                          <Globe className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Check Market</span>
                        </button>
                      )}
                    </td>

                    {/* Computed Selling Price */}
                    <td className="py-3 px-3 bg-emerald-50/40">
                      <div className="font-mono font-bold text-emerald-800 text-sm">
                        ₹{computedPrice.toFixed(2)}
                      </div>
                      {isModified && (
                        <div className="text-[10px] text-amber-600 font-semibold mt-0.5">
                          Unsaved changes
                        </div>
                      )}
                    </td>

                    {/* Margin % */}
                    <td className="py-3 px-3 font-mono font-semibold text-xs text-slate-700">
                      {marginPercent.toFixed(1)}%
                    </td>

                    {/* Unit Profit */}
                    <td className="py-3 px-3 font-mono font-bold text-xs text-emerald-700">
                      +₹{profit.toFixed(2)}
                    </td>

                    {/* Save Button */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleSavePricing(product)}
                        disabled={isSaving || !isModified}
                        className={`p-2 rounded-lg font-bold text-xs flex items-center justify-center mx-auto transition-all ${
                          isSaved
                            ? 'bg-emerald-600 text-white'
                            : isModified
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : 'text-slate-300 cursor-not-allowed'
                        }`}
                        title={isModified ? 'Click to save recalculation' : 'Current price saved'}
                      >
                        {isSaved ? (
                          <Check className="w-4 h-4" />
                        ) : isSaving ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-Time Market Price Intelligence Modal */}
      <MarketPriceModal
        isOpen={!!activeRadarProduct}
        onClose={() => setActiveRadarProduct(null)}
        product={activeRadarProduct}
        onPriceUpdated={onPricingUpdated}
        updateProductPricing={updateProductPricing}
      />
    </div>
  );
};
