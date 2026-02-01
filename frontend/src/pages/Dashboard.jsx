
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../api';
import {
    LayoutDashboard,
    Package,
    Users,
    LogOut,
    TrendingUp,
    TrendingDown,
    Search,
    Bell,
    Menu,
    X,
    Sparkles,
    UserCog,
    Truck,
    FileText,
    Settings as SettingsIcon,
    HelpCircle,
    ShoppingBag,
    AlertTriangle,
    CreditCard
} from 'lucide-react';
import RightSidebar from '../components/RightSidebar';
import NotificationPanel from '../components/NotificationPanel';
import InventoryView from '../components/InventoryView';
import SuppliersView from '../components/SuppliersView';
import StaffView from '../components/StaffView';
import SalesView from '../components/SalesView';
import Settings from '../components/Settings';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid
} from 'recharts';

const Dashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [user, setUser] = useState({ name: 'User', role: 'STAFF' });
    const [loading, setLoading] = useState(true);

    // Dynamic Data States
    const [salesStats, setSalesStats] = useState(null);
    const [inventoryStats, setInventoryStats] = useState(null);
    const [staffStats, setStaffStats] = useState(null);
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);

    // UI States
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        // Fetch Dashboard Data
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };

                const [salesRes, invRes, staffRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/sales/stats`, { headers }),
                    fetch(`${API_BASE_URL}/inventory/stats`, { headers }),
                    fetch(`${API_BASE_URL}/staff/stats`, { headers })
                ]);

                if (salesRes.ok) {
                    const salesData = await salesRes.json();
                    setSalesStats(salesData);
                    setMonthlyRevenue(salesData.revenueChart || []);
                }

                if (invRes.ok) {
                    const invData = await invRes.json();
                    setInventoryStats(invData);
                }

                if (staffRes.ok) {
                    const staffData = await staffRes.json();
                    setStaffStats(staffData);
                }

                setLoading(false);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
                setLoading(false);
            }
        };

        if (activeTab === 'dashboard') {
            fetchData();
        }

    }, [activeTab]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Placeholder for Sales Category Data (Can be dynamic later)
    const categoryData = [
        { name: 'Spare Parts', value: 45, color: '#033543' },
        { name: 'Accessories', value: 30, color: '#334155' },
        { name: 'Lubricants', value: 25, color: '#e2e8f0' },
    ];

    return (
        <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-800">

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden glass-panel"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-72 bg-[#033543] text-white flex flex-col py-6 transition-transform duration-300 ease-in-out shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

                {/* Logo */}
                <div className="flex items-center gap-3 mb-10 px-6">
                    <div className="relative w-8 h-8 flex-shrink-0">
                        <div className="absolute inset-0 border-[3px] border-white rounded-full"></div>
                        <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-xl font-bold tracking-tight">AutoKarya</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 flex flex-col gap-2 overflow-y-auto">
                    <div className="space-y-2">
                        <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Menu</p>
                        <SidebarItem
                            icon={<LayoutDashboard size={20} />}
                            label="Dashboard"
                            active={activeTab === 'dashboard'}
                            onClick={() => setActiveTab('dashboard')}
                        />
                        <SidebarItem
                            icon={<Package size={20} />}
                            label="Inventory"
                            active={activeTab === 'products'}
                            onClick={() => setActiveTab('products')}
                        />
                        <SidebarItem
                            icon={<ShoppingBag size={20} />}
                            label="Sales & Orders"
                            active={activeTab === 'sales'}
                            onClick={() => setActiveTab('sales')} // Placeholder logic for now, or route to Sales view
                        />
                        <SidebarItem
                            icon={<UserCog size={20} />}
                            label="Staff"
                            active={activeTab === 'staff'}
                            onClick={() => setActiveTab('staff')}
                        />
                        <SidebarItem
                            icon={<Truck size={20} />}
                            label="Suppliers"
                            active={activeTab === 'suppliers'}
                            onClick={() => setActiveTab('suppliers')}
                        />
                    </div>

                    <div className="mt-6 space-y-2">
                        <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">General</p>
                        <SidebarItem
                            icon={<FileText size={20} />}
                            label="AI Logs"
                            active={activeTab === 'ailogs'}
                            onClick={() => setActiveTab('ailogs')}
                        />
                        <SidebarItem
                            icon={<SettingsIcon size={20} />}
                            label="Settings"
                            active={activeTab === 'settings'}
                            onClick={() => setActiveTab('settings')}
                        />
                    </div>
                </nav>

                <div className="mt-auto pt-6 border-t border-white/10 px-6">
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold border border-white/10 group-hover:bg-white group-hover:text-[#033543] transition-colors shadow-inner uppercase overflow-hidden">
                            {user.avatar ? (
                                <img src={decodeURIComponent(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                user.name.charAt(0)
                            )}
                        </div>
                        <div className="flex-1 text-left">
                            <div className="text-sm font-semibold group-hover:text-white transition-colors truncate w-32">{user.name}</div>
                            <div className="text-xs text-slate-400 group-hover:text-slate-300 uppercase">{user.role}</div>
                        </div>
                        <LogOut size={18} className="text-slate-400 group-hover:text-red-400 transition-colors" />
                    </button>
                    <div className="text-[10px] text-slate-500 text-center mt-4">
                        &copy; 2026 AutoKarya Inc.
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">

                {/* Header */}
                <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 px-8 flex items-center justify-between sticky top-0 z-10 transition-all">
                    <div className="flex items-center gap-4">
                        <button
                            className="p-2 -ml-2 text-slate-500 hover:text-[#033543] lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-[#0f172a] bg-clip-text text-transparent bg-gradient-to-r from-[#033543] to-[#1e5869]">
                                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user.name.split(' ')[0]}
                            </h1>
                            <p className="text-sm text-slate-500 hidden sm:block">Here's what's happening with your business today.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#033543] transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search inventory, orders..."
                                className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#033543]/20 w-64 transition-all focus:bg-white"
                            />
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className={`p-2.5 relative rounded-xl transition-colors ${isNotificationOpen ? 'bg-slate-100 text-[#033543]' : 'hover:bg-slate-50 text-slate-500'}`}
                            >
                                <Bell size={20} />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
                            </button>
                            <NotificationPanel
                                isOpen={isNotificationOpen}
                                onClose={() => setIsNotificationOpen(false)}
                            />
                        </div>

                        <button
                            onClick={() => setIsAiSidebarOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#033543] text-white rounded-xl hover:bg-[#054b5e] transition-all shadow-lg shadow-[#033543]/20 hover:shadow-[#033543]/30 active:scale-95 group"
                            title="Ask AI Assistant"
                        >
                            <Sparkles size={18} className="group-hover:rotate-12 transition-transform duration-300" />
                            <span className="text-sm font-semibold">Ask AI</span>
                        </button>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 custom-scrollbar">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {activeTab === 'dashboard' && (
                            <>
                                {/* Loading State */}
                                {loading ? (
                                    <div className="flex items-center justify-center h-64">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#033543]"></div>
                                    </div>
                                ) : (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                        {/* Metrics Row */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            <MetricCard
                                                title="Total Revenue"
                                                value={`₹ ${salesStats?.totalRevenue?.toLocaleString() || '0'}`}
                                                subtitle="All time sales"
                                                icon={<CreditCard size={22} className="text-white" />}
                                                color="bg-gradient-to-br from-[#033543] to-[#055b70]"
                                                textColor="text-slate-100"
                                            />
                                            <MetricCard
                                                title="Total Orders"
                                                value={salesStats?.totalOrders || 0}
                                                subtitle="Processed invoices"
                                                icon={<ShoppingBag size={22} className="text-[#033543]" />}
                                                color="bg-white"
                                            />
                                            <MetricCard
                                                title="Inventory Value"
                                                value={`₹ ${inventoryStats?.totalValue?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}`}
                                                subtitle={`${inventoryStats?.totalItems || 0} Products`}
                                                icon={<Package size={22} className="text-blue-600" />}
                                                color="bg-white"
                                                iconBg="bg-blue-50"
                                            />
                                            <MetricCard
                                                title="Low Stock"
                                                value={inventoryStats?.lowStockCount || 0}
                                                subtitle="Items need reorder"
                                                icon={<AlertTriangle size={22} className="text-amber-600" />}
                                                color="bg-white"
                                                iconBg="bg-amber-50"
                                                alert={inventoryStats?.lowStockCount > 0}
                                            />
                                        </div>

                                        {/* Charts Row */}
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                            {/* Revenue Chart */}
                                            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div>
                                                        <h3 className="font-bold text-slate-800 text-lg">Revenue Overview</h3>
                                                        <p className="text-sm text-slate-400">Monthly revenue performance</p>
                                                    </div>
                                                </div>
                                                <div className="h-[300px] w-full">
                                                    {monthlyRevenue.length > 0 ? (
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <AreaChart data={monthlyRevenue}>
                                                                <defs>
                                                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor="#033543" stopOpacity={0.1} />
                                                                        <stop offset="95%" stopColor="#033543" stopOpacity={0} />
                                                                    </linearGradient>
                                                                </defs>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                                <XAxis
                                                                    dataKey="name"
                                                                    axisLine={false}
                                                                    tickLine={false}
                                                                    tick={{ fontSize: 12, fill: '#64748B' }}
                                                                    dy={10}
                                                                />
                                                                <YAxis
                                                                    axisLine={false}
                                                                    tickLine={false}
                                                                    tick={{ fontSize: 12, fill: '#64748B' }}
                                                                    tickFormatter={(val) => `₹${val / 1000}k`}
                                                                />
                                                                <Tooltip
                                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                                                                    formatter={(value) => [`₹ ${value.toLocaleString()}`, 'Revenue']}
                                                                    cursor={{ stroke: '#033543', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                                />
                                                                <Area
                                                                    type="natural"
                                                                    dataKey="revenue"
                                                                    stroke="#033543"
                                                                    strokeWidth={3}
                                                                    fillOpacity={1}
                                                                    fill="url(#colorRevenue)"
                                                                    activeDot={{ r: 6, fill: "#033543", stroke: "white", strokeWidth: 2 }}
                                                                />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    ) : (
                                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl">
                                                            <TrendingUp size={48} className="mb-2 opacity-50" />
                                                            <p>No revenue data available yet</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Categories / Distribution */}
                                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
                                                <h3 className="font-bold text-slate-800 mb-1 text-lg">Inventory Distribution</h3>
                                                <p className="text-sm text-slate-400 mb-6">Stock breakdown by category</p>

                                                <div className="flex-1 h-[200px] relative min-h-[200px]">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={categoryData}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={60}
                                                                outerRadius={80}
                                                                paddingAngle={5}
                                                                dataKey="value"
                                                                cornerRadius={6}
                                                                stroke="none"
                                                            >
                                                                {categoryData.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>

                                                    {/* Center Text */}
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                        <span className="text-2xl font-bold text-[#033543]">{inventoryStats?.totalItems || 0}</span>
                                                        <span className="text-xs text-slate-400">Items</span>
                                                    </div>
                                                </div>

                                                <div className="mt-8 space-y-4">
                                                    {categoryData.map((item) => (
                                                        <div key={item.name} className="flex items-center justify-between text-sm group cursor-default">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-3 h-3 rounded-full transition-transform group-hover:scale-125" style={{ backgroundColor: item.color }}></div>
                                                                <span className="text-slate-600 font-medium">{item.name}</span>
                                                            </div>
                                                            <span className="font-semibold text-slate-900 group-hover:text-[#033543] transition-colors">{item.value}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Recent Activity Table */}
                                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                                <div>
                                                    <h3 className="font-bold text-slate-800 text-lg">Recent Sales</h3>
                                                    <p className="text-sm text-slate-400">Latest transactions processed</p>
                                                </div>
                                                <button onClick={() => setActiveTab('sales')} className="text-sm font-medium text-[#033543] hover:underline">View All</button>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead className="bg-slate-50/50">
                                                        <tr>
                                                            <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice ID</th>
                                                            <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                                                            <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                                            <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                                            <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {salesStats?.recentSales?.length > 0 ? (
                                                            salesStats.recentSales.map((sale) => (
                                                                <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                                                                    <td className="p-4">
                                                                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{sale.invoiceId}</span>
                                                                    </td>
                                                                    <td className="p-4">
                                                                        <div className="font-medium text-slate-800 text-sm">{sale.customerName || 'Walk-in Customer'}</div>
                                                                    </td>
                                                                    <td className="p-4 text-sm text-slate-500">
                                                                        {new Date(sale.createdAt).toLocaleDateString()}
                                                                    </td>
                                                                    <td className="p-4 font-semibold text-slate-800 text-sm">
                                                                        ₹ {Number(sale.totalAmount).toLocaleString()}
                                                                    </td>
                                                                    <td className="p-4 text-right">
                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                                            Complete
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="5" className="p-8 text-center text-slate-500 italic">No recent sales found.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'products' && <InventoryView />}

                        {activeTab === 'staff' && <StaffView />}

                        {activeTab === 'suppliers' && <SuppliersView />}

                        {activeTab === 'settings' && <Settings />}

                        {activeTab === 'sales' && <SalesView />}

                        {activeTab === 'ailogs' && (
                            <div className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl border border-dashed border-slate-300">
                                <Sparkles size={48} className="text-slate-300 mb-4" />
                                <h3 className="text-lg font-bold text-slate-700">AI Logs</h3>
                                <p className="text-slate-500">Agent activity logs view coming soon.</p>
                            </div>
                        )}

                    </div>
                </div>
            </main>

            {/* AI Sidebar */}
            <RightSidebar
                isOpen={isAiSidebarOpen}
                onClose={() => setIsAiSidebarOpen(false)}
            />
        </div>
    );
};

// Sub-components
const SidebarItem = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`relative flex items-center gap-3 px-4 py-3.5 w-full transition-all duration-300 group ${active
            ? 'bg-gradient-to-r from-white/10 to-transparent border-l-4 border-white'
            : 'hover:bg-white/5 border-l-4 border-transparent hover:border-white/20'
            }`}
    >
        <div className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-white text-[#033543]' : 'bg-transparent text-slate-400 group-hover:text-white'
            }`}>
            {React.cloneElement(icon, { size: 18 })}
        </div>
        <span className={`text-sm font-medium tracking-wide transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'
            }`}>
            {label}
        </span>
        {active && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent blur-sm pointer-events-none" />
        )}
    </button>
);

const MetricCard = ({ title, value, subtitle, icon, color, textColor, iconBg, alert }) => (
    <div className={`${color} p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow relative overflow-hidden group`}>
        {/* Background Pattern for Gradient Cards */}
        {color.includes('gradient') && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/20 transition-colors"></div>
        )}

        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`p-3 rounded-xl ${iconBg || 'bg-white/20 backdrop-blur-sm'}`}>
                {icon}
            </div>
            {alert && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full animate-pulse border border-red-200">
                    <AlertTriangle size={10} />
                    Action Needed
                </span>
            )}
        </div>
        <div className="relative z-10">
            <h3 className={`text-sm font-medium mb-1 ${textColor || 'text-slate-500'}`}>{title}</h3>
            <div className={`text-2xl font-bold tracking-tight ${textColor || 'text-[#0f172a]'}`}>{value}</div>
            {subtitle && (
                <p className={`text-xs mt-1 ${textColor ? 'text-slate-300' : 'text-slate-400'}`}>
                    {subtitle}
                </p>
            )}
        </div>
    </div>
);

export default Dashboard;
