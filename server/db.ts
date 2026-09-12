import fs from 'fs';
import path from 'path';
import {
  Distributor,
  Product,
  Purchase,
  PurchaseItem,
  Sale,
  SaleItem,
  CreditRecord,
  StoreAnalytics,
  GstTreatment,
  PriceBasis,
  PaymentMethod
} from '../src/types';
import {
  computeLandedCostPerUnit,
  computeWeightedAverageCost,
  computeSellingPrice
} from '../src/utils/costCalculation';

interface StoreData {
  distributors: Distributor[];
  products: Product[];
  purchases: Purchase[];
  sales: Sale[];
  credits: CreditRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

const INITIAL_DISTRIBUTORS: Distributor[] = [
  {
    id: 'dist-1',
    name: 'Sri Balaji Wholesale Traders',
    phone: '+91 98450 12345',
    notes: 'Primary supplier for Grains, Flours, and packaged dry goods.',
    created_at: '2026-08-01T09:00:00.000Z'
  },
  {
    id: 'dist-2',
    name: 'Metro Agro Supplies & Pulses',
    phone: '+91 98860 67890',
    notes: 'Bulk supplier for pulses, lentils, and cooking oils.',
    created_at: '2026-08-05T10:30:00.000Z'
  },
  {
    id: 'dist-3',
    name: 'Supreme Dairy & Beverages Ltd',
    phone: '+91 94480 34567',
    notes: 'Dairy, ghee, butter, tea, and confectionery distributor.',
    created_at: '2026-08-10T14:15:00.000Z'
  }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'India Gate Basmati Rice Feast Rozzana 5kg',
    unit: 'bag',
    current_stock: 22,
    average_cost: 410.0,
    markup_percent: 20.0,
    selling_price: 492.0,
    reorder_threshold: 6,
    expiry_date: '2027-04-15',
    category: 'Grains & Rice',
    barcode: '8901262010214'
  },
  {
    id: 'prod-2',
    name: 'Fortune Sunlite Refined Sunflower Oil 1L',
    unit: 'pouch',
    current_stock: 36,
    average_cost: 118.0,
    markup_percent: 16.0,
    selling_price: 136.88,
    reorder_threshold: 12,
    expiry_date: '2027-02-28',
    category: 'Cooking Oils',
    barcode: '8906007281014'
  },
  {
    id: 'prod-3',
    name: 'Tata Sampann Unpolished Toor Dal 1kg',
    unit: 'kg',
    current_stock: 28,
    average_cost: 145.0,
    markup_percent: 18.0,
    selling_price: 171.1,
    reorder_threshold: 10,
    expiry_date: '2027-05-10',
    category: 'Pulses & Dal',
    barcode: '8904043900142'
  },
  {
    id: 'prod-4',
    name: 'Aashirvaad Shudh Chakki Atta 5kg',
    unit: 'bag',
    current_stock: 15,
    average_cost: 235.0,
    markup_percent: 15.0,
    selling_price: 270.25,
    reorder_threshold: 5,
    expiry_date: '2026-12-15',
    category: 'Flour & Grains',
    barcode: '8901725131012'
  },
  {
    id: 'prod-5',
    name: 'Tata Tea Gold Premium Tea 500g',
    unit: 'box',
    current_stock: 24,
    average_cost: 260.0,
    markup_percent: 22.0,
    selling_price: 317.2,
    reorder_threshold: 6,
    expiry_date: '2027-08-30',
    category: 'Beverages',
    barcode: '8901052002141'
  },
  {
    id: 'prod-6',
    name: 'Amul Butter Pasteurized 500g',
    unit: 'pack',
    current_stock: 14,
    average_cost: 245.0,
    markup_percent: 12.0,
    selling_price: 274.4,
    reorder_threshold: 5,
    expiry_date: '2026-11-20',
    category: 'Dairy & Refrigerated',
    barcode: '8901262021098'
  },
  {
    id: 'prod-7',
    name: 'Maggi 2-Minute Masala Noodles 4-Pack (280g)',
    unit: 'pack',
    current_stock: 42,
    average_cost: 48.0,
    markup_percent: 25.0,
    selling_price: 60.0,
    reorder_threshold: 15,
    expiry_date: '2027-01-30',
    category: 'Instant Food',
    barcode: '8901058852399'
  },
  {
    id: 'prod-8',
    name: 'Tata Salt Vacuum Evaporated Iodized 1kg',
    unit: 'pouch',
    current_stock: 50,
    average_cost: 21.0,
    markup_percent: 30.0,
    selling_price: 27.3,
    reorder_threshold: 15,
    expiry_date: '2028-01-01',
    category: 'Spices & Seasoning',
    barcode: '8901052000017'
  },
  {
    id: 'prod-9',
    name: 'Surf Excel Easy Wash Detergent Powder 1kg',
    unit: 'pouch',
    current_stock: 18,
    average_cost: 132.0,
    markup_percent: 18.0,
    selling_price: 155.76,
    reorder_threshold: 5,
    expiry_date: null,
    category: 'Household & Cleaning',
    barcode: '8901030005432'
  },
  {
    id: 'prod-10',
    name: 'Parle-G Gold Biscuits Family Pack 1kg',
    unit: 'pack',
    current_stock: 30,
    average_cost: 95.0,
    markup_percent: 20.0,
    selling_price: 114.0,
    reorder_threshold: 10,
    expiry_date: '2027-03-20',
    category: 'Snacks & Biscuits',
    barcode: '8901719102431'
  }
];

