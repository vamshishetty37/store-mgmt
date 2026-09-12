export type GstTreatment = 'include_as_cost' | 'exclude_as_cost';
export type PriceBasis = 'per_unit' | 'line_total';
export type PaymentMethod = 'cash' | 'upi' | 'credit';

export interface Distributor {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  created_at?: string;
}

export interface PurchaseItem {
  id?: string;
  purchase_id?: string;
  product_id?: string | null;
  product_name: string;
  quantity: number;
  unit: string;
  listed_price: number;
  price_basis: PriceBasis;
  gst_included: boolean;
  gst_rate_percent: number;
  computed_landed_cost_per_unit?: number;
}

export interface Purchase {
  id: string;
  distributor_id: string;
  distributor_name?: string;
  purchase_date: string;
  invoice_number?: string;
  invoice_total: number;
  gst_treatment: GstTreatment;
  created_at: string;
  items?: PurchaseItem[];
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  average_cost: number;
  markup_percent: number;
  selling_price: number;
  reorder_threshold?: number | null;
  expiry_date?: string | null;
  category?: string;
  barcode?: string;
}

export interface SaleItem {
  id?: string;
  sale_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price_at_sale: number;
  line_total: number;
}

export interface Sale {
  id: string;
  sale_date: string;
  total_amount: number;
  payment_method: PaymentMethod;
  customer_name?: string;
  customer_phone?: string;
  items: SaleItem[];
  created_at?: string;
}

export interface CreditRecord {
  id: string;
  customer_name: string;
  customer_phone?: string;
  outstanding_dues: number;
  transactions: {
    id: string;
    date: string;
    type: 'sale' | 'payment';
    amount: number;
    sale_id?: string;
    notes?: string;
  }[];
}

export interface ScanDraftItem {
  temp_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  listed_price: number;
  price_basis: PriceBasis;
  gst_included: boolean;
  gst_rate_percent: number;
  matched_product_id?: string | null;
  computed_landed_cost_per_unit: number;
}

export interface ScanDraftResult {
  distributor_name?: string;
  invoice_number?: string;
  purchase_date?: string;
  invoice_total?: number;
  gst_treatment: GstTreatment;
  items: ScanDraftItem[];
  confidence_notes?: string;
}

export interface StoreAnalytics {
  total_revenue: number;
  total_sales_count: number;
  total_cost_of_goods_sold: number;
  estimated_gross_profit: number;
  gross_margin_percent: number;
  total_inventory_valuation: number;
  total_products_count: number;
  low_stock_count: number;
  total_credit_dues: number;
}

export interface CompetitorPrice {
  source: string;
  price: number;
  unit_detail?: string;
  in_stock?: boolean;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface MarketPriceAnalysis {
  product_id: string;
  product_name: string;
  category?: string;
  currency: string;
  current_store_cost: number;
  current_store_price: number;
  current_markup_percent: number;
  market_low: number;
  market_avg: number;
  market_high: number;
  recommended_selling_price: number;
  recommended_markup_percent: number;
  price_position: 'below_market' | 'competitive' | 'above_market' | 'premium';
  summary: string;
  competitors: CompetitorPrice[];
  grounding_sources: GroundingSource[];
  search_queries?: string[];
  is_live_search: boolean;
  detected_at: string;
}
