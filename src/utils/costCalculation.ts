import { GstTreatment, PriceBasis } from '../types';

/**
 * Calculates the true landed cost per unit based on:
 * - listed price and price basis (per_unit or line_total)
 * - GST included flag and GST rate percentage
 * - GST treatment toggle (include_as_cost or exclude_as_cost)
 */
export function computeLandedCostPerUnit(params: {
  listed_price: number;
  quantity: number;
  price_basis: PriceBasis;
  gst_included: boolean;
  gst_rate_percent: number;
  gst_treatment: GstTreatment;
}): number {
  const { listed_price, quantity, price_basis, gst_included, gst_rate_percent, gst_treatment } = params;
  
  const qty = quantity > 0 ? quantity : 1;
  const base_unit = price_basis === 'line_total' ? (listed_price / qty) : listed_price;
  const rate = Math.max(0, (gst_rate_percent || 0)) / 100;

  let landed = base_unit;

  if (gst_treatment === 'include_as_cost') {
    // Merchant treats tax paid as part of item inventory cost
    if (gst_included) {
      // Listed price already has tax inside it
      landed = base_unit;
    } else {
      // Tax will be added on invoice, increasing real landed expenditure
      landed = base_unit * (1 + rate);
    }
  } else {
    // exclude_as_cost: Merchant claims GST Input Tax Credit (ITC), so tax is refunded
    if (gst_included) {
      // Strip out the tax from base unit
      landed = rate > 0 ? (base_unit / (1 + rate)) : base_unit;
    } else {
      // Listed price is net base; billed tax is claimed back as ITC
      landed = base_unit;
    }
  }

  return Math.round((landed + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates new running weighted average cost when new inventory arrives:
 * new_avg = ((old_stock * old_avg) + (qty * landed_cost)) / (old_stock + qty)
 */
export function computeWeightedAverageCost(
  currentStock: number,
  currentAvgCost: number,
  incomingQty: number,
  landedCost: number
): number {
  if (incomingQty <= 0) return currentAvgCost;
  if (currentStock <= 0) {
    return Math.round((landedCost + Number.EPSILON) * 100) / 100;
  }

  const totalCost = (currentStock * currentAvgCost) + (incomingQty * landedCost);
  const totalStock = currentStock + incomingQty;
  const newAvg = totalCost / totalStock;

  return Math.round((newAvg + Number.EPSILON) * 100) / 100;
}

/**
 * Recalculates selling price based on average cost and markup percent:
 * selling_price = average_cost * (1 + markup_percent / 100)
 */
export function computeSellingPrice(averageCost: number, markupPercent: number): number {
  const price = averageCost * (1 + (markupPercent || 0) / 100);
  return Math.round((price + Number.EPSILON) * 100) / 100;
}