const INITIAL_PURCHASES: Purchase[] = [
  {
    id: 'purch-1',
    distributor_id: 'dist-1',
    distributor_name: 'Sri Balaji Wholesale Traders',
    purchase_date: '2026-08-20',
    invoice_number: 'INV-BLJ-4921',
    invoice_total: 12550.0,
    gst_treatment: 'include_as_cost',
    created_at: '2026-08-20T11:30:00.000Z',
    items: [
      {
        id: 'pi-1',
        purchase_id: 'purch-1',
        product_id: 'prod-1',
        product_name: 'India Gate Basmati Rice Feast Rozzana 5kg',
        quantity: 20,
        unit: 'bag',
        listed_price: 410.0,
        price_basis: 'per_unit',
        gst_included: true,
        gst_rate_percent: 5,
        computed_landed_cost_per_unit: 410.0
      },
      {
        id: 'pi-2',
        purchase_id: 'purch-1',
        product_id: 'prod-4',
        product_name: 'Aashirvaad Shudh Chakki Atta 5kg',
        quantity: 15,
        unit: 'bag',
        listed_price: 235.0,
        price_basis: 'per_unit',
        gst_included: true,
        gst_rate_percent: 5,
        computed_landed_cost_per_unit: 235.0
      }
    ]
  },
  {
    id: 'purch-2',
    distributor_id: 'dist-2',
    distributor_name: 'Metro Agro Supplies & Pulses',
    purchase_date: '2026-08-28',
    invoice_number: 'MAS-2026-904',
    invoice_total: 8290.0,
    gst_treatment: 'exclude_as_cost',
    created_at: '2026-08-28T14:40:00.000Z',
    items: [
      {
        id: 'pi-3',
        purchase_id: 'purch-2',
        product_id: 'prod-2',
        product_name: 'Fortune Sunlite Refined Sunflower Oil 1L',
        quantity: 30,
        unit: 'pouch',
        listed_price: 3540.0,
        price_basis: 'line_total',
        gst_included: true,
        gst_rate_percent: 5,
        computed_landed_cost_per_unit: 112.38
      },
      {
        id: 'pi-4',
        purchase_id: 'purch-2',
        product_id: 'prod-3',
        product_name: 'Tata Sampann Unpolished Toor Dal 1kg',
        quantity: 25,
        unit: 'kg',
        listed_price: 145.0,
        price_basis: 'per_unit',
        gst_included: false,
        gst_rate_percent: 0,
        computed_landed_cost_per_unit: 145.0
      }
    ]
  }
];

