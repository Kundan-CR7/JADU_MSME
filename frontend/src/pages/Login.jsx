import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
// import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify({ name: data.name, role: data.role }));
                navigate('/dashboard');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Check for tokens in URL on component mount
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const name = params.get('name');
        const role = params.get('role');
        const avatar = params.get('avatar');
        const error = params.get('error');

        if (token && name && role) {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({ name, role, avatar }));
            navigate('/dashboard');
        } else if (error) {
            setError('Google Login Failed');
        }
    }, [navigate]);

    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:3000/auth/google';
    };

    return (
        <div className="flex min-h-screen w-full font-sans bg-white">
            {/* Left Side - Form */}
            <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 xl:px-32 relative py-12">

                {/* Logo */}
                <div className="absolute top-8 left-8 md:left-16 lg:left-24 flex items-center gap-2">
                    {/* Replicating the logo style from image */}
                    <div className="flex items-center gap-2 text-[#033543] font-bold text-xl tracking-tight">
                        <div className="relative w-6 h-6">
                            <div className="absolute inset-0 border-[3px] border-[#033543] rounded-full"></div>
                            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#033543] rounded-full"></div>
                        </div>
                        AutoKarya
                    </div>
                </div>

                <div className="w-full max-w-[480px] mt-24 md:mt-12 mx-auto lg:mx-0">
                    <h1 className="text-[32px] font-bold mb-8 text-[#1e293b] tracking-tight">Login to your account</h1>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="flex flex-col gap-5">

                        {/* Email Input */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-medium text-slate-600 ml-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full p-4 bg-[#F8FAFC] rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#033543]/30 focus:bg-[#f1f5f9] transition-all"
                                placeholder="Enter your mail"
                                required
                            />
                        </div>

                        {/* Password Input */}
                        <div className="flex flex-col gap-1.5">
                            <div className='flex items-center justify-between'>
                                <label className="text-[13px] font-medium text-slate-600 ml-1">Password</label>
                                <span className="text-[12px] font-medium text-[#033543] cursor-pointer hover:underline">Forgot password?</span>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-[#F8FAFC] rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#033543]/30 focus:bg-[#f1f5f9] transition-all pr-12"
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#033543] transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                                </button>
                            </div>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-[#033543] text-white rounded-xl font-semibold text-[15px] hover:shadow-lg hover:shadow-[#033543]/20 hover:-translate-y-0.5 transition-all duration-300 mt-2 tracking-wide disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Logging in...' : 'Log in'}
                        </button>

                        {/* Divider */}
                        <div className="flex items-center my-3 text-slate-300 gap-4">
                            <div className="flex-1 h-px bg-slate-200"></div>
                            <span className="text-xs font-normal text-slate-400">Or</span>
                            <div className="flex-1 h-px bg-slate-200"></div>
                        </div>

                        {/* Social Login */}
                        <div className="flex gap-4 justify-center">
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="w-full flex items-center justify-center gap-3 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-all font-sans"
                            >
                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                                Continue with Google
                            </button>
                        </div>

                        <p className="text-center mt-6 text-slate-500 text-xs">
                            Don't have an account? <span onClick={() => navigate('/signup')} className="text-[#033543] font-bold cursor-pointer hover:underline">Sign up</span>
                        </p>

                    </form>
                </div>
            </div>

            {/* Right Side - Visuals */}
            <div className="hidden lg:flex flex-[1.2] bg-[#033543] relative overflow-hidden items-center justify-center">

                {/* Background Texture Accents */}
                <div className="absolute inset-0">
                    {/* Dynamic squares appearing in top right in design */}
                    <div className="absolute right-[5%] top-[5%] opacity-[0.03]">
                        <div className="flex gap-4 mb-4 justify-end">
                            <div className="w-16 h-16 bg-white rounded-xl"></div>
                            <div className="w-16 h-16 bg-white rounded-xl opacity-50"></div>
                        </div>
                        <div className="flex gap-4 justify-end">
                            <div className="w-12 h-12 bg-white rounded-lg opacity-30"></div>
                            <div className="w-12 h-12 bg-white rounded-lg"></div>
                            <div className="w-12 h-12 bg-white rounded-lg opacity-60"></div>
                        </div>
                    </div>

                    {/* Bottom left accents */}
                    <div className="absolute left-[5%] bottom-[5%] opacity-[0.03] rotate-180">
                        <div className="flex gap-4 mb-4 justify-end">
                            <div className="w-14 h-14 bg-white rounded-xl"></div>
                        </div>
                        <div className="flex gap-4 justify-end">
                            <div className="w-10 h-10 bg-white rounded-lg opacity-60"></div>
                            <div className="w-10 h-10 bg-white rounded-lg"></div>
                        </div>
                    </div>
                </div>

                {/* Content Wrapper */}
                <div className="relative z-10 w-full max-w-[600px] px-12 flex flex-col items-center">

                    <div className="relative w-full max-w-[500px]">
                        {/* Main Card */}
                        <div className="bg-white rounded-[20px] p-6 shadow-2xl relative z-10 w-full">
                            <div className="flex justify-between items-start mb-8">
                                <h3 className="text-[17px] font-semibold text-slate-700">Analytics</h3>
                                <div className="flex bg-[#F8FAFC] rounded-lg p-1">
                                    <span className="px-3 py-1 bg-white rounded-md text-[10px] font-medium text-slate-600 shadow-sm">Weekly</span>
                                    <span className="px-3 py-1 text-[10px] font-medium text-slate-400">Monthly</span>
                                    <span className="px-3 py-1 text-[10px] font-medium text-slate-400">Yearly</span>
                                </div>
                            </div>

                            {/* Line Chart Graphic */}
                            <div className="h-36 w-full relative">
                                <svg viewBox="0 0 350 120" className="w-full h-full overflow-visible">
                                    {/* Grid lines */}
                                    <line x1="0" y1="30" x2="350" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                                    <line x1="0" y1="60" x2="350" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                                    <line x1="0" y1="90" x2="350" y2="90" stroke="#f1f5f9" strokeWidth="1" />

                                    {/* Chart Line 1 (Dark) */}
                                    <path d="M0,90 L60,40 L120,60 L180,30 L240,50 L300,25 L350,40"
                                        fill="none" stroke="#033543" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                                    {/* Chart Line 1 Area */}
                                    <path d="M0,90 L60,40 L120,60 L180,30 L240,50 L300,25 L350,40 V120 H0 Z"
                                        fill="url(#blueGradient)" opacity="0.1" />

                                    {/* Chart Line 2 (Gray/Blue) */}
                                    <path d="M0,70 L50,85 L110,55 L160,70 L210,45 L270,60 L350,30"
                                        fill="none" stroke="#64748b" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" strokeLinejoin="round" />

                                    <defs>
                                        <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#033543" stopOpacity="0.8" />
                                            <stop offset="100%" stopColor="#033543" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>

                            <div className="flex justify-between mt-4 text-[10px] font-medium text-slate-400 uppercase tracking-wider px-2">
                                <span>Mon</span>
                                <span>Tue</span>
                                <span>Wed</span>
                                <span>Thu</span>
                                <span>Fri</span>
                            </div>
                        </div>

                        {/* Floating Pie Chart Card */}
                        <div className="bg-white rounded-[24px] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-[220px] aspect-square absolute -right-12 top-24 z-20 flex items-center justify-center">
                            <div className="relative w-full h-full flex items-center justify-center">
                                <svg viewBox="0 0 100 100" className="w-[140px] h-[140px] -rotate-90">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="14" />
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#033543" strokeWidth="14" strokeDasharray="160 251" strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-[11px] text-slate-400 font-medium">Total</span>
                                    <span className="text-2xl font-bold text-[#033543] leading-none mt-1">42%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 text-center relative z-10 max-w-[400px]">
                        <h2 className="text-white text-[22px] font-medium mb-3 tracking-wide">Very simple way you can engage</h2>
                        <p className="text-slate-300/80 text-[13px] font-light leading-relaxed">
                            Welcome to (DAILY) Inventory Management System! Efficiently track and manage your inventory with ease.
                        </p>
                    </div>

                    {/* Floating Scan Icon Bottom Right in Theme */}
                    <div className="absolute bottom-[-60px] right-[-80px] w-12 h-12 bg-[#054a5c] rounded-lg flex items-center justify-center text-white/50">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /></svg>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Login;
