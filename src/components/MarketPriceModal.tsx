import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw, 
  X, 
  ArrowRight,
  Store,
  ShieldAlert,
  Percent,
  Search,
  Sliders,
  Check
} from 'lucide-react';
import { Product, MarketPriceAnalysis } from '../types';
import { api } from '../api';

interface MarketPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onPriceUpdated?: () => void;
  updateProductPricing?: (id: string, markup_percent: number) => Promise<Product>;
}

export const MarketPriceModal: React.FC<MarketPriceModalProps> = ({
  isOpen,
  onClose,
  product,
  onPriceUpdated,
  updateProductPricing
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<MarketPriceAnalysis | null>(null);
  const [customMarkup, setCustomMarkup] = useState<number>(20);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const fetchAnalysis = async (prod: Product) => {
    setLoading(true);
    setError(null);
    setAppliedSuccess(false);
    try {
      const data = await api.detectMarketPrice({
        product_id: prod.id,
        product_name: prod.name,
        unit: prod.unit,
        category: prod.category,
        average_cost: prod.average_cost,
        current_selling_price: prod.selling_price
      });
      setAnalysis(data);
      setCustomMarkup(data.recommended_markup_percent);
    } catch (err: any) {
      console.error('Market price detection failed:', err);
      setError(err.message || 'Failed to detect real-time market prices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && product) {
      setAnalysis(null);
      fetchAnalysis(product);
    }
  }, [isOpen, product?.id]);

  if (!isOpen || !product) return null;

  const handleApplyMarkup = async (markup: number) => {
    if (!updateProductPricing) return;
    setIsApplying(true);
    try {
      await updateProductPricing(product.id, markup);
      setAppliedSuccess(true);
      if (onPriceUpdated) onPriceUpdated();
      setTimeout(() => {
        setAppliedSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update price');
    } finally {
      setIsApplying(false);
    }
  };

  // Helper calculation for custom markup
  const customSellingPrice = product.average_cost * (1 + customMarkup / 100);

  const getPositionBadge = (pos?: string) => {
    switch (pos) {
      case 'below_market':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
            Under-Priced (Margin Opportunity)
          </span>
        );
      case 'competitive':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Competitively Positioned
          </span>
        );
      case 'above_market':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Above Market Average
          </span>
        );
      case 'premium':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
            Premium / Above Printed MRP
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Globe className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Real-Time Market Price Radar
              </span>
              {analysis?.is_live_search && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Google Search Grounded
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              {product.name}
            </h3>
            <p className="text-xs text-slate-300">
              Unit: <span className="font-semibold text-white">{product.unit}</span> • Category: <span className="font-semibold text-white">{product.category || 'General'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="relative">
                <div className="w-12 h-12 border-3 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                <Globe className="w-5 h-5 text-emerald-600 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Scanning Live Retail Markets...</h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Querying live prices across Blinkit, Zepto, BigBasket, Amazon, and regional supermarket averages for "{product.name}".
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4" />
                Unable to complete live market scan
              </div>
              <p className="text-xs text-rose-600">{error}</p>
              <button
                onClick={() => fetchAnalysis(product)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Scan
              </button>
            </div>
          ) : analysis ? (
            <>
              {/* Benchmark Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">Your Cost</div>
                  <div className="text-base font-mono font-bold text-slate-800 mt-0.5">
                    ₹{product.average_cost.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400">Landed Avg</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">Your Price</div>
                  <div className="text-base font-mono font-bold text-slate-900 mt-0.5">
                    ₹{product.selling_price.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    +{product.markup_percent}% markup
                  </div>
                </div>

                <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-100">
                  <div className="text-[10px] font-semibold text-sky-700 uppercase">Market Average</div>
                  <div className="text-base font-mono font-bold text-sky-900 mt-0.5">
                    ₹{analysis.market_avg.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-sky-600">
                    Range: ₹{analysis.market_low} - ₹{analysis.market_high}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-[10px] font-semibold text-emerald-800 uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    AI Recommended
                  </div>
                  <div className="text-base font-mono font-bold text-emerald-900 mt-0.5">
                    ₹{analysis.recommended_selling_price.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold">
                    +{analysis.recommended_markup_percent}% markup
                  </div>
                </div>
              </div>

              {/* Status & Market Dynamics Summary */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Market Intelligence Summary
                  </span>
                  {getPositionBadge(analysis.price_position)}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {analysis.summary}
                </p>
              </div>

              {/* Visual Price Range Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span>Market Lowest: <strong className="font-mono text-slate-900">₹{analysis.market_low.toFixed(2)}</strong></span>
                  <span>Market Average: <strong className="font-mono text-slate-900">₹{analysis.market_avg.toFixed(2)}</strong></span>
                  <span>Printed MRP: <strong className="font-mono text-slate-900">₹{analysis.market_high.toFixed(2)}</strong></span>
                </div>

                {/* Range Bar */}
                <div className="relative h-3 bg-slate-200 rounded-full overflow-visible">
                  {/* Safe margin zone */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-200 via-teal-200 to-sky-200 rounded-full" />
                  
                  {/* Marker for Current Store Price */}
                  {(() => {
                    const span = Math.max(1, analysis.market_high - analysis.market_low);
                    const pct = Math.min(100, Math.max(0, ((product.selling_price - analysis.market_low) / span) * 100));
                    return (
                      <div 
                        className="absolute -top-1.5 -ml-2.5 flex flex-col items-center" 
                        style={{ left: `${pct}%` }}
                        title={`Your Store: ₹${product.selling_price.toFixed(2)}`}
                      >
                        <div className="w-5 h-5 bg-slate-900 border-2 border-white rounded-full shadow-md flex items-center justify-center">
                          <Store className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Marker for Recommended Price */}
                  {(() => {
                    const span = Math.max(1, analysis.market_high - analysis.market_low);
                    const pct = Math.min(100, Math.max(0, ((analysis.recommended_selling_price - analysis.market_low) / span) * 100));
                    return (
                      <div 
                        className="absolute -top-1.5 -ml-2.5 flex flex-col items-center" 
                        style={{ left: `${pct}%` }}
                        title={`Recommended: ₹${analysis.recommended_selling_price.toFixed(2)}`}
                      >
                        <div className="w-5 h-5 bg-emerald-600 border-2 border-white rounded-full shadow-md flex items-center justify-center">
                          <Sparkles className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-900" /> Your Current Price (₹{product.selling_price.toFixed(2)})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" /> Recommended (₹{analysis.recommended_selling_price.toFixed(2)})
                  </span>
                </div>
              </div>

              {/* Detected Competitors Breakdown */}
              {analysis.competitors && analysis.competitors.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Detected Platform Benchmarks</span>
                    <span className="text-[10px] text-slate-400 font-normal">Real-time sampling</span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                    {analysis.competitors.map((comp, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <div>
                            <span className="font-semibold text-slate-800">{comp.source}</span>
                            {comp.unit_detail && (
                              <span className="text-slate-400 text-[11px] ml-1.5">({comp.unit_detail})</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            ₹{comp.price.toFixed(2)}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            comp.price < product.selling_price
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {comp.price < product.selling_price ? 'Lower than you' : 'Higher than you'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Grounding Sources */}
              {analysis.grounding_sources && analysis.grounding_sources.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-slate-400" />
                    Web Grounding Sources ({analysis.grounding_sources.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.grounding_sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 rounded-lg shadow-2xs transition-colors"
                      >
                        <span className="truncate max-w-[200px]">{src.title}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions / Price Adoption Bar */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Apply Price To Store
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => handleApplyMarkup(analysis.recommended_markup_percent)}
                    disabled={isApplying}
                    className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex flex-col items-center justify-center gap-1 shadow-sm transition-all"
                  >
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Adopt AI Recommended
                    </span>
                    <span className="font-mono text-sm font-bold">
                      ₹{analysis.recommended_selling_price.toFixed(2)} (+{analysis.recommended_markup_percent}%)
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      const markup = ((analysis.market_avg - product.average_cost) / product.average_cost) * 100;
                      handleApplyMarkup(Number(Math.max(0, markup).toFixed(1)));
                    }}
                    disabled={isApplying}
                    className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex flex-col items-center justify-center gap-1 transition-colors"
                  >
                    <span>Match Market Average</span>
                    <span className="font-mono text-sm font-bold">
                      ₹{analysis.market_avg.toFixed(2)}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      const markup = ((analysis.market_low - product.average_cost) / product.average_cost) * 100;
                      handleApplyMarkup(Number(Math.max(0, markup).toFixed(1)));
                    }}
                    disabled={isApplying}
                    className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex flex-col items-center justify-center gap-1 transition-colors"
                  >
                    <span>Match Market Lowest</span>
                    <span className="font-mono text-sm font-bold">
                      ₹{analysis.market_low.toFixed(2)}
                    </span>
                  </button>
                </div>

                {/* Custom Fine-Tune Slider */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Custom Markup Adjustment:</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{customSellingPrice.toFixed(2)} ({customMarkup.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="70"
                      step="0.5"
                      value={customMarkup}
                      onChange={e => setCustomMarkup(parseFloat(e.target.value) || 0)}
                      className="flex-1 accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <button
                      onClick={() => handleApplyMarkup(customMarkup)}
                      disabled={isApplying}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors"
                    >
                      {isApplying ? 'Applying...' : appliedSuccess ? 'Applied!' : 'Save Custom'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {appliedSuccess && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <Check className="w-3.5 h-3.5" /> Price Updated Successfully!
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAnalysis(product)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Re-Scan Market
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
