
import React, { useState, useEffect } from 'react';
import {
    Search,
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    CreditCard,
    User,
    CheckCircle,
    Package,
    Clock,
    Filter,
    X
} from 'lucide-react';
import API_BASE_URL from '../api';

const SalesView = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [checkoutStatus, setCheckoutStatus] = useState('idle'); // idle, processing, success, error

    // Fetch Products
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/inventory`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data);
                }
            } catch (err) {
                console.error("Failed to fetch products", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Cart Logic
    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, cartQty: item.cartQty + 1 }
                        : item
                );
            }
            return [...prev, { ...product, cartQty: 1 }];
        });
    };

    const updateQty = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.cartQty + delta);
                // Check stock limit (optional, nice to have)
                if (delta > 0 && newQty > item.currentStock) return item;
                return { ...item, cartQty: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.cartQty), 0);
    const tax = cartTotal * 0.18; // Example GST 18%
    const grandTotal = cartTotal + tax;

    // Filter Products
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Checkout
    const handleCheckout = async () => {
        setCheckoutStatus('processing');
        try {
            const token = localStorage.getItem('token');
            const invoiceId = `INV-${Date.now()}`;

            const payload = {
                invoiceId,
                customerName: customerName || 'Walk-in Customer',
                totalAmount: grandTotal,
                items: cart.map(item => ({
                    itemCode: item.code,
                    quantity: item.cartQty,
                    price: item.sellingPrice
                }))
            };

            const res = await fetch(`${API_BASE_URL}/sales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Checkout failed");

            setCheckoutStatus('success');
            setTimeout(() => {
                setCart([]);
                setIsCheckoutModalOpen(false);
                setCheckoutStatus('idle');
                setCustomerName('');
            }, 2000);

        } catch (err) {
            console.error(err);
            setCheckoutStatus('error');
        }
    };

    return (
        <div className="h-full flex flex-col lg:flex-row gap-6">

            {/* Left Panel: Product Grid */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Search Bar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search products by name or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#033543]/20 transition-all"
                        />
                    </div>
                    <button className="p-2 text-slate-500 hover:text-[#033543] bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100">
                        <Filter size={20} />
                    </button>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#033543]"></div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProducts.map(product => (
                                <div key={product.id} className="bg-white p-4 rounded-xl border border-slate-100 hover:shadow-md transition-all group flex flex-col justify-between h-48">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded uppercase">{product.code}</span>
                                            {product.currentStock <= product.reorderPoint && (
                                                <span className="text-[10px] font-bold text-red-500">Low Stock</span>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-slate-800 line-clamp-2 mb-1">{product.name}</h3>
                                        <p className="text-xs text-slate-500">{product.category ? product.category.name : 'Uncategorized'}</p>
                                    </div>

                                    <div className="flex items-end justify-between mt-4">
                                        <div>
                                            <div className="text-lg font-bold text-[#033543]">₹ {product.sellingPrice}</div>
                                            <div className="text-xs text-slate-400">{product.currentStock} units available</div>
                                        </div>
                                        <button
                                            onClick={() => addToCart(product)}
                                            disabled={product.currentStock <= 0}
                                            className="p-2 bg-[#033543] text-white rounded-lg shadow-lg shadow-[#033543]/20 hover:bg-[#054b5e] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Right Panel: Cart */}
            <div className="w-full lg:w-96 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full lg:h-auto overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-[#033543] rounded-lg">
                        <ShoppingCart size={20} className="text-white" />
                    </div>
                    <h2 className="font-bold text-slate-800 text-lg">Current Order</h2>
                    <span className="ml-auto bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">{cart.length} items</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                            <ShoppingCart size={48} className="opacity-20" />
                            <p className="text-sm">Cart is empty</p>
                            <p className="text-xs text-center px-8">Select items from the list to start a new order.</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 group">
                                <div className="flex-1">
                                    <h4 className="font-medium text-slate-800 text-sm line-clamp-1">{item.name}</h4>
                                    <div className="text-xs text-slate-500 mt-1">₹ {item.sellingPrice} x {item.cartQty}</div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="font-bold text-slate-800 text-sm">₹ {item.sellingPrice * item.cartQty}</div>
                                    <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-0.5">
                                        <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-slate-100 rounded text-slate-500">
                                            {item.cartQty === 1 ? <Trash2 size={12} className="text-red-500" onClick={() => removeFromCart(item.id)} /> : <Minus size={12} />}
                                        </button>
                                        <span className="text-xs font-medium w-4 text-center">{item.cartQty}</span>
                                        <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-slate-100 rounded text-slate-500">
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>Subtotal</span>
                            <span>₹ {cartTotal}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>Tax (18%)</span>
                            <span>₹ {tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-slate-800 pt-2 border-t border-slate-200">
                            <span>Total</span>
                            <span>₹ {grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                    <button
                        disabled={cart.length === 0}
                        onClick={() => setIsCheckoutModalOpen(true)}
                        className="w-full py-3 bg-[#033543] text-white rounded-xl font-semibold shadow-lg shadow-[#033543]/20 hover:bg-[#054b5e] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        Proceed to Checkout
                        <CreditCard size={18} />
                    </button>
                </div>
            </div>

            {/* Checkout Modal */}
            {isCheckoutModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        {checkoutStatus === 'success' ? (
                            <div className="p-8 flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Order Processed!</h3>
                                <p className="text-slate-500">The transaction has been recorded successfully.</p>
                            </div>
                        ) : (
                            <>
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h3 className="text-lg font-bold text-slate-800">Complete Payment</h3>
                                    <button onClick={() => setIsCheckoutModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                        <X size={20} /> // Fix: Need X imported or use simple 'x'
                                    </button>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Customer Name (Optional)</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#033543]/20"
                                                placeholder="Enter name..."
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Total Amount</span>
                                            <span className="font-bold text-slate-800">₹ {grandTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Payment Method</span>
                                            <div className="flex gap-2">
                                                <span className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600">Cash</span>
                                                <span className="px-2 py-1 bg-[#033543] text-white rounded text-xs font-medium">UPI/Card</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCheckout}
                                        disabled={checkoutStatus === 'processing'}
                                        className="w-full py-3 bg-[#033543] text-white rounded-xl font-semibold shadow-lg shadow-[#033543]/20 hover:bg-[#054b5e] active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                    >
                                        {checkoutStatus === 'processing' ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>Confirm Payment <CheckCircle size={18} /></>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Need to assure X is imported if used.
// Let's fix imports in the file creation block above. I used X in the modal close button.
// Updating import list.

export default SalesView;
