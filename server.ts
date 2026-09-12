import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { scanInvoice, SAMPLE_INVOICES } from './server/services/invoice_scanner';
import { detectMarketPrice } from './server/services/market_price_detector';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsing with large limit for image uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// --- API ROUTES FIRST ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 1. Distributors
app.get('/api/distributors', (req, res) => {
  try {
    const distributors = db.getDistributors();
    res.json(distributors);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/distributors', (req, res) => {
  try {
    const { name, phone, notes } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Distributor name is required' });
    }
    const dist = db.addDistributor({ name, phone, notes });
    res.status(201).json(dist);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Products / Inventory Catalog (Module 2 Specs)
app.get('/api/products', (req, res) => {
  try {
    const products = db.getProducts();
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const { name, unit, current_stock, average_cost, markup_percent, reorder_threshold, expiry_date, category } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Product name is required' });
    }
    const product = db.addProduct({
      name,
      unit: unit || 'pcs',
      current_stock: Number(current_stock) || 0,
      average_cost: Number(average_cost) || 0,
      markup_percent: Number(markup_percent) || 0,
      reorder_threshold: reorder_threshold !== undefined ? Number(reorder_threshold) : 10,
      expiry_date,
      category
    });
    res.status(201).json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/products/:id', (req, res) => {
  try {
    const updated = db.updateProduct(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Module 3: Pricing Endpoint - update markup_percent; server recalculates selling_price
app.patch('/api/products/:id/pricing', (req, res) => {
  try {
    const { markup_percent } = req.body;
    if (markup_percent === undefined || isNaN(Number(markup_percent))) {
      return res.status(400).json({ error: 'Valid markup_percent is required' });
    }
    const updated = db.updateProductPricing(req.params.id, Number(markup_percent));
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Real-Time Product Market Price Detection via Google Search Grounding
app.post('/api/market-pricing/detect', async (req, res) => {
  try {
    const { product_id, product_name, unit, category, average_cost, current_selling_price } = req.body;
    const analysis = await detectMarketPrice({
      product_id,
      product_name,
      unit,
      category,
      average_cost: average_cost !== undefined ? Number(average_cost) : undefined,
      current_selling_price: current_selling_price !== undefined ? Number(current_selling_price) : undefined
    });
    res.json(analysis);
  } catch (err: any) {
    console.error('Market price detection error:', err);
    res.status(500).json({ error: err.message || 'Failed to detect market prices' });
  }
});

// Batch Market Price Detection for multiple products
app.post('/api/market-pricing/batch-detect', async (req, res) => {
  try {
    const { product_ids } = req.body;
    const ids: string[] = Array.isArray(product_ids) && product_ids.length > 0
      ? product_ids
      : db.getProducts().map(p => p.id);

    // Limit batch to 8 to avoid timeout
    const targetIds = ids.slice(0, 8);
    const results = await Promise.all(
      targetIds.map(id => detectMarketPrice({ product_id: id }).catch(e => {
        console.warn(`Failed detection for ${id}:`, e);
        return null;
      }))
    );

    res.json(results.filter(Boolean));
  } catch (err: any) {
    console.error('Batch market detection error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Purchases & AI Scanner (Module 1 Specs)
app.get('/api/purchases/samples', (req, res) => {
  res.json(SAMPLE_INVOICES.map(s => ({
    id: s.id,
    title: s.title,
    distributor_name: s.distributor_name,
    invoice_number: s.invoice_number,
    gst_treatment: s.gst_treatment,
    item_count: s.items.length
  })));
});

// AI Invoice Scan draft endpoint
app.post('/api/purchases/scan', async (req, res) => {
  try {
    const { sample_id, image_base64, mime_type, raw_text, gst_treatment } = req.body;
    const draft = await scanInvoice({
      sample_id,
      image_base64,
      mime_type,
      raw_text,
      gst_treatment
    });
    res.json(draft);
  } catch (err: any) {
    console.error('Scan error:', err);
    res.status(500).json({ error: err.message || 'Invoice scanning failed' });
  }
});

app.get('/api/purchases', (req, res) => {
  try {
    const purchases = db.getPurchases();
    res.json(purchases);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/purchases/:id', (req, res) => {
  try {
    const purchase = db.getPurchaseById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    res.json(purchase);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/purchases', (req, res) => {
  try {
    const { distributor_id, purchase_date, invoice_number, gst_treatment, items } = req.body;
    if (!distributor_id) {
      return res.status(400).json({ error: 'distributor_id is required' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Purchase must have at least one line item' });
    }

    const newPurchase = db.createPurchase({
      distributor_id,
      purchase_date,
      invoice_number,
      gst_treatment: gst_treatment || 'include_as_cost',
      items
    });

    res.status(201).json(newPurchase);
  } catch (err: any) {
    console.error('Purchase creation error:', err);
    res.status(400).json({ error: err.message });
  }
});

// 4. Billing / POS Sales (Module 4 Specs)
app.get('/api/sales', (req, res) => {
  try {
    const sales = db.getSales();
    res.json(sales);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sales/:id', (req, res) => {
  try {
    const sale = db.getSaleById(req.params.id);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json(sale);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sales - validates stock, decrements current_stock, creates sale
app.post('/api/sales', (req, res) => {
  try {
    const { payment_method, customer_name, customer_phone, items } = req.body;
    if (!payment_method) {
      return res.status(400).json({ error: 'Payment method is required' });
    }
    const sale = db.createSale({
      payment_method,
      customer_name,
      customer_phone,
      items
    });
    res.status(201).json(sale);
  } catch (err: any) {
    // Return explicit error message so POS alerts the user directly
    res.status(400).json({ error: err.message });
  }
});

// 5. Phase 2: Customer Credit Ledger
app.get('/api/credits', (req, res) => {
  try {
    const credits = db.getCredits();
    res.json(credits);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/credits/:id/payment', (req, res) => {
  try {
    const { amount, notes } = req.body;
    const updated = db.recordCreditPayment(req.params.id, Number(amount), notes);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 6. Analytics & Store Summary
app.get('/api/analytics', (req, res) => {
  try {
    const stats = db.getAnalytics();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reset to initial demo store data
app.post('/api/reset', (req, res) => {
  try {
    const restored = db.resetToDefaults();
    res.json({ message: 'Store reset to sample catalog & invoices successfully', data: restored });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Store Manager Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
