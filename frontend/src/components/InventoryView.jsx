import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Search,
    Plus,
    Filter,
    MoreHorizontal,
    AlertCircle,
    CheckCircle2,
    ArrowUpDown,
    Download,
    Settings as SettingsIcon,
    X,
    Save
} from 'lucide-react';

const InventoryView = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [adjustForm, setAdjustForm] = useState({ itemId: '', batchId: '', quantityChange: 0, reason: '' });

    // Fetch Real Data
    const fetchInventory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:3000/inventory', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(res.data);
        } catch (err) {
            console.error("Failed to fetch inventory", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:3000/inventory/adjust', adjustForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsAdjustModalOpen(false);
            fetchInventory(); // Refresh
            setAdjustForm({ itemId: '', batchId: '', quantityChange: 0, reason: '' });
        } catch (err) {
            alert('Failed to adjust stock: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Inventory Management</h2>
                    <p className="text-slate-500 text-sm mt-1">Track stock levels, prices, and product details.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsAdjustModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm"
                    >
                        <SettingsIcon size={18} />
                        Manual Adjustment
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#033543] text-white rounded-xl hover:bg-[#054b5e] transition-all shadow-lg shadow-[#033543]/20 hover:shadow-[#033543]/30 active:scale-95 font-medium text-sm">
                        <Plus size={18} />
                        Add Product
                    </button>
                </div>
            </div>

            {/* Stats Cards (Static for now, can be dynamic later) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Total Products" value={products.length} color="blue" />
                <StatCard label="Total Value" value={`₹ ${products.reduce((acc, p) => acc + (p.currentStock * p.sellingPrice), 0).toLocaleString()}`} color="emerald" />
                <StatCard label="Low Stock Items" value={products.filter(p => p.currentStock <= p.reorderPoint).length} color="amber" />
                <StatCard label="Out of Stock" value={products.filter(p => p.currentStock === 0).length} color="red" />
            </div>

            {/* Filters & Table Container */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading Inventory...</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Info</th>
                                    <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                                    <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                                    <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price (Sell)</th>
                                    <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {products.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-800 text-sm">{product.name}</span>
                                                <span className="text-xs text-slate-400 font-mono mt-0.5">{product.code}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                {product.category?.name || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${product.currentStock === 0 ? 'bg-red-500' :
                                                    product.currentStock <= product.reorderPoint ? 'bg-amber-500' :
                                                        'bg-emerald-500'
                                                    }`}></div>
                                                <span className={`text-sm font-medium ${product.currentStock <= product.reorderPoint ? 'text-amber-600' : 'text-slate-700'
                                                    }`}>
                                                    {product.currentStock} Units
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-semibold text-slate-700 text-sm">₹ {product.sellingPrice}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${product.isActive
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : 'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}>
                                                {product.isActive ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Manual Adjustment Modal */}
            {isAdjustModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Manual Stock Adjustment</h3>
                            <button onClick={() => setIsAdjustModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAdjustSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Item ID (UUID)</label>
                                <input
                                    type="text"
                                    required
                                    value={adjustForm.itemId}
                                    onChange={e => setAdjustForm({ ...adjustForm, itemId: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                    placeholder="Enter Item UUID"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Batch ID (UUID)</label>
                                <input
                                    type="text"
                                    required
                                    value={adjustForm.batchId}
                                    onChange={e => setAdjustForm({ ...adjustForm, batchId: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                    placeholder="Enter Batch UUID"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity Change (+/-)</label>
                                <input
                                    type="number"
                                    required
                                    value={adjustForm.quantityChange}
                                    onChange={e => setAdjustForm({ ...adjustForm, quantityChange: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                />
                                <p className="text-xs text-slate-500 mt-1">Use negative values for reduction (e.g. -5).</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                                <input
                                    type="text"
                                    required
                                    value={adjustForm.reason}
                                    onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                    placeholder="e.g. Damaged during shipping"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-[#033543] text-white rounded-xl font-medium hover:bg-[#054b5e] transition-colors"
                            >
                                <Save size={18} />
                                Confirm Adjustment
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper Component for Stats
const StatCard = ({ label, value, color }) => {
    const colors = {
        blue: 'text-blue-600 bg-blue-50',
        emerald: 'text-emerald-600 bg-emerald-50',
        amber: 'text-amber-600 bg-amber-50',
        red: 'text-red-600 bg-red-50',
    };

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <h4 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">{label}</h4>
            <div className={`text-2xl font-bold ${colors[color].split(' ')[0]}`}>{value}</div>
        </div>
    );
};

export default InventoryView;
