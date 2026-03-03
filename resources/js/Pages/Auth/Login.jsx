import { Head, useForm } from '@inertiajs/react';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import LogoKLHK from '@/Components/LogoKLHK';

export default function Login({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <>
            <Head title="Masuk" />

            {/* Background with gradient */}
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50 relative overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-sky-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
                </div>

                {/* Login Card */}
                <div className="relative z-10 w-full max-w-md px-6">
                    {/* Logo & Title */}
                    <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl shadow-2xl shadow-emerald-500/20 mb-6 transform hover:scale-110 transition-transform duration-300 overflow-hidden">
                            <LogoKLHK size={96} />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">SIMORA</h1>
                        <p className="text-lg font-bold text-cyan-600 uppercase tracking-widest">BPDAS Barito</p>
                        <p className="text-sm text-slate-500 mt-2">Sistem Monitoring Realisasi Anggaran</p>
                    </div>

                    {/* Status Message */}
                    {status && (
                        <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl animate-in slide-in-from-left-2 duration-500">
                            <p className="text-sm font-medium text-emerald-700">{status}</p>
                        </div>
                    )}

                    {/* Login Form Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-cyan-100/50 p-10 animate-in fade-in zoom-in-95 duration-700 delay-200">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Selamat Datang</h2>
                        <p className="text-slate-500 text-sm mb-8">Silakan login untuk melanjutkan</p>

                        <form onSubmit={submit} className="space-y-6">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="text-cyan-500" size={20} />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className={`w-full pl-12 pr-4 py-3.5 bg-sky-50/50 border-2 rounded-xl text-slate-700 font-medium placeholder-slate-400 outline-none transition-all duration-200 ${
                                            errors.email
                                                ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                                                : 'border-cyan-100 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10'
                                        }`}
                                        placeholder="nama@bpdas-barito.go.id"
                                        autoComplete="username"
                                        autoFocus
                                        required
                                    />
                                </div>
                                {errors.email && (
                                    <div className="flex items-center gap-2 text-rose-600 text-sm font-medium mt-2 animate-in slide-in-from-top-1 duration-300">
                                        <AlertCircle size={16} />
                                        <span>{errors.email}</span>
                                    </div>
                                )}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="text-cyan-500" size={20} />
                                    </div>
                                    <input
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className={`w-full pl-12 pr-4 py-3.5 bg-sky-50/50 border-2 rounded-xl text-slate-700 font-medium placeholder-slate-400 outline-none transition-all duration-200 ${
                                            errors.password
                                                ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                                                : 'border-cyan-100 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10'
                                        }`}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        required
                                    />
                                </div>
                                {errors.password && (
                                    <div className="flex items-center gap-2 text-rose-600 text-sm font-medium mt-2 animate-in slide-in-from-top-1 duration-300">
                                        <AlertCircle size={16} />
                                        <span>{errors.password}</span>
                                    </div>
                                )}
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="w-5 h-5 rounded-lg border-2 border-cyan-200 text-cyan-600 focus:ring-4 focus:ring-cyan-500/20 transition-all cursor-pointer"
                                />
                                <label htmlFor="remember" className="ml-3 text-sm font-medium text-slate-600 cursor-pointer select-none">
                                    Ingat saya
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                        </svg>
                                        <span>Memproses...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Login</span>
                                        <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-8 text-sm text-slate-500 animate-in fade-in duration-700 delay-500">
                        <p className="font-medium">© 2026 BPDAS Barito - Kementerian LHK</p>
                        <p className="text-xs mt-1">Sistem Monitoring Realisasi Anggaran</p>
                    </div>
                </div>
            </div>

            {/* Custom animations */}
            <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </>
    );
}
