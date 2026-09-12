import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  AlertCircle, 
  CheckCircle2, 
  Printer, 
  ShoppingBag,
  PackageX,
  User,
  Phone
} from 'lucide-react';
import { Product, PaymentMethod, Sale } from '../types';

interface CartItem {
  product: Product;
  quantity: number;
}

interface POSModuleProps {
  products: Product[];
  onSaleComplete: () => void;
  createSale: (data: {
    payment_method: PaymentMethod;
    customer_name?: string;
    customer_phone?: string;
    items: { product_id: string; quantity: number }[];
  }) => Promise<Sale>;
}

export const POSModule: React.FC<POSModuleProps> = ({
  products,
  onSaleComplete,
  createSale
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered product catalog
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        p.name.toLowerCase().includes(q) || 
        (p.barcode && p.barcode.includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Add to cart
  const addToCart = (product: Product) => {
    setErrorMessage(null);
    if (product.current_stock <= 0) {
      setErrorMessage(`Cannot add "${product.name}": Out of stock (0 ${product.unit} available).`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.current_stock) {
          setErrorMessage(`Cannot exceed available stock of ${product.current_stock} ${product.unit} for "${product.name}".`);
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  // Update quantity
  const updateQuantity = (productId: string, newQty: number) => {
    setErrorMessage(null);
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQty > prod.current_stock) {
      setErrorMessage(`Cannot order ${newQty} ${prod.unit}. Only ${prod.current_stock} ${prod.unit} available in stock.`);
      return;
    }

    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setErrorMessage(null);
  };

  // Total cart calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.product.selling_price * item.quantity), 0);
  }, [cart]);

  // Handle Checkout submission
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cart.length === 0) {
      setErrorMessage('Cart is empty. Select products from the inventory catalog to checkout.');
      return;
    }

    if (paymentMethod === 'credit' && !customerName.trim()) {
      setErrorMessage('Customer name is required for Credit / Khata transactions to record in the credit ledger.');
      return;
    }

    // Client-side stock re-check
    for (const item of cart) {
      const liveProduct = products.find(p => p.id === item.product.id);
      const available = liveProduct ? liveProduct.current_stock : 0;
      if (item.quantity > available) {
        setErrorMessage(`Cannot complete sale: Insufficient stock for "${item.product.name}". Requested: ${item.quantity}, Available: ${available}.`);
        return;
      }
    }

    setIsCheckingOut(true);
    try {
      const sale = await createSale({
        payment_method: paymentMethod,
        customer_name: customerName.trim() || 'Walk-in Customer',
        customer_phone: customerPhone.trim() || undefined,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        }))
      });

      setLastCompletedSale(sale);
      clearCart();
      setCustomerName('');
      setCustomerPhone('');
      onSaleComplete();
    } catch (err: any) {
      setErrorMessage(err.message || 'Checkout failed. Please review stock and try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Banner / Error notice */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Sale Validation Error</p>
            <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Selection & Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="pos-search-input"
                type="text"
                placeholder="Search products by name, category, or barcode..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
                <PackageX className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">No products match your search</p>
                <p className="text-xs text-slate-400 mt-1">Try resetting the category filter or searching with different keywords.</p>
              </div>
            ) : (
              filteredProducts.map(product => {
                const inCart = cart.find(i => i.product.id === product.id);
                const isOutOfStock = product.current_stock <= 0;
                const isLowStock = !isOutOfStock && product.current_stock <= (product.reorder_threshold ?? 5);

                return (
                  <div
                    key={product.id}
                    id={`pos-product-${product.id}`}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`bg-white p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer select-none group ${
                      isOutOfStock
                        ? 'border-slate-200 bg-slate-50/70 opacity-60 cursor-not-allowed'
                        : inCart
                        ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-xs'
                        : 'border-slate-200 hover:border-emerald-400 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                          {product.category || 'General'}
                        </span>
                        {isOutOfStock ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Low: {product.current_stock} {product.unit}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {product.current_stock} {product.unit}
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-slate-800 text-sm mt-1 leading-snug group-hover:text-emerald-700 transition-colors">
                        {product.name}
                      </h3>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-base font-bold text-slate-900 font-mono">
                          ₹{product.selling_price.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Cost: ₹{product.average_cost.toFixed(2)} (+{product.markup_percent}%)
                        </div>
                      </div>

                      {inCart ? (
                        <div className="px-2.5 py-1 rounded-md bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs">
                          <span>{inCart.quantity} in cart</span>
                        </div>
                      ) : (
                        <button
                          disabled={isOutOfStock}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                            isOutOfStock
                              ? 'bg-slate-200 text-slate-400'
                              : 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Checkout Cart & Bill Register (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[calc(100vh-140px)] sticky top-20">
            {/* Cart Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <h2 className="font-bold text-slate-900 text-base">Active Checkout Cart</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {cart.reduce((acc, item) => acc + item.quantity, 0)} items
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  id="pos-clear-cart-btn"
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400">
                  <ShoppingBag className="w-12 h-12 text-slate-200 mb-3" />
                  <p className="font-semibold text-slate-600 text-sm">Cart is currently empty</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Click any item from the catalog on the left to add it to this billing register.
                  </p>
                </div>
              ) : (
                cart.map(item => {
                  const lineTotal = item.product.selling_price * item.quantity;
                  const isMax = item.quantity >= item.product.current_stock;

                  return (
                    <div
                      key={item.product.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-800 truncate text-xs sm:text-sm">
                          {item.product.name}
                        </h4>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          ₹{item.product.selling_price.toFixed(2)} × {item.quantity} = ₹{lineTotal.toFixed(2)}
                        </div>
                        {isMax && (
                          <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                            Max stock reached ({item.product.current_stock} {item.product.unit})
                          </div>
                        )}
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-md bg-white border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-mono font-bold text-xs">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={isMax}
                          className={`w-7 h-7 rounded-md border flex items-center justify-center transition-colors ${
                            isMax
                              ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="w-7 h-7 ml-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Checkout Form & Details */}
            <form onSubmit={handleCheckout} className="p-4 bg-white border-t border-slate-200 space-y-3">
              {/* Customer Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    id="pos-customer-name"
                    type="text"
                    placeholder="Customer Name (Walk-in)"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    id="pos-customer-phone"
                    type="text"
                    placeholder="Phone (Optional)"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    Cash
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'upi'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    UPI / QR
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'credit'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Credit (Khata)
                  </button>
                </div>
                {paymentMethod === 'credit' && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-md border border-amber-200 mt-2">
                    Note: This sale amount will be recorded as outstanding dues under {customerName || 'the customer'} in the Credit Ledger.
                  </p>
                )}
              </div>

              {/* Total & Checkout Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Total Amount</span>
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    ₹{cartSubtotal.toFixed(2)}
                  </span>
                </div>

                <button
                  id="pos-checkout-btn"
                  type="submit"
                  disabled={cart.length === 0 || isCheckingOut}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 ${
                    cart.length === 0 || isCheckingOut
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                  }`}
                >
                  {isCheckingOut ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete Sale</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Sale Receipt Confirmation Modal */}
      {lastCompletedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-600 p-6 text-white text-center">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold">Sale Completed Successfully!</h3>
              <p className="text-emerald-100 text-xs mt-1">
                Receipt #{lastCompletedSale.id.slice(-6)} • Stock updated in catalog
              </p>
            </div>

            {/* Thermal Slip Body */}
            <div className="p-6 font-mono text-xs space-y-3 bg-slate-50 border-b border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Date:</span>
                <span>{new Date(lastCompletedSale.sale_date).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Customer:</span>
                <span className="font-semibold text-slate-800">{lastCompletedSale.customer_name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment:</span>
                <span className="uppercase font-semibold text-slate-800">{lastCompletedSale.payment_method}</span>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-3 space-y-1.5">
                {lastCompletedSale.items.map(item => (
                  <div key={item.id || item.product_name} className="flex justify-between text-slate-700">
                    <span className="truncate max-w-[200px]">{item.product_name} x{item.quantity}</span>
                    <span className="font-semibold">₹{item.line_total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-slate-800 pt-2 flex justify-between font-bold text-sm text-slate-900">
                <span>NET TOTAL PAID:</span>
                <span>₹{lastCompletedSale.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-4 bg-white flex items-center justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
              <button
                onClick={() => setLastCompletedSale(null)}
                className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
