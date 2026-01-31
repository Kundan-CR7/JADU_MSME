import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../api';
import {
    Search,
    Plus,
    Filter,
    Users,
    UserCheck,
    Clock,
    MoreVertical,
    Edit2,
    Trash2,
    X,
    Save,
    Shield,
    ShieldAlert,
    User,
    CheckCircle2,
    XCircle
} from 'lucide-react';

const StaffView = () => {
    const [staffList, setStaffList] = useState([]);
    const [stats, setStats] = useState({ totalStaff: 0, availableStaff: 0, busyStaff: 0 });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStaff, setCurrentStaff] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL'); // ALL, ADMIN, STAFF

    // Current User
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = currentUser.role === 'ADMIN';

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'STAFF',
        password: '', // Only for creation
        isAvailable: true
    });

    useEffect(() => {
        fetchStaff();
        fetchStats();
    }, []);

    const fetchStaff = async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/staff?t=${new Date().getTime()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            });
            if (response.ok) {
                const data = await response.json();
                setStaffList(data);
            }
            if (!isBackground) setLoading(false);
        } catch (err) {
            console.error('Failed to fetch staff', err);
            if (!isBackground) setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/staff/stats`, {
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
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const openModal = (staff = null) => {
        if (staff) {
            setCurrentStaff(staff);
            setFormData({
                name: staff.name,
                email: staff.email,
                role: staff.role,
                password: '', // Don't show password
                isAvailable: staff.isAvailable
            });
        } else {
            setCurrentStaff(null);
            setFormData({
                name: '',
                email: '',
                role: 'STAFF',
                password: '',
                isAvailable: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = currentStaff
                ? `${API_BASE_URL}/staff/${currentStaff.id}`
                : `${API_BASE_URL}/staff`;
            const method = currentStaff ? 'PUT' : 'POST';

            // Remove empty password if updating
            const payload = { ...formData };
            if (currentStaff && !payload.password) delete payload.password;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to save staff');

            setIsModalOpen(false);
            await fetchStaff(true); // Background refresh
            fetchStats();
        } catch (err) {
            console.error(err);
            alert('Failed to save staff');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this staff member?')) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/staff/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to delete staff');
            await fetchStaff(true);
            fetchStats();
        } catch (err) {
            console.error(err);
            alert('Failed to delete staff');
        }
    };

    const toggleAvailability = async (staff) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/staff/${staff.id}/availability`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isAvailable: !staff.isAvailable })
            });

            if (response.ok) {
                // Optimistic update
                setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, isAvailable: !s.isAvailable } : s));
                fetchStats(); // Refresh stats in bg
            }
        } catch (err) {
            console.error(err);
        }
    };

    const filteredStaff = staffList.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    if (loading) return <div className="flex h-64 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#033543]"></div></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header & Stats */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Staff Management</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage team members, roles, and availability.</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-[#033543] text-white rounded-xl hover:bg-[#054b5e] transition-all shadow-lg shadow-[#033543]/20 hover:shadow-[#033543]/30 active:scale-95 font-medium text-sm"
                    >
                        <Plus size={18} />
                        Add Member
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Users size={24} />
                    </div>
                    <div>
                        <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Staff</div>
                        <div className="text-2xl font-bold text-slate-800">{stats.totalStaff}</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <UserCheck size={24} />
                    </div>
                    <div>
                        <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Available</div>
                        <div className="text-2xl font-bold text-slate-800">{stats.availableStaff}</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                        <Clock size={24} />
                    </div>
                    <div>
                        <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Busy / Away</div>
                        <div className="text-2xl font-bold text-slate-800">{stats.busyStaff}</div>
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
                            placeholder="Search staff..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543] transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setRoleFilter(roleFilter === 'ALL' ? 'ADMIN' : (roleFilter === 'ADMIN' ? 'STAFF' : 'ALL'))}
                            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 flex items-center gap-2 text-sm font-medium"
                        >
                            <Filter size={16} />
                            {roleFilter === 'ALL' ? 'All Roles' : roleFilter}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                    {filteredStaff.map((staff) => (
                        <div key={staff.id} className="group relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow flex flex-col items-center text-center">

                            {/* Availability Indicator */}
                            <div className="absolute top-4 right-4">
                                <button
                                    onClick={() => toggleAvailability(staff)}
                                    title={staff.isAvailable ? "Mark Away" : "Mark Available"}
                                    className={`w-3 h-3 rounded-full transition-all ${staff.isAvailable ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-slate-300 ring-4 ring-slate-100'}`}
                                ></button>
                            </div>

                            {/* Avatar */}
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#033543] to-[#054b5e] text-white flex items-center justify-center text-2xl font-bold shadow-lg mb-4 cursor-default select-none">
                                {staff.avatar ? (
                                    <img src={staff.avatar} alt={staff.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    staff.name.charAt(0).toUpperCase()
                                )}
                            </div>

                            {/* Info */}
                            <h3 className="font-bold text-slate-800 text-lg mb-1">{staff.name}</h3>
                            <div className="flex items-center gap-1.5 mb-4">
                                {staff.role === 'ADMIN' ? (
                                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wide border border-purple-200 flex items-center gap-1">
                                        <Shield size={10} /> Admin
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wide border border-slate-200 flex items-center gap-1">
                                        <User size={10} /> Staff
                                    </span>
                                )}
                            </div>

                            <p className="text-slate-500 text-sm mb-6 truncate max-w-full px-2">{staff.email}</p>

                            {/* Actions */}
                            {isAdmin && (
                                <div className="flex items-center gap-2 w-full pt-4 border-t border-slate-100">
                                    <button
                                        onClick={() => openModal(staff)}
                                        className="flex-1 py-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-[#033543] text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Edit2 size={14} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(staff.id)}
                                        className="flex-1 py-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={14} /> Remove
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Add More Card */}
                    {isAdmin && (
                        <button
                            onClick={() => openModal()}
                            className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-slate-400 hover:border-[#033543] hover:text-[#033543] hover:bg-slate-50 transition-all group min-h-[280px]"
                        >
                            <div className="w-14 h-14 rounded-full bg-slate-50 text-slate-400 group-hover:bg-[#033543] group-hover:text-white flex items-center justify-center transition-colors mb-3">
                                <Plus size={24} />
                            </div>
                            <span className="font-semibold text-sm">Add New Member</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800">{currentStaff ? 'Edit Staff Member' : 'Add New Staff'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543] outline-none"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543] outline-none"
                                    placeholder="john@autokarya.com"
                                />
                            </div>
                            {!currentStaff && (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required={!currentStaff}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543] outline-none"
                                        placeholder="Min 6 characters"
                                    />
                                </div>
                            )}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Role</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543] outline-none bg-white"
                                >
                                    <option value="STAFF">Staff</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 mt-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="isAvailable" checked={formData.isAvailable} onChange={handleInputChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#033543]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#033543]"></div>
                                </label>
                                <span className="text-sm text-slate-600 font-medium">Currently Available</span>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-[#033543] text-white rounded-xl font-semibold hover:bg-[#054b5e] transition-colors shadow-lg shadow-[#033543]/20 hover:shadow-[#033543]/30 active:scale-95 flex items-center justify-center gap-2 mt-4"
                            >
                                <Save size={18} />
                                {currentStaff ? 'Update Staff' : 'Create Staff'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffView;
