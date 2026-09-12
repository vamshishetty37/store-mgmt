import {
  Distributor,
  Product,
  Purchase,
  Sale,
  CreditRecord,
  StoreAnalytics,
  ScanDraftResult,
  GstTreatment,
  PaymentMethod,
  MarketPriceAnalysis
} from './types';

export const api = {
  // Distributors
  async getDistributors(): Promise<Distributor[]> {
    const res = await fetch('/api/distributors');
    if (!res.ok) throw new Error('Failed to fetch distributors');
    return res.json();
  },

  async addDistributor(data: { name: string; phone?: string; notes?: string }): Promise<Distributor> {
    const res = await fetch('/api/distributors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add distributor');
    }
    return res.json();
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  async addProduct(product: Partial<Product>): Promise<Product> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add product');
    }
    return res.json();
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update product');
    }
    return res.json();
  },

  async updateProductPricing(id: string, markup_percent: number): Promise<Product> {
    const res = await fetch(`/api/products/${id}/pricing`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markup_percent })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update product pricing');
    }
    return res.json();
  },

  // Purchases
  async getPurchases(): Promise<Purchase[]> {
    const res = await fetch('/api/purchases');
    if (!res.ok) throw new Error('Failed to fetch purchases');
    return res.json();
  },

  async getPurchaseById(id: string): Promise<Purchase> {
    const res = await fetch(`/api/purchases/${id}`);
    if (!res.ok) throw new Error('Failed to fetch purchase details');
    return res.json();
  },

  async createPurchase(data: {
    distributor_id: string;
    purchase_date: string;
    invoice_number?: string;
    gst_treatment: GstTreatment;
    items: any[];
  }): Promise<Purchase> {
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create purchase');
    }
    return res.json();
  },

  async getSampleInvoices(): Promise<any[]> {
    const res = await fetch('/api/purchases/samples');
    if (!res.ok) throw new Error('Failed to fetch sample invoices');
    return res.json();
  },

  async scanInvoice(payload: {
    sample_id?: string;
    image_base64?: string;
    mime_type?: string;
    raw_text?: string;
    gst_treatment?: GstTreatment;
  }): Promise<ScanDraftResult> {
    const res = await fetch('/api/purchases/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to scan invoice');
    }
    return res.json();
  },

  // Sales / POS
  async getSales(): Promise<Sale[]> {
    const res = await fetch('/api/sales');
    if (!res.ok) throw new Error('Failed to fetch sales');
    return res.json();
  },

  async createSale(data: {
    payment_method: PaymentMethod;
    customer_name?: string;
    customer_phone?: string;
    items: { product_id: string; quantity: number }[];
  }): Promise<Sale> {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to complete sale');
    }
    return res.json();
  },

  // Credits
  async getCredits(): Promise<CreditRecord[]> {
    const res = await fetch('/api/credits');
    if (!res.ok) throw new Error('Failed to fetch credit ledger');
    return res.json();
  },

  async recordCreditPayment(creditId: string, amount: number, notes?: string): Promise<CreditRecord> {
    const res = await fetch(`/api/credits/${creditId}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, notes })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to record payment');
    }
    return res.json();
  },

  // Analytics
  async getAnalytics(): Promise<StoreAnalytics> {
    const res = await fetch('/api/analytics');
    if (!res.ok) throw new Error('Failed to fetch store analytics');
    return res.json();
  },

  // Real-Time Market Price Detection
  async detectMarketPrice(payload: {
    product_id?: string;
    product_name?: string;
    unit?: string;
    category?: string;
    average_cost?: number;
    current_selling_price?: number;
  }): Promise<MarketPriceAnalysis> {
    const res = await fetch('/api/market-pricing/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to detect market prices');
    }
    return res.json();
  },

  async batchDetectMarketPrices(productIds?: string[]): Promise<MarketPriceAnalysis[]> {
    const res = await fetch('/api/market-pricing/batch-detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_ids: productIds })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to batch detect market prices');
    }
    return res.json();
  },

  // Reset
  async resetStore(): Promise<any> {
    const res = await fetch('/api/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset store');
    return res.json();
  }
};
