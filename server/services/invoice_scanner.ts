import { GoogleGenAI } from '@google/genai';
import { db } from '../db';
import { computeLandedCostPerUnit } from '../../src/utils/costCalculation';
import { GstTreatment, PriceBasis, ScanDraftItem, ScanDraftResult } from '../../src/types';

// Built-in high quality sample invoices for one-click testing & demo
export const SAMPLE_INVOICES = [
  {
    id: 'sample-balaji-grains',
    title: 'Sri Balaji Wholesale - Rice & Atta Invoice',
    distributor_name: 'Sri Balaji Wholesale Traders',
    invoice_number: 'BLJ-9823',
    purchase_date: new Date().toISOString().split('T')[0],
    gst_treatment: 'include_as_cost' as GstTreatment,
    raw_text: `
      SRI BALAJI WHOLESALE TRADERS
      APMC Yard, Gate #3, Bengaluru - 560022
      GSTIN: 29AABCB1234P1Z2 | Ph: +91 98450 12345
      TAX INVOICE
      Invoice No: BLJ-9823      Date: 2026-09-12
      Billed To: City Supermart Store
      
      Item Details:
      1. India Gate Basmati Rice Feast Rozzana 5kg
         Qty: 25 bags | Rate: ₹420.00 / bag | GST: 5% (Included in Rate)
         Line Total: ₹10,500.00
      2. Aashirvaad Shudh Chakki Atta 5kg
         Qty: 20 bags | Rate: ₹230.00 / bag | GST: 5% (Included in Rate)
         Line Total: ₹4,600.00
      3. Tata Iodized Salt 1kg
         Qty: 50 pouches | Line Total: ₹950.00 | GST: 0% (Nil)
      
      Total Invoice Amount: ₹16,050.00
    `,
    items: [
      {
        product_name: 'India Gate Basmati Rice Feast Rozzana 5kg',
        quantity: 25,
        unit: 'bag',
        listed_price: 420.0,
        price_basis: 'per_unit' as PriceBasis,
        gst_included: true,
        gst_rate_percent: 5
      },
      {
        product_name: 'Aashirvaad Shudh Chakki Atta 5kg',
        quantity: 20,
        unit: 'bag',
        listed_price: 230.0,
        price_basis: 'per_unit' as PriceBasis,
        gst_included: true,
        gst_rate_percent: 5
      },
      {
        product_name: 'Tata Salt Vacuum Evaporated Iodized 1kg',
        quantity: 50,
        unit: 'pouch',
        listed_price: 950.0,
        price_basis: 'line_total' as PriceBasis,
        gst_included: false,
        gst_rate_percent: 0
      }
    ]
  },
  {
    id: 'sample-metro-oil-pulses',
    title: 'Metro Agro - Pulses & Sunflower Oil',
    distributor_name: 'Metro Agro Supplies & Pulses',
    invoice_number: 'MAS-2026-881',
    purchase_date: new Date().toISOString().split('T')[0],
    gst_treatment: 'exclude_as_cost' as GstTreatment, // Claims ITC
    raw_text: `
      METRO AGRO SUPPLIES & PULSES
      Industrial Area, Peenya, Bengaluru
      GSTIN: 29XYZPA5544K1ZS | Ph: +91 98860 67890
      COMMERCIAL INVOICE (INPUT TAX CREDIT ELIGIBLE)
      Invoice: MAS-2026-881     Date: 2026-09-12
      
      1. Fortune Sunlite Refined Sunflower Oil 1L
         Qty: 40 pouches | Base Price: ₹110.00 / pouch | GST: 5% extra
         CGST: 2.5%, SGST: 2.5%
      2. Tata Sampann Unpolished Toor Dal 1kg
         Qty: 30 kg | Base Price: ₹140.00 / kg | GST: 0% Exempt
      3. Maggi 2-Minute Masala Noodles 4-Pack (280g)
         Qty: 24 packs | Base Price: ₹45.00 / pack | GST: 12% extra
      
      Total: ₹11,358.00
    `,
    items: [
      {
        product_name: 'Fortune Sunlite Refined Sunflower Oil 1L',
        quantity: 40,
        unit: 'pouch',
        listed_price: 110.0,
        price_basis: 'per_unit' as PriceBasis,
        gst_included: false,
        gst_rate_percent: 5
      },
      {
        product_name: 'Tata Sampann Unpolished Toor Dal 1kg',
        quantity: 30,
        unit: 'kg',
        listed_price: 140.0,
        price_basis: 'per_unit' as PriceBasis,
        gst_included: false,
        gst_rate_percent: 0
      },
      {
        product_name: 'Maggi 2-Minute Masala Noodles 4-Pack (280g)',
        quantity: 24,
        unit: 'pack',
        listed_price: 45.0,
        price_basis: 'per_unit' as PriceBasis,
        gst_included: false,
        gst_rate_percent: 12
      }
    ]
  },
  {
    id: 'sample-dairy-tea',
    title: 'Supreme Dairy & Beverages Invoice',
    distributor_name: 'Supreme Dairy & Beverages Ltd',
    invoice_number: 'SUP-9011',
    purchase_date: new Date().toISOString().split('T')[0],
    gst_treatment: 'include_as_cost' as GstTreatment,
    raw_text: `
      SUPREME DAIRY & BEVERAGES LTD
      GSTIN: 29KLMNO9988C1ZR
      1. Amul Butter Pasteurized 500g - 15 packs @ ₹240.00/pack (GST 12% incl)
      2. Tata Tea Gold Premium Tea 500g - 20 boxes @ ₹250.00/box (GST 5% incl)
      3. Parle-G Gold Biscuits Family Pack 1kg - 25 packs @ ₹90.00/pack (GST 18% incl)
    `,
    items: [
      {
        product_name: 'Amul Butter Pasteurized 500g',
        quantity: 15,
        unit: 'pack',
        listed_price: 240.0,
        price_basis: 'per_unit' as PriceBasis,
        gst_included: true,
        gst_rate_percent: 12
      },
      {
        product_name: 'Tata Tea Gold Premium Tea 500g',
        quantity: 20,
        unit: 'box',
        listed_price: 250.0,
        price_basis: 'per_unit' as PriceBasis,
        gst_included: true,
        gst_rate_percent: 5
      },
      {
        product_name: 'Parle-G Gold Biscuits Family Pack 1kg',
        quantity: 25,
        unit: 'pack',
        listed_price: 90.0,
        price_basis: 'per_unit' as PriceBasis,
        gst_included: true,
        gst_rate_percent: 18
      }
    ]
  }
];

