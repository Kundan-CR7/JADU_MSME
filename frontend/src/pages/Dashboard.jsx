import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    HelpCircle
} from 'lucide-react';
import RightSidebar from '../components/RightSidebar';
import NotificationPanel from '../components/NotificationPanel';
import InventoryView from '../components/InventoryView';
import SuppliersView from '../components/SuppliersView';
import StaffView from '../components/StaffView';
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
    Area
} from 'recharts';

const Dashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [user, setUser] = useState({ name: 'User', role: 'STAFF' });

    React.useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, [activeTab]); // Refresh user data when tab changes (in case updated in settings)

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    // Mock Data
    const salesData = [
        { name: 'Premium', value: 35, color: '#033543' },
        { name: 'Mid-Range', value: 45, color: '#334155' },
        { name: 'Economy', value: 20, color: '#94a3b8' },
    ];

    const revenueData = [
        { name: 'Jan', revenue: 4000 },
        { name: 'Feb', revenue: 3000 },
        { name: 'Mar', revenue: 4500 },
        { name: 'Apr', revenue: 2780 },
        { name: 'May', revenue: 3890 },
        { name: 'Jun', revenue: 4390 },
    ];

    const customerData = [
        { name: 'New', value: 400 },
        { name: 'Returning', value: 300 },
        { name: 'Inactive', value: 100 },
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
                        <SidebarItem
                            icon={<FileText size={20} />}
                            label="AI Logs"
                            active={activeTab === 'ailogs'}
                            onClick={() => setActiveTab('ailogs')}
                        />
                    </div>

                    <div className="mt-6 space-y-2">
                        <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">General</p>
                        <SidebarItem
                            icon={<SettingsIcon size={20} />}
                            label="Settings"
                            active={activeTab === 'settings'}
                            onClick={() => setActiveTab('settings')}
                        />
                        <SidebarItem
                            icon={<HelpCircle size={20} />}
                            label="Support"
                            active={activeTab === 'support'}
                            onClick={() => setActiveTab('support')}
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
                <header className="bg-white border-b border-slate-100 py-4 px-8 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            className="p-2 -ml-2 text-slate-500 hover:text-[#033543] lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-[#0f172a]">Dashboard</h1>
                            <p className="text-sm text-slate-500 hidden sm:block">Overview of your business performance</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#033543]/20 w-64 transition-all"
                            />
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className={`p-2.5 relative rounded-xl transition-colors ${isNotificationOpen ? 'bg-slate-100 text-[#033543]' : 'hover:bg-slate-50 text-slate-500'
                                    }`}
                            >
                                <Bell size={20} />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
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
                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {activeTab === 'dashboard' && (
                            <>
                                {/* Metrics Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <MetricCard
                                        title="Total Revenue"
                                        value="₹ 24,500"
                                        trend="+12.5%"
                                        icon={<TrendingUp size={20} />}
                                    />
                                    <MetricCard
                                        title="Active Orders"
                                        value="142"
                                        trend="+5.2%"
                                        icon={<Package size={20} />}
                                    />
                                    <MetricCard
                                        title="New Customers"
                                        value="28"
                                        trend="+2.4%"
                                        icon={<Users size={20} />}
                                    />
                                </div>

                                {/* Charts Row */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                    {/* Revenue Chart */}
                                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="font-bold text-slate-800">Revenue Overview</h3>
                                            <select className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2 py-1 outline-none">
                                                <option>This Year</option>
                                                <option>Last Year</option>
                                            </select>
                                        </div>
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={revenueData}>
                                                    <defs>
                                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#033543" stopOpacity={0.1} />
                                                            <stop offset="95%" stopColor="#033543" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    />
                                                    <Area type="monotone" dataKey="revenue" stroke="#033543" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Sales Pie Chart */}
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
                                        <h3 className="font-bold text-slate-800 mb-6">Sales by Category</h3>
                                        <div className="flex-1 h-[250px] relative">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={salesData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                        cornerRadius={4}
                                                    >
                                                        {salesData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            {/* Center Text */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                <span className="text-3xl font-bold text-[#033543]">85%</span>
                                                <span className="text-xs text-slate-400">Target</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 space-y-3">
                                            {salesData.map((item) => (
                                                <div key={item.name} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                        <span className="text-slate-600">{item.name}</span>
                                                    </div>
                                                    <span className="font-semibold text-slate-900">{item.value}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'products' && <InventoryView />}

                        {activeTab === 'staff' && <StaffView />}

                        {activeTab === 'suppliers' && <SuppliersView />}

                        {activeTab === 'settings' && <Settings />}

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

        {/* Glow Effect for Active State */}
        {active && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent blur-sm pointer-events-none" />
        )}
    </button>
);

const MetricCard = ({ title, value, trend, icon }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-50 rounded-xl text-[#033543]">
                {icon}
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                {trend}
            </span>
        </div>
        <div>
            <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
            <div className="text-2xl font-bold text-[#0f172a]">{value}</div>
        </div>
    </div>
);

export default Dashboard;
