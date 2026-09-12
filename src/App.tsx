import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { POSModule } from './components/POSModule';
import { InventoryModule } from './components/InventoryModule';
import { PurchasesModule } from './components/PurchasesModule';
import { PricingModule } from './components/PricingModule';
import { CreditLedgerModule } from './components/CreditLedgerModule';
import { AnalyticsModule } from './components/AnalyticsModule';
import { DistributorsModal } from './components/DistributorsModal';
import { api } from './api';
import { 
  Product, 
  Purchase, 
  Distributor, 
  Sale, 
  CreditRecord, 
  StoreAnalytics 
} from './types';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [credits, setCredits] = useState<CreditRecord[]>([]);
  const [analytics, setAnalytics] = useState<StoreAnalytics | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isDistributorsModalOpen, setIsDistributorsModalOpen] = useState<boolean>(false);

  // Load all store state
  const loadAllData = useCallback(async () => {
    try {
      setInitError(null);
      const [
        prodsData,
        purchsData,
        distsData,
        salesData,
        creditsData,
        statsData
      ] = await Promise.all([
        api.getProducts(),
        api.getPurchases(),
        api.getDistributors(),
        api.getSales(),
        api.getCredits(),
        api.getAnalytics()
      ]);

      setProducts(prodsData);
      setPurchases(purchsData);
      setDistributors(distsData);
      setSales(salesData);
      setCredits(creditsData);
      setAnalytics(statsData);
    } catch (err: any) {
      console.error('Failed to load store data:', err);
      setInitError(err.message || 'Failed to connect to Store Manager server');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Reset to sample data
  const handleResetData = async () => {
    if (!window.confirm('Reset store back to initial sample catalog, invoices, and sales?')) {
      return;
    }
    setIsResetting(true);
    try {
      await api.resetStore();
      await loadAllData();
    } catch (err: any) {
      alert('Reset failed: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  // Add distributor wrapper
  const handleAddDistributor = async (data: { name: string; phone?: string; notes?: string }) => {
    const dist = await api.addDistributor(data);
    await loadAllData();
    return dist;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        analytics={analytics}
        onOpenDistributors={() => setIsDistributorsModalOpen(true)}
        onResetData={handleResetData}
        isResetting={isResetting}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {isLoading ? (
          <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
            <h3 className="font-bold text-slate-800 text-sm">Connecting to Store Manager Engine...</h3>
            <p className="text-xs text-slate-400 mt-1">Loading catalog, inventory levels, and AI models</p>
          </div>
        ) : initError ? (
          <div className="max-w-md mx-auto my-16 p-6 bg-white rounded-2xl border border-rose-200 shadow-sm text-center">
            <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 text-base">Backend Connection Error</h3>
            <p className="text-xs text-rose-700 mt-1 mb-4">{initError}</p>
            <button
              onClick={() => {
                setIsLoading(true);
                loadAllData();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'pos' && (
              <POSModule
                products={products}
                onSaleComplete={loadAllData}
                createSale={api.createSale}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryModule
                products={products}
                onProductUpdated={loadAllData}
                addProduct={api.addProduct}
                updateProduct={api.updateProduct}
                updateProductPricing={api.updateProductPricing}
                onNavigateToPricing={() => setActiveTab('pricing')}
              />
            )}

            {activeTab === 'purchases' && (
              <PurchasesModule
                distributors={distributors}
                products={products}
                purchases={purchases}
                onPurchaseCreated={loadAllData}
                createPurchase={api.createPurchase}
                scanInvoice={api.scanInvoice}
                getSampleInvoices={api.getSampleInvoices}
              />
            )}

            {activeTab === 'pricing' && (
              <PricingModule
                products={products}
                onPricingUpdated={loadAllData}
                updateProductPricing={api.updateProductPricing}
              />
            )}

            {activeTab === 'credits' && (
              <CreditLedgerModule
                credits={credits}
                onPaymentRecorded={loadAllData}
                recordPayment={api.recordCreditPayment}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsModule
                sales={sales}
                products={products}
                analytics={analytics}
              />
            )}
          </>
        )}
      </main>

      {/* Distributors Management Modal */}
      <DistributorsModal
        isOpen={isDistributorsModalOpen}
        onClose={() => setIsDistributorsModalOpen(false)}
        distributors={distributors}
        onAddDistributor={handleAddDistributor}
      />
    </div>
  );
}
