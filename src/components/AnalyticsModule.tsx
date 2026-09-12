import React, { useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  CreditCard, 
  ArrowUpRight, 
  Award, 
  Clock, 
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Sale, StoreAnalytics, Product } from '../types';

interface AnalyticsModuleProps {
  sales: Sale[];
  products: Product[];
  analytics: StoreAnalytics | null;
}

export const AnalyticsModule: React.FC<AnalyticsModuleProps> = ({
  sales,
  products,
  analytics
}) => {
  // Best sellers aggregation
  const itemPerformance = useMemo(() => {
    const map: Record<string, { name: string; quantitySold: number; totalRevenue: number; unit: string }> = {};

    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!map[item.product_id]) {
          map[item.product_id] = {
            name: item.product_name,
            quantitySold: 0,
            totalRevenue: 0,
            unit: item.unit || 'pcs'
          };
        }
        map[item.product_id].quantitySold += item.quantity;
        map[item.product_id].totalRevenue += item.line_total;
      });
    });

    return Object.values(map).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [sales]);

  // Payment methods breakdown
  const paymentBreakdown = useMemo(() => {
    let cash = 0;
    let upi = 0;
    let credit = 0;

    sales.forEach(s => {
      if (s.payment_method === 'cash') cash += s.total_amount;
      else if (s.payment_method === 'upi') upi += s.total_amount;
      else if (s.payment_method === 'credit') credit += s.total_amount;
    });

    const total = cash + upi + credit || 1;
    return {
      cash,
      upi,
      credit,
      cashPct: (cash / total) * 100,
      upiPct: (upi / total) * 100,
      creditPct: (credit / total) * 100
    };
  }, [sales]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Revenue
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            ₹{analytics ? analytics.total_revenue.toFixed(2) : '0.00'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {sales.length} completed transactions
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Gross Profit (Estimated)
          </span>
          <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
            ₹{analytics ? analytics.estimated_gross_profit.toFixed(2) : '0.00'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Revenue minus true weighted COGS
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Gross Profit Margin
          </span>
          <div className="text-2xl font-black text-teal-700 font-mono mt-1">
            {analytics ? analytics.gross_margin_percent : 0}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Store average markup health
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Inventory Valuation
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            ₹{analytics ? analytics.total_inventory_valuation.toFixed(2) : '0.00'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Current stock × weighted average cost
          </p>
        </div>
      </div>

      {/* 2-column Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Selling Products (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Product Sales Performance
            </h3>
            <span className="text-xs text-slate-400">Ranked by revenue</span>
          </div>

          <div className="space-y-3">
            {itemPerformance.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No sales completed yet.</p>
            ) : (
              itemPerformance.map((item, idx) => (
                <div
                  key={item.name}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <h4 className="font-semibold text-slate-900 truncate">{item.name}</h4>
                      <p className="text-[11px] text-slate-500">
                        {item.quantitySold} {item.unit} sold
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      ₹{item.totalRevenue.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Channels Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            Revenue by Payment Method
          </h3>

          <div className="space-y-4 pt-2">
            {/* Cash */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Cash</span>
                <span className="font-mono text-slate-900 font-bold">
                  ₹{paymentBreakdown.cash.toFixed(2)} ({paymentBreakdown.cashPct.toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${paymentBreakdown.cashPct}%` }}
                />
              </div>
            </div>

            {/* UPI */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">UPI / QR Code</span>
                <span className="font-mono text-slate-900 font-bold">
                  ₹{paymentBreakdown.upi.toFixed(2)} ({paymentBreakdown.upiPct.toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-teal-500 h-full rounded-full transition-all"
                  style={{ width: `${paymentBreakdown.upiPct}%` }}
                />
              </div>
            </div>

            {/* Credit */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Credit Ledger (Khata)</span>
                <span className="font-mono text-slate-900 font-bold">
                  ₹{paymentBreakdown.credit.toFixed(2)} ({paymentBreakdown.creditPct.toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${paymentBreakdown.creditPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sales Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900 text-sm">Completed POS Sales Ledger</h3>
          <p className="text-xs text-slate-500">Chronological sales records with line item snapshots</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                    #{s.id.slice(-6)}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(s.sale_date).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {s.customer_name || 'Walk-in'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {s.payment_method}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {s.items.map(i => `${i.product_name} (x${i.quantity})`).join(', ')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                    ₹{s.total_amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
