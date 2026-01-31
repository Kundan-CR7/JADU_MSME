import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../api';
import {
    Search,
    Plus,
    Filter,
    MoreHorizontal,
    Star,
    Truck,
    MapPin,
    Phone,
    Mail,
    Edit2,
    Trash2,
    X,
    Save,
    ArrowUpDown,
    CheckCircle2
} from 'lucide-react';

const SuppliersView = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [stats, setStats] = useState({ totalSuppliers: 0, avgReliability: 0, avgDeliveryTime: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // User role check for permissions
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role === 'ADMIN';

    const [formData, setFormData] = useState({
        name: '',
        contactInfo: '',
        reliabilityScore: 5.0,
        avgDeliveryTimeDays: ''
    });

    useEffect(() => {
        fetchSuppliers();
        fetchStats();
    }, []);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/suppliers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSuppliers(data);
            }
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch suppliers', err);
            setError('Failed to load suppliers');
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/suppliers/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Failed to fetch stats', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openModal = (supplier = null) => {
        if (supplier) {
            setCurrentSupplier(supplier);
            setFormData({
                name: supplier.name,
                contactInfo: supplier.contactInfo || '',
                reliabilityScore: supplier.reliabilityScore,
                avgDeliveryTimeDays: supplier.avgDeliveryTimeDays || ''
            });
        } else {
            setCurrentSupplier(null);
            setFormData({
                name: '',
                contactInfo: '',
                reliabilityScore: 5.0,
                avgDeliveryTimeDays: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = currentSupplier
                ? `${API_BASE_URL}/suppliers/${currentSupplier.id}`
                : `${API_BASE_URL}/suppliers`;
            const method = currentSupplier ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to save supplier');

            setIsModalOpen(false);
            fetchSuppliers();
            fetchStats();
        } catch (err) {
            console.error(err);
            alert('Failed to save supplier');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this supplier?')) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to delete supplier');
            fetchSuppliers();
            fetchStats();
        } catch (err) {
            console.error(err);
            alert('Failed to delete supplier');
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.contactInfo && s.contactInfo.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const renderStars = (score) => {
        return (
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        size={12}
                        className={i < Math.round(score) ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                    />
                ))}
                <span className="text-xs text-slate-500 ml-1 font-medium">{Number(score).toFixed(1)}</span>
            </div>
        );
    };

    if (loading) return <div className="flex h-64 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#033543]"></div></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header & Stats */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Supplier Network</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage partnerships and track performance.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#033543] text-white rounded-xl hover:bg-[#054b5e] transition-all shadow-lg shadow-[#033543]/20 hover:shadow-[#033543]/30 active:scale-95 font-medium text-sm"
                >
                    <Plus size={18} />
                    Add Supplier
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Truck size={24} />
                    </div>
                    <div>
                        <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Suppliers</div>
                        <div className="text-2xl font-bold text-slate-800">{stats.totalSuppliers}</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <Star size={24} />
                    </div>
                    <div>
                        <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Avg. Reliability</div>
                        <div className="text-2xl font-bold text-slate-800">{Number(stats.avgReliability).toFixed(1)} / 5.0</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Avg. Delivery</div>
                        <div className="text-2xl font-bold text-slate-800">{stats.avgDeliveryTime ? Math.round(stats.avgDeliveryTime) : '-'} <span className="text-sm font-normal text-slate-500">days</span></div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search suppliers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543] transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                                <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Info</th>
                                <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reliability</th>
                                <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead Time (Avg)</th>
                                <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredSuppliers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">No suppliers found.</td>
                                </tr>
                            ) : (
                                filteredSuppliers.map((supplier) => (
                                    <tr key={supplier.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="p-4">
                                            <div className="font-semibold text-slate-800 text-sm">{supplier.name}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">ID: {supplier.id.substring(0, 8)}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                {supplier.contactInfo && (
                                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                                        <Mail size={12} className="text-slate-400" />
                                                        <span className="truncate max-w-[150px]">{supplier.contactInfo}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {renderStars(supplier.reliabilityScore)}
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm text-slate-700">{supplier.avgDeliveryTimeDays || '-'} days</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openModal(supplier)} className="p-2 hover:bg-slate-100 text-slate-500 hover:text-[#033543] rounded-lg transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                                {isAdmin && (
                                                    <button onClick={() => handleDelete(supplier.id)} className="p-2 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-lg transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800">{currentSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Company Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543] outline-none"
                                    placeholder="e.g. Apex Auto Parts"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Contact Info / Email</label>
                                <input
                                    type="text"
                                    name="contactInfo"
                                    value={formData.contactInfo}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543] outline-none"
                                    placeholder="contact@apexparts.com"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Reliability Score (1-5)</label>
                                    <input
                                        type="number"
                                        name="reliabilityScore"
                                        min="1"
                                        max="5"
                                        step="0.1"
                                        value={formData.reliabilityScore}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543] outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Avg Delivery (Days)</label>
                                    <input
                                        type="number"
                                        name="avgDeliveryTimeDays"
                                        value={formData.avgDeliveryTimeDays}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543] outline-none"
                                        placeholder="e.g. 3"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-3 bg-[#033543] text-white rounded-xl font-semibold hover:bg-[#054b5e] transition-colors shadow-lg shadow-[#033543]/20 hover:shadow-[#033543]/30 active:scale-95 flex items-center justify-center gap-2 mt-4"
                            >
                                <Save size={18} />
                                {currentSupplier ? 'Update Supplier' : 'Create Supplier'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuppliersView;