const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-1',
    sale_date: '2026-09-08T10:15:00.000Z',
    total_amount: 809.2,
    payment_method: 'upi',
    customer_name: 'Ramesh Sharma',
    customer_phone: '+91 98451 99887',
    created_at: '2026-09-08T10:15:00.000Z',
    items: [
      {
        id: 'si-1',
        sale_id: 'sale-1',
        product_id: 'prod-1',
        product_name: 'India Gate Basmati Rice Feast Rozzana 5kg',
        quantity: 1,
        unit: 'bag',
        unit_price_at_sale: 492.0,
        line_total: 492.0
      },
      {
        id: 'si-2',
        sale_id: 'sale-1',
        product_id: 'prod-5',
        product_name: 'Tata Tea Gold Premium Tea 500g',
        quantity: 1,
        unit: 'box',
        unit_price_at_sale: 317.2,
        line_total: 317.2
      }
    ]
  },
  {
    id: 'sale-2',
    sale_date: '2026-09-10T16:45:00.000Z',
    total_amount: 540.5,
    payment_method: 'credit',
    customer_name: 'Pooja Verma',
    customer_phone: '+91 97312 33445',
    created_at: '2026-09-10T16:45:00.000Z',
    items: [
      {
        id: 'si-3',
        sale_id: 'sale-2',
        product_id: 'prod-4',
        product_name: 'Aashirvaad Shudh Chakki Atta 5kg',
        quantity: 1,
        unit: 'bag',
        unit_price_at_sale: 270.25,
        line_total: 270.25
      },
      {
        id: 'si-4',
        sale_id: 'sale-2',
        product_id: 'prod-3',
        product_name: 'Tata Sampann Unpolished Toor Dal 1kg',
        quantity: 1,
        unit: 'kg',
        unit_price_at_sale: 171.1,
        line_total: 171.1
      },
      {
        id: 'si-5',
        sale_id: 'sale-2',
        product_id: 'prod-7',
        product_name: 'Maggi 2-Minute Masala Noodles 4-Pack (280g)',
        quantity: 1,
        unit: 'pack',
        unit_price_at_sale: 60.0,
        line_total: 60.0
      }
    ]
  },
  {
    id: 'sale-3',
    sale_date: '2026-09-11T12:30:00.000Z',
    total_amount: 274.4,
    payment_method: 'cash',
    customer_name: 'Walk-in Customer',
    created_at: '2026-09-11T12:30:00.000Z',
    items: [
      {
        id: 'si-6',
        sale_id: 'sale-3',
        product_id: 'prod-6',
        product_name: 'Amul Butter Pasteurized 500g',
        quantity: 1,
        unit: 'pack',
        unit_price_at_sale: 274.4,
        line_total: 274.4
      }
    ]
  }
];

const INITIAL_CREDITS: CreditRecord[] = [
  {
    id: 'cred-1',
    customer_name: 'Pooja Verma',
    customer_phone: '+91 97312 33445',
    outstanding_dues: 540.5,
    transactions: [
      {
        id: 'tx-1',
        date: '2026-09-10T16:45:00.000Z',
        type: 'sale',
        amount: 540.5,
        sale_id: 'sale-2',
        notes: 'Grocery purchase on credit'
      }
    ]
  }
];