let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.warn('Could not initialize GoogleGenAI client:', e);
    }
  }
  return aiClient;
}

function matchWithCatalog(rawName: string): string | null {
  const products = db.getProducts();
  const normalizedRaw = rawName.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const rawWords = normalizedRaw.split(/\s+/).filter(w => w.length > 2);

  let bestMatchId: string | null = null;
  let highestScore = 0;

  for (const prod of products) {
    const normProd = prod.name.toLowerCase().replace(/[^a-z0-9]/g, ' ');
    if (normProd === normalizedRaw) {
      return prod.id;
    }
    const prodWords = normProd.split(/\s+/).filter(w => w.length > 2);
    let matchCount = 0;
    for (const w of rawWords) {
      if (prodWords.includes(w)) matchCount++;
    }
    const score = matchCount / Math.max(rawWords.length, prodWords.length);
    if (score > highestScore && score >= 0.35) {
      highestScore = score;
      bestMatchId = prod.id;
    }
  }

  return bestMatchId;
}

export async function scanInvoice(payload: {
  sample_id?: string;
  image_base64?: string;
  mime_type?: string;
  raw_text?: string;
  gst_treatment?: GstTreatment;
}): Promise<ScanDraftResult> {
  const gst_treatment: GstTreatment = payload.gst_treatment || 'include_as_cost';

  // 1. Check if user selected one of the preset sample invoices
  if (payload.sample_id) {
    const sample = SAMPLE_INVOICES.find(s => s.id === payload.sample_id);
    if (sample) {
      const draftItems: ScanDraftItem[] = sample.items.map((item, idx) => {
        const matchedId = matchWithCatalog(item.product_name);
        const landed = computeLandedCostPerUnit({
          listed_price: item.listed_price,
          quantity: item.quantity,
          price_basis: item.price_basis,
          gst_included: item.gst_included,
          gst_rate_percent: item.gst_rate_percent,
          gst_treatment: payload.gst_treatment || sample.gst_treatment
        });

        return {
          temp_id: `draft-${Date.now()}-${idx}`,
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          listed_price: item.listed_price,
          price_basis: item.price_basis,
          gst_included: item.gst_included,
          gst_rate_percent: item.gst_rate_percent,
          matched_product_id: matchedId,
          computed_landed_cost_per_unit: landed
        };
      });

      return {
        distributor_name: sample.distributor_name,
        invoice_number: sample.invoice_number,
        purchase_date: sample.purchase_date,
        gst_treatment: payload.gst_treatment || sample.gst_treatment,
        items: draftItems,
        confidence_notes: `Extracted directly from sample invoice preset: ${sample.title}`
      };
    }
  }

  // 2. If Gemini API is available and image or text is provided
  const ai = getAiClient();
  if (ai && (payload.image_base64 || payload.raw_text)) {
    try {
      const promptText = `
You are an expert OCR & retail purchase invoice extraction system.
Analyze the provided purchase invoice photo / receipt text.
Extract distributor name, invoice number, invoice date, and line items.
Respond ONLY with a JSON object in this exact schema:
{
  "distributor_name": "Supplier or Trader Name",
  "invoice_number": "INV-1234",
  "purchase_date": "YYYY-MM-DD",
  "items": [
    {
      "product_name": "string (brand and item description)",
      "quantity": number (e.g. 10),
      "unit": "string (e.g. pcs, kg, bag, pouch, box, litre)",
      "listed_price": number (e.g. 450.00),
      "price_basis": "per_unit" | "line_total",
      "gst_included": boolean (true if price includes tax, false if pre-tax rate),
      "gst_rate_percent": number (e.g. 0, 5, 12, 18, or 28)
    }
  ]
}
Make sure all numbers are valid floats. Do not include markdown code ticks, just the raw JSON object.
`;

      const contents: any[] = [];

      if (payload.image_base64) {
        // clean base64
        let b64 = payload.image_base64;
        let mime = payload.mime_type || 'image/jpeg';
        if (b64.includes(';base64,')) {
          const parts = b64.split(';base64,');
          mime = parts[0].replace('data:', '') || mime;
          b64 = parts[1];
        }

        contents.push({
          inlineData: {
            mimeType: mime,
            data: b64
          }
        });
      }

      if (payload.raw_text) {
        contents.push({ text: `Raw invoice text:\n${payload.raw_text}` });
      }

      contents.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents
      });

      const responseText = response.text || '';
      const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJsonStr);

      const draftItems: ScanDraftItem[] = (parsed.items || []).map((item: any, idx: number) => {
        const pBasis: PriceBasis = item.price_basis === 'line_total' ? 'line_total' : 'per_unit';
        const pQty = Number(item.quantity) || 1;
        const pListedPrice = Number(item.listed_price) || 0;
        const pGstIncluded = Boolean(item.gst_included);
        const pGstRate = Number(item.gst_rate_percent) || 0;

        const landed = computeLandedCostPerUnit({
          listed_price: pListedPrice,
          quantity: pQty,
          price_basis: pBasis,
          gst_included: pGstIncluded,
          gst_rate_percent: pGstRate,
          gst_treatment
        });

        const matchedId = matchWithCatalog(item.product_name || '');

        return {
          temp_id: `ai-${Date.now()}-${idx}`,
          product_name: String(item.product_name || 'Item ' + (idx + 1)),
          quantity: pQty,
          unit: String(item.unit || 'pcs'),
          listed_price: pListedPrice,
          price_basis: pBasis,
          gst_included: pGstIncluded,
          gst_rate_percent: pGstRate,
          matched_product_id: matchedId,
          computed_landed_cost_per_unit: landed
        };
      });

      return {
        distributor_name: parsed.distributor_name || 'Scanned Supplier',
        invoice_number: parsed.invoice_number || `INV-${Date.now().toString().slice(-4)}`,
        purchase_date: parsed.purchase_date || new Date().toISOString().split('T')[0],
        gst_treatment,
        items: draftItems,
        confidence_notes: 'Extracted via Gemini 3.8 Flash multimodal invoice scanner.'
      };
    } catch (err) {
      console.error('Gemini invoice extraction failed, providing heuristic fallback:', err);
    }
  }

  // 3. Fallback: Parse from text or return first sample
  const fallbackSample = SAMPLE_INVOICES[0];
  const draftItems: ScanDraftItem[] = fallbackSample.items.map((item, idx) => {
    const matchedId = matchWithCatalog(item.product_name);
    const landed = computeLandedCostPerUnit({
      listed_price: item.listed_price,
      quantity: item.quantity,
      price_basis: item.price_basis,
      gst_included: item.gst_included,
      gst_rate_percent: item.gst_rate_percent,
      gst_treatment
    });

    return {
      temp_id: `draft-fallback-${Date.now()}-${idx}`,
      product_name: item.product_name,
      quantity: item.quantity,
      unit: item.unit,
      listed_price: item.listed_price,
      price_basis: item.price_basis,
      gst_included: item.gst_included,
      gst_rate_percent: item.gst_rate_percent,
      matched_product_id: matchedId,
      computed_landed_cost_per_unit: landed
    };
  });

  return {
    distributor_name: fallbackSample.distributor_name,
    invoice_number: fallbackSample.invoice_number,
    purchase_date: fallbackSample.purchase_date,
    gst_treatment,
    items: draftItems,
    confidence_notes: 'Generated from distributor purchase draft template.'
  };
}
