import React from 'react';
import { 
  ShoppingCart, 
  Package, 
  ReceiptText, 
  Tags, 
  Users, 
  BarChart3, 
  RotateCcw,
  Truck,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { StoreAnalytics } from '../types';

export type ActiveTab = 'pos' | 'inventory' | 'purchases' | 'pricing' | 'credits' | 'analytics';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  analytics: StoreAnalytics | null;
  onOpenDistributors: () => void;
  onResetData: () => void;
  isResetting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  analytics,
  onOpenDistributors,
  onResetData,
  isResetting
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Store Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm font-bold text-xl">
              SM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                  Store Manager
                </h1>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Phase 1 Core
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                AI Landed Cost • Weighted Avg Inventory • Smart POS
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          {analytics && (
            <div className="hidden lg:flex items-center gap-4 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="text-slate-400">Inventory:</span>
                <span className="font-semibold">{analytics.total_products_count} items</span>
              </div>
              <span className="w-1 h-3 bg-slate-300 rounded-full" />
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="text-slate-400">Valuation:</span>
                <span className="font-semibold text-emerald-700 font-mono">₹{analytics.total_inventory_valuation.toLocaleString()}</span>
              </div>
              {analytics.low_stock_count > 0 && (
                <>
                  <span className="w-1 h-3 bg-slate-300 rounded-full" />
                  <div className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{analytics.low_stock_count} Low Stock</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="nav-distributors-btn"
              onClick={onOpenDistributors}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              title="Manage Distributors"
            >
              <Truck className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Distributors</span>
            </button>

            <button
              id="nav-reset-btn"
              onClick={onResetData}
              disabled={isResetting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
              title="Restore initial demo sample products & invoices"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto py-1.5 scrollbar-none border-t border-slate-100">
          <button
            id="tab-pos"
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'pos'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Billing / POS
          </button>

          <button
            id="tab-inventory"
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'inventory'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            Inventory & Stock
          </button>

          <button
            id="tab-purchases"
            onClick={() => setActiveTab('purchases')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'purchases'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ReceiptText className="w-4 h-4" />
            <span>Purchases & AI Scanner</span>
            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 border border-teal-200">
              <Sparkles className="w-2.5 h-2.5" /> AI
            </span>
          </button>

          <button
            id="tab-pricing"
            onClick={() => setActiveTab('pricing')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'pricing'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Tags className="w-4 h-4" />
            Pricing & Margins
          </button>

          <button
            id="tab-credits"
            onClick={() => setActiveTab('credits')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'credits'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            Credit Ledger (Khata)
            {analytics && analytics.total_credit_dues > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                ₹{analytics.total_credit_dues}
              </span>
            )}
          </button>

          <button
            id="tab-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Sales & Analytics
          </button>
        </div>
      </div>
    </header>
  );
};