class DatabaseManager {
  private data: StoreData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): StoreData {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(content);
      }
    } catch (err) {
      console.warn('Failed to read data file, initializing defaults', err);
    }

    const defaultData: StoreData = {
      distributors: INITIAL_DISTRIBUTORS,
      products: INITIAL_PRODUCTS,
      purchases: INITIAL_PURCHASES,
      sales: INITIAL_SALES,
      credits: INITIAL_CREDITS
    };

    this.saveData(defaultData);
    return defaultData;
  }

  private saveData(data: StoreData = this.data) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save data file', err);
    }
  }

  public resetToDefaults() {
    this.data = {
      distributors: JSON.parse(JSON.stringify(INITIAL_DISTRIBUTORS)),
      products: JSON.parse(JSON.stringify(INITIAL_PRODUCTS)),
      purchases: JSON.parse(JSON.stringify(INITIAL_PURCHASES)),
      sales: JSON.parse(JSON.stringify(INITIAL_SALES)),
      credits: JSON.parse(JSON.stringify(INITIAL_CREDITS))
    };
    this.saveData();
    return this.data;
  }

  // --- DISTRIBUTORS ---
  public getDistributors(): Distributor[] {
    return this.data.distributors;
  }

  public addDistributor(input: { name: string; phone?: string; notes?: string }): Distributor {
    const newDist: Distributor = {
      id: 'dist-' + Date.now(),
      name: input.name.trim(),
      phone: input.phone?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      created_at: new Date().toISOString()
    };
    this.data.distributors.push(newDist);
    this.saveData();
    return newDist;
  }

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    return this.data.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  public addProduct(input: {
    name: string;
    unit: string;
    current_stock: number;
    average_cost: number;
    markup_percent: number;
    reorder_threshold?: number | null;
    expiry_date?: string | null;
    category?: string;
    barcode?: string;
  }): Product {
    const selling_price = computeSellingPrice(input.average_cost, input.markup_percent);
    const newProduct: Product = {
      id: 'prod-' + Date.now(),
      name: input.name.trim(),
      unit: input.unit.trim(),
      current_stock: Number(input.current_stock) || 0,
      average_cost: Number(input.average_cost) || 0,
      markup_percent: Number(input.markup_percent) || 0,
      selling_price,
      reorder_threshold: input.reorder_threshold !== undefined ? input.reorder_threshold : 10,
      expiry_date: input.expiry_date || null,
      category: input.category?.trim() || 'General',
      barcode: input.barcode?.trim() || undefined
    };

    this.data.products.push(newProduct);
    this.saveData();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Product with ID ${id} not found`);
    }

    const current = this.data.products[index];
    const updated: Product = {
      ...current,
      ...updates,
      id: current.id
    };

    // If average_cost or markup_percent changed, recalculate selling_price server-side
    if (updates.average_cost !== undefined || updates.markup_percent !== undefined) {
      const avg = updates.average_cost !== undefined ? updates.average_cost : current.average_cost;
      const markup = updates.markup_percent !== undefined ? updates.markup_percent : current.markup_percent;
      updated.selling_price = computeSellingPrice(avg, markup);
    }

    this.data.products[index] = updated;
    this.saveData();
    return updated;
  }

  public updateProductPricing(id: string, markup_percent: number): Product {
    const product = this.getProductById(id);
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }

    const markup = Number(markup_percent) || 0;
    const selling_price = computeSellingPrice(product.average_cost, markup);

    product.markup_percent = markup;
    product.selling_price = selling_price;

    this.saveData();
    return product;
  }

  // --- PURCHASES (Module 1 Specs) ---
  public getPurchases(): Purchase[] {
    return this.data.purchases;
  }

  public getPurchaseById(id: string): Purchase | undefined {
    return this.data.purchases.find(p => p.id === id);
  }

  public createPurchase(payload: {
    distributor_id: string;
    purchase_date: string;
    invoice_number?: string;
    gst_treatment: GstTreatment;
    items: {
      product_id?: string | null;
      product_name: string;
      quantity: number;
      unit: string;
      listed_price: number;
      price_basis: PriceBasis;
      gst_included: boolean;
      gst_rate_percent: number;
    }[];
  }): Purchase {
    const distributor = this.data.distributors.find(d => d.id === payload.distributor_id);
    const purchaseId = 'purch-' + Date.now();

    let computedInvoiceTotal = 0;
    const computedItems: PurchaseItem[] = [];

    for (let i = 0; i < payload.items.length; i++) {
      const item = payload.items[i];
      const landedCost = computeLandedCostPerUnit({
        listed_price: Number(item.listed_price),
        quantity: Number(item.quantity),
        price_basis: item.price_basis,
        gst_included: Boolean(item.gst_included),
        gst_rate_percent: Number(item.gst_rate_percent) || 0,
        gst_treatment: payload.gst_treatment
      });

      const lineTotalOnInvoice = item.price_basis === 'line_total'
        ? Number(item.listed_price)
        : Number(item.listed_price) * Number(item.quantity);

      computedInvoiceTotal += lineTotalOnInvoice;

      const pItem: PurchaseItem = {
        id: `pi-${Date.now()}-${i}`,
        purchase_id: purchaseId,
        product_id: item.product_id || null,
        product_name: item.product_name,
        quantity: Number(item.quantity),
        unit: item.unit || 'pcs',
        listed_price: Number(item.listed_price),
        price_basis: item.price_basis,
        gst_included: Boolean(item.gst_included),
        gst_rate_percent: Number(item.gst_rate_percent) || 0,
        computed_landed_cost_per_unit: landedCost
      };
      computedItems.push(pItem);

      // Key rule: Update inventory catalog running weighted average cost and stock
      if (item.product_id) {
        const existingProduct = this.getProductById(item.product_id);
        if (existingProduct) {
          const oldStock = existingProduct.current_stock;
          const oldAvgCost = existingProduct.average_cost;
          const incomingQty = Number(item.quantity);

          const newAvgCost = computeWeightedAverageCost(oldStock, oldAvgCost, incomingQty, landedCost);
          const newStock = Math.round((oldStock + incomingQty) * 100) / 100;
          const newSellingPrice = computeSellingPrice(newAvgCost, existingProduct.markup_percent);

          existingProduct.current_stock = newStock;
          existingProduct.average_cost = newAvgCost;
          existingProduct.selling_price = newSellingPrice;
        }
      } else {
        // Automatically create product in catalog if not matched
        const newProduct = this.addProduct({
          name: item.product_name,
          unit: item.unit || 'pcs',
          current_stock: Number(item.quantity),
          average_cost: landedCost,
          markup_percent: 20.0,
          reorder_threshold: 10
        });
        pItem.product_id = newProduct.id;
      }
    }

    const newPurchase: Purchase = {
      id: purchaseId,
      distributor_id: payload.distributor_id,
      distributor_name: distributor ? distributor.name : 'Unknown Distributor',
      purchase_date: payload.purchase_date || new Date().toISOString().split('T')[0],
      invoice_number: payload.invoice_number?.trim() || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      invoice_total: Math.round((computedInvoiceTotal + Number.EPSILON) * 100) / 100,
      gst_treatment: payload.gst_treatment,
      created_at: new Date().toISOString(),
      items: computedItems
    };

    this.data.purchases.unshift(newPurchase);
    this.saveData();
    return newPurchase;
  }

  // --- SALES / BILLING / POS (Module 4 Specs) ---
  public getSales(): Sale[] {
    return this.data.sales;
  }

  public getSaleById(id: string): Sale | undefined {
    return this.data.sales.find(s => s.id === id);
  }

  public createSale(payload: {
    payment_method: PaymentMethod;
    customer_name?: string;
    customer_phone?: string;
    items: {
      product_id: string;
      quantity: number;
    }[];
  }): Sale {
    if (!payload.items || payload.items.length === 0) {
      throw new Error('Sale must include at least one item');
    }

    // Key rule: reject a sale if requested quantity exceeds current_stock — return a clear error, never fail silently.
    for (const item of payload.items) {
      const product = this.getProductById(item.product_id);
      if (!product) {
        throw new Error(`Product not found (ID: ${item.product_id})`);
      }
      if (item.quantity <= 0) {
        throw new Error(`Requested quantity for "${product.name}" must be greater than zero.`);
      }
      if (item.quantity > product.current_stock) {
        throw new Error(
          `Insufficient stock for "${product.name}". Requested: ${item.quantity} ${product.unit}, Available: ${product.current_stock} ${product.unit}.`
        );
      }
    }

    const saleId = 'sale-' + Date.now();
    let totalAmount = 0;
    const saleItems: SaleItem[] = [];

    // Decrement stock and calculate snapshot totals
    for (let i = 0; i < payload.items.length; i++) {
      const item = payload.items[i];
      const product = this.getProductById(item.product_id)!;
      const unitPrice = product.selling_price;
      const lineTotal = Math.round((unitPrice * item.quantity + Number.EPSILON) * 100) / 100;

      // Decrement current_stock
      product.current_stock = Math.round((product.current_stock - item.quantity) * 100) / 100;

      totalAmount += lineTotal;

      saleItems.push({
        id: `si-${Date.now()}-${i}`,
        sale_id: saleId,
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        unit: product.unit,
        unit_price_at_sale: unitPrice,
        line_total: lineTotal
      });
    }

    const finalTotal = Math.round((totalAmount + Number.EPSILON) * 100) / 100;

    const newSale: Sale = {
      id: saleId,
      sale_date: new Date().toISOString(),
      total_amount: finalTotal,
      payment_method: payload.payment_method,
      customer_name: payload.customer_name?.trim() || 'Walk-in Customer',
      customer_phone: payload.customer_phone?.trim() || undefined,
      items: saleItems,
      created_at: new Date().toISOString()
    };

    this.data.sales.unshift(newSale);

    // If payment_method === 'credit', record into credit ledger
    if (payload.payment_method === 'credit') {
      const custName = newSale.customer_name || 'Credit Customer';
      let creditRecord = this.data.credits.find(
        c => c.customer_name.toLowerCase() === custName.toLowerCase()
      );

      if (!creditRecord) {
        creditRecord = {
          id: 'cred-' + Date.now(),
          customer_name: custName,
          customer_phone: payload.customer_phone?.trim(),
          outstanding_dues: 0,
          transactions: []
        };
        this.data.credits.push(creditRecord);
      }

      creditRecord.outstanding_dues = Math.round((creditRecord.outstanding_dues + finalTotal + Number.EPSILON) * 100) / 100;
      creditRecord.transactions.unshift({
        id: 'tx-' + Date.now(),
        date: new Date().toISOString(),
        type: 'sale',
        amount: finalTotal,
        sale_id: saleId,
        notes: `Store checkout bill #${saleId.slice(-4)}`
      });
    }

    this.saveData();
    return newSale;
  }

  // --- CREDITS ---
  public getCredits(): CreditRecord[] {
    return this.data.credits;
  }

  public recordCreditPayment(creditId: string, amount: number, notes?: string): CreditRecord {
    const record = this.data.credits.find(c => c.id === creditId);
    if (!record) {
      throw new Error(`Credit record with ID ${creditId} not found`);
    }

    const payAmount = Math.max(0, Number(amount) || 0);
    record.outstanding_dues = Math.max(0, Math.round((record.outstanding_dues - payAmount + Number.EPSILON) * 100) / 100);

    record.transactions.unshift({
      id: 'tx-' + Date.now(),
      date: new Date().toISOString(),
      type: 'payment',
      amount: payAmount,
      notes: notes || 'Settlement received'
    });

    this.saveData();
    return record;
  }

  // --- ANALYTICS ---
  public getAnalytics(): StoreAnalytics {
    let totalRevenue = 0;
    let totalCogs = 0;

    for (const sale of this.data.sales) {
      totalRevenue += sale.total_amount;
      for (const item of sale.items) {
        const prod = this.getProductById(item.product_id);
        const cost = prod ? prod.average_cost : (item.unit_price_at_sale * 0.8);
        totalCogs += cost * item.quantity;
      }
    }

    const grossProfit = totalRevenue - totalCogs;
    const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    let totalValuation = 0;
    let lowStockCount = 0;

    for (const p of this.data.products) {
      totalValuation += p.current_stock * p.average_cost;
      const threshold = p.reorder_threshold ?? 5;
      if (p.current_stock <= threshold) {
        lowStockCount++;
      }
    }

    let totalCreditDues = 0;
    for (const c of this.data.credits) {
      totalCreditDues += c.outstanding_dues;
    }

    return {
      total_revenue: Math.round(totalRevenue * 100) / 100,
      total_sales_count: this.data.sales.length,
      total_cost_of_goods_sold: Math.round(totalCogs * 100) / 100,
      estimated_gross_profit: Math.round(grossProfit * 100) / 100,
      gross_margin_percent: Math.round(grossMarginPercent * 10) / 10,
      total_inventory_valuation: Math.round(totalValuation * 100) / 100,
      total_products_count: this.data.products.length,
      low_stock_count: lowStockCount,
      total_credit_dues: Math.round(totalCreditDues * 100) / 100
    };
  }
}

export const db = new DatabaseManager();
