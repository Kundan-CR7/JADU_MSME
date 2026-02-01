
import React, { useState, useRef, useEffect } from 'react';
import API_BASE_URL from '../api';
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
    Upload,
    Trash2,
    Edit2,
    X,
    Save,
    FileText,
    Settings as SettingsIcon,
} from 'lucide-react';

const InventoryView = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Import Options Modal State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importType, setImportType] = useState(null); // 'csv' or 'pdf'

    // Stock Edit Modal State
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [stockAdjustment, setStockAdjustment] = useState({ id: null, name: '', amount: '' });

    // Manual Adjustment State
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [adjustForm, setAdjustForm] = useState({ itemId: '', batchId: '', quantityChange: 0, reason: '' });

    // Category "Add New" State
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const [currentProduct, setCurrentProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        category: '',
        costPrice: '',
        sellingPrice: '',
        reorderPoint: 10,
        initialStock: 0,
        stock: 0,
        isActive: true
    });

    // File upload ref
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchInventory();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/inventory/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            }
        } catch (err) {
            console.error('Failed to fetch categories', err);
        }
    };

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/inventory`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch inventory');

            const data = await response.json();

            const mappedProducts = data.map(item => ({
                id: item.id,
                code: item.code,
                name: item.name,
                category: item.category?.name || 'Uncategorized',
                categoryId: item.categoryId,
                stock: item.currentStock || 0,
                reorderPoint: item.reorderPoint,
                costPrice: item.costPrice,
                sellingPrice: item.sellingPrice,
                status: item.isActive ? 'ACTIVE' : 'INACTIVE',
                isActive: item.isActive,
                currentStock: item.currentStock || 0
            }));

            setProducts(mappedProducts);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching inventory:', err);
            setError('Failed to load inventory data');
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const openModal = (product = null) => {
        setIsAddingCategory(false);
        setNewCategoryName('');

        if (product) {
            setCurrentProduct(product);
            setFormData({
                name: product.name || '',
                code: product.code || '',
                category: product.category || '',
                costPrice: product.costPrice || '',
                sellingPrice: product.sellingPrice || '',
                reorderPoint: product.reorderPoint || 10,
                initialStock: 0,
                stock: product.stock || 0,
                isActive: product.isActive ?? true
            });
        } else {
            setCurrentProduct(null);
            setFormData({
                name: '',
                code: '',
                category: '',
                costPrice: '',
                sellingPrice: '',
                reorderPoint: 10,
                initialStock: 0,
                stock: 0,
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = currentProduct
                ? `${API_BASE_URL}/inventory/${currentProduct.id}`
                : `${API_BASE_URL}/inventory`;

            const method = currentProduct ? 'PUT' : 'POST';

            // Use the new category name if "Add New" was used
            const finalCategory = isAddingCategory ? newCategoryName : formData.category;

            const payload = { ...formData, category: finalCategory };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to save product');

            setIsModalOpen(false);
            fetchInventory();
            fetchCategories(); // Refresh categories in case new one was added
        } catch (err) {
            console.error(err);
            alert('Failed to save product');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to delete product');

            fetchInventory();
        } catch (err) {
            console.error(err);
            alert('Failed to delete product');
        }
    };

    const handleExport = () => {
        const headers = ['Name,Code,Category,Stock,Cost Price,Selling Price,Status'];
        const csvContent = products.map(p =>
            `"${p.name}","${p.code}","${p.category}",${p.stock},${p.costPrice},${p.sellingPrice},${p.status}`
        ).join('\n');

        const blob = new Blob([headers + '\n' + csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'inventory_export.csv';
        a.click();
    };

    const handleImportButtonClick = () => {
        setIsImportModalOpen(true);
    };

    const triggerFileArgs = (type) => {
        setImportType(type);
        setIsImportModalOpen(false); // Close modal
        setTimeout(() => {
            if (fileInputRef.current) {
                fileInputRef.current.accept = type === 'csv' ? '.csv' : '.pdf';
                fileInputRef.current.click();
            }
        }, 100);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (importType === 'pdf') {
            alert('PDF Import is currently a placeholder feature. Coming soon!');
            e.target.value = null;
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/inventory/import`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) throw new Error('Import failed');

            const result = await response.json();
            alert(result.message);
            fetchInventory();
        } catch (err) {
            console.error(err);
            alert('Failed to import file');
        }

        // Reset input
        e.target.value = null;
    };

    // Stock Adjustment Logic
    const openStockModal = (product) => {
        setStockAdjustment({ id: product.id, name: product.name, amount: '' });
        setIsStockModalOpen(true);
    };

    const handleStockSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/inventory/${stockAdjustment.id}/adjust`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quantityChange: parseInt(stockAdjustment.amount) })
            });

            if (!response.ok) throw new Error('Failed to adjust stock');

            setIsStockModalOpen(false);
            fetchInventory();
        } catch (err) {
            console.error(err);
            alert('Failed to update stock');
        }
    };

    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/inventory/adjust`, adjustForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsAdjustModalOpen(false);
            fetchInventory(); // Refresh
            setAdjustForm({ itemId: '', batchId: '', quantityChange: 0, reason: '' });
        } catch (err) {
            alert('Failed to adjust stock: ' + (err.response?.data?.error || err.message));
        }
    };

    // Render Logic
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#033543]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64 text-red-500">
                <AlertCircle className="mr-2" size={20} />
                {error}
            </div>
        );
    }

    const totalProducts = products.length;
    // Calculate total value safely
    const totalValue = products.reduce((acc, curr) => acc + (Number(curr.sellingPrice || 0) * (curr.stock || 0)), 0);
    const lowStockCount = products.filter(p => p.stock <= p.reorderPoint).length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;

    return (
      <div className="space-y-6 animate-in fade-in duration-500 relative">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Inventory Management
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Track stock levels, prices, and product details.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleImportButtonClick}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm"
            >
              <Upload size={18} />
              Import
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm"
            >
              <Download size={18} />
              Export
            </button>

            <button
              onClick={() => setIsAdjustModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm"
            >
              <SettingsIcon size={18} />
              Manual Adjustment
            </button>

            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2 bg-[#033543] text-white rounded-xl hover:bg-[#054b5e] transition-all shadow-lg shadow-[#033543]/20 hover:shadow-[#033543]/30 active:scale-95 font-medium text-sm"
            >
              <Plus size={18} />
              Add Product
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Products" value={totalProducts} color="blue" />
          <StatCard
            label="Total Value"
            value={`₹ ${(totalValue / 1000).toFixed(1)}k`}
            color="emerald"
          />
          <StatCard
            label="Low Stock Items"
            value={lowStockCount}
            color="amber"
          />
          <StatCard label="Out of Stock" value={outOfStockCount} color="red" />
        </div>

        {/* Filters & Table Container */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
            <div className="relative w-full sm:w-80">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by name, code, or category..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543] transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Product Info
                  </th>
                  <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                      Stock
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Price (Sell)
                  </th>
                  <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 text-sm">
                            {product.name}
                          </span>
                          <span className="text-xs text-slate-400 font-mono mt-0.5">
                            {product.code}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          {product.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <div
                          className="flex items-center gap-2 group/stock cursor-pointer"
                          title="Click to adjust stock"
                          onClick={() => openStockModal(product)}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
                              product.stock === 0
                                ? "bg-red-500"
                                : product.stock <= product.reorderPoint
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                            }`}
                          ></div>
                          <span
                            className={`text-sm font-medium ${
                              product.stock <= product.reorderPoint
                                ? "text-amber-600"
                                : "text-slate-700"
                            }`}
                          >
                            {product.stock} Units
                          </span>
                          <Edit2
                            size={12}
                            className="text-slate-300 group-hover/stock:text-slate-500 opacity-0 group-hover/stock:opacity-100 transition-all"
                          />
                        </div>
                        {product.stock <= product.reorderPoint && (
                          <span className="text-[10px] text-red-500 font-medium block mt-1">
                            Low Stock (Min: {product.reorderPoint})
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-700 text-sm">
                          ₹ {product.sellingPrice}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            product.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openModal(product)}
                            className="p-2 hover:bg-slate-100 text-slate-500 hover:text-[#033543] rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-2 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-lg transition-colors"
                            >
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

          <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center">
            <span className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {products.length}
              </span>{" "}
              items
            </span>
          </div>
        </div>

        {/* Import Options Modal */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  Import Inventory
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Choose a file format to import your inventory data.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => triggerFileArgs("csv")}
                    className="w-full flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">
                        Import CSV
                      </div>
                      <div className="text-xs text-slate-500">
                        Spreadsheet data
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => triggerFileArgs("pdf")}
                    className="w-full flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">
                        Import PDF
                      </div>
                      <div className="text-xs text-slate-500">
                        Document data (Coming Soon)
                      </div>
                    </div>
                  </button>
                </div>

                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="mt-6 w-full py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stock Adjustment Modal */}
        {isStockModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800">
                  Adjust Stock
                </h3>
                <button
                  onClick={() => setIsStockModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleStockSubmit} className="p-6">
                <p className="text-sm text-slate-500 mb-4">
                  Updating stock for{" "}
                  <span className="font-semibold text-slate-800">
                    {stockAdjustment.name}
                  </span>
                  . Enter positive value to add, negative to remove.
                </p>
                <div className="space-y-1 mb-6">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Quantity Change
                  </label>
                  <input
                    type="number"
                    required
                    value={stockAdjustment.amount}
                    onChange={(e) =>
                      setStockAdjustment((prev) => ({
                        ...prev,
                        amount: e.target.value || "",
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543] outline-none"
                    placeholder="+10 or -5"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#033543] text-white rounded-xl font-semibold hover:bg-[#054b5e] transition-colors shadow-lg shadow-[#033543]/20 hover:shadow-[#033543]/30 active:scale-95"
                >
                  Update Stock
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Add/Edit Product Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800">
                  {currentProduct ? "Edit Product" : "Add New Product"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      Code
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543] outline-none"
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ""}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543] outline-none"
                      placeholder="Product Name"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Category
                  </label>
                  {isAddingCategory ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543] outline-none"
                        placeholder="Enter new category name"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(false)}
                        className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        name="category"
                        value={formData.category || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543] outline-none bg-white"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                        {formData.category &&
                          !categories.find(
                            (c) => c.name === formData.category,
                          ) && (
                            <option value={formData.category}>
                              {formData.category}
                            </option>
                          )}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCategory(true);
                          setNewCategoryName("");
                        }}
                        className="px-3 py-2 bg-slate-100 text-[#033543] rounded-xl hover:bg-slate-200 transition-colors"
                        title="Add New Category"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      Cost Price
                    </label>
                    <input
                      type="number"
                      name="costPrice"
                      value={formData.costPrice || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543] outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      Selling Price
                    </label>
                    <input
                      type="number"
                      name="sellingPrice"
                      value={formData.sellingPrice || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543] outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      Reorder Point
                    </label>
                    <input
                      type="number"
                      name="reorderPoint"
                      value={formData.reorderPoint || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543] outline-none"
                    />
                  </div>

                  {currentProduct ? (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 uppercase">
                        Current Stock
                      </label>
                      <input
                        type="number"
                        name="stock"
                        value={formData.stock || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543] outline-none"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 uppercase">
                        Initial Stock
                      </label>
                      <input
                        type="number"
                        name="initialStock"
                        value={formData.initialStock || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543] outline-none"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#033543] text-white rounded-xl font-semibold hover:bg-[#054b5e] transition-colors shadow-lg shadow-[#033543]/20 hover:shadow-[#033543]/30 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {currentProduct ? "Update Product" : "Create Product"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Manual Adjustment Modal */}
        {isAdjustModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">
                  Manual Stock Adjustment
                </h3>
                <button
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAdjustSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Item ID (UUID)
                  </label>
                  <input
                    type="text"
                    required
                    value={adjustForm.itemId}
                    onChange={(e) =>
                      setAdjustForm({ ...adjustForm, itemId: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    placeholder="Enter Item UUID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Batch ID (UUID)
                  </label>
                  <input
                    type="text"
                    required
                    value={adjustForm.batchId}
                    onChange={(e) =>
                      setAdjustForm({ ...adjustForm, batchId: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    placeholder="Enter Batch UUID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Quantity Change (+/-)
                  </label>
                  <input
                    type="number"
                    required
                    value={adjustForm.quantityChange}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAdjustForm({
                        ...adjustForm,
                        quantityChange: val === "" ? "" : parseInt(val),
                      });
                    }}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Use negative values for reduction (e.g. -5).
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Reason
                  </label>
                  <input
                    type="text"
                    required
                    value={adjustForm.reason}
                    onChange={(e) =>
                      setAdjustForm({ ...adjustForm, reason: e.target.value })
                    }
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
