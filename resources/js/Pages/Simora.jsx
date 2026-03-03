import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    LayoutDashboard, FileText, Search, AlertCircle, CheckCircle2,
    ArrowUpRight, TrendingUp, Filter, Download, Wallet,
    Plus, Edit3, Trash2, X, Save, Clock, History, BarChart3, PieChart,
    ChevronRight, ChevronDown, ChevronUp, Activity, Info, Calendar, MessageSquare, DollarSign, Printer,
    Target, MoreHorizontal, Layers, BarChart2, Coins, FileJson, CalendarDays,
    Database, RefreshCw, BarChart4, CreditCard, Banknote, Upload, Tags, Briefcase,
    TrendingDown, Percent, ListFilter, ArrowLeft, FileDown, FileSpreadsheet, Check,
    BookOpen, Mountain, Trees, Sprout, DownloadCloud, UploadCloud, FilePlus, List, AlertTriangle, Lightbulb, Goal, CalendarRange,
    LogIn, LogOut, UserCircle, Users, Shield, Eye, EyeOff
} from 'lucide-react';
import LogoKLHK from '@/Components/LogoKLHK';
import CurrencyInput from '@/Components/CurrencyInput';

// --- 1. KONSTANTA GLOBAL (Di luar komponen agar stabil & hoisting aman) ---

const MENU_ITEMS = [
    { id: 'executive', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'capaian_target', icon: Target, label: 'Capaian Target' },
    { id: 'history', icon: History, label: 'Riwayat Global' },
    { id: 'tata_usaha', icon: BookOpen, label: 'Tata Usaha', isBidang: true },
    { id: 'pevdas', icon: Mountain, label: 'PEVDAS', isBidang: true },
    { id: 'rhl', icon: Trees, label: 'RHL', isBidang: true },
    { id: 'pkdas', icon: Sprout, label: 'PKDAS', isBidang: true },
];

const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// Helper Format Rupiah yang Aman (Menangani undefined/null)
const formatIDR = (val) => {
    const num = Number(val);
    if (isNaN(num)) return "Rp 0";
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
};

// --- 2. KOMPONEN UTAMA ---
const App = ({ initialActivities = [], initialPerformance = [], auth }) => {
    // Role-based access
    const canWrite = ['operator', 'admin'].includes(auth?.user?.role);
    const isAdmin = auth?.user?.role === 'admin';

    // Ref Hooks
    const fileInputRef = useRef(null);
    const restoreInputRef = useRef(null);
    const performanceSaveTimer = useRef(null);

    // State Hooks
    const [activities, setActivities] = useState(initialActivities);
    const [isSaving, setIsSaving] = useState(false);

    const [view, setView] = useState('executive');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Semua');
    const [expandedComponents, setExpandedComponents] = useState({});
    const [capaianFilter, setCapaianFilter] = useState('Semua');

    // Normalize initialPerformance array to a keyed-by-kategori map
    const [performanceData, setPerformanceData] = useState(() =>
        Object.fromEntries((initialPerformance ?? []).map(p => [p.kategori, p]))
    );

    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    // Filters State
    const [overviewMonth, setOverviewMonth] = useState(new Date().getMonth());
    const [overviewYear, setOverviewYear] = useState(new Date().getFullYear());
    const [isCumulative, setIsCumulative] = useState(false);

    // Report Config State
    const [reportMonth, setReportMonth] = useState(new Date().getMonth());
    const [reportYear, setReportYear] = useState(new Date().getFullYear());
    const [reportBidang, setReportBidang] = useState('Semua');
    const [reportSumberDana, setReportSumberDana] = useState('Semua');
    const [reportBelanja, setReportBelanja] = useState('Semua');
    const [isReportCumulative, setIsReportCumulative] = useState(false);
    const [pejabatNama, setPejabatNama] = useState('NAMA PEJABAT');
    const [pejabatNip, setPejabatNip] = useState('19850101 201001 1 001');

    const [detailFilter, setDetailFilter] = useState(null);
    const [lastSaved, setLastSaved] = useState(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));

    // User Management State (admin only)
    const [userList, setUserList] = useState([]);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userFormData, setUserFormData] = useState({ name: '', email: '', password: '', role: 'viewer' });
    const [showPassword, setShowPassword] = useState(false);

    // --- API HELPER ---
    const handleApiError = (error) => {
        console.error('API Error:', error.response?.status, error.response?.data, error);
        if (error.response?.status === 403) {
            showToast('Akses ditolak. Anda tidak memiliki izin.', 'error');
        } else if (error.response?.status === 422) {
            const errors = Object.values(error.response.data.errors ?? {}).flat();
            showToast(errors[0] ?? 'Data tidak valid.', 'error');
        } else {
            const msg = error.response?.data?.message || 'Terjadi kesalahan server. Silakan coba lagi.';
            showToast(`Gagal (${error.response?.status || 'Network'}): ${msg}`, 'error');
        }
    };

    // Input Forms
    const [formData, setFormData] = useState({
        kategori: 'Tata Usaha', kode: '', kegiatan: '', pagu: 0, blokir: 0, ket: '', belanja: '51', akun: '', sumberDana: 'RM',
        komponen: []
    });

    const [logFormData, setLogFormData] = useState({
        tanggal: new Date().toISOString().split('T')[0], deskripsi: '', nominal: 0, tipe: 'Realisasi', componentId: ''
    });

    // --- HELPER FUNCTIONS ---
    const calculateRealisasiSmart = (activity, month, year, cumulative = false) => {
        if (!activity || !activity.komponen) return 0;
        let total = 0;
        activity.komponen.forEach(comp => {
            if (comp.logs && Array.isArray(comp.logs)) {
                const compTotal = comp.logs.reduce((acc, log) => {
                    if (log.tipe !== 'Realisasi') return acc;
                    const d = new Date(log.tanggal);
                    const val = Number(log.nominal) || 0;
                    if (month === null || year === null) return acc + val;
                    if (cumulative) {
                        if (d.getFullYear() === year && d.getMonth() <= month) return acc + val;
                        if (d.getFullYear() < year) return acc + val;
                    } else {
                        if (d.getMonth() === month && d.getFullYear() === year) return acc + val;
                    }
                    return acc;
                }, 0);
                total += compTotal;
            }
        });
        return total;
    };

    const calculateRealisasi = (activity) => calculateRealisasiSmart(activity, null, null);

    const calculateCategoryMonthlyRealization = (category) => {
        const monthlyRealization = new Array(12).fill(0);
        const catActivities = activities.filter(a => a.kategori === category);
        catActivities.forEach(act => {
            if (act.komponen) {
                act.komponen.forEach(comp => {
                    (comp.logs || []).forEach(log => {
                        if (log.tipe === 'Realisasi') {
                            const d = new Date(log.tanggal);
                            if (!isNaN(d.getTime()) && d.getFullYear() === overviewYear) {
                                monthlyRealization[d.getMonth()] += Number(log.nominal);
                            }
                        }
                    });
                });
            }
        });
        return monthlyRealization;
    };

    const showToast = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    };

    const getCategoryFromView = (viewId) => {
        switch (viewId) {
            case 'tata_usaha': return 'Tata Usaha';
            case 'pevdas': return 'PEV';
            case 'rhl': return 'RHL';
            case 'pkdas': return 'PKDAS';
            default: return null;
        }
    };

    const toggleComponentExpand = (compId) => {
        setExpandedComponents(prev => ({ ...prev, [compId]: !prev[compId] }));
    };

    const openInputRealisasi = (activity) => {
        setSelectedActivity(activity);
        setLogFormData({
            tanggal: new Date().toISOString().split('T')[0],
            deskripsi: '',
            nominal: 0,
            tipe: 'Realisasi',
            componentId: ''
        });
        setIsTimelineOpen(true);
    };

    const openQuickRealization = (activity, componentId) => {
        setSelectedActivity(activity);
        setLogFormData({
            tanggal: new Date().toISOString().split('T')[0],
            deskripsi: '',
            nominal: 0,
            tipe: 'Realisasi',
            componentId: componentId.toString()
        });
        setIsTimelineOpen(true);
    };

    const handlePerformanceChange = (category, field, value) => {
        setPerformanceData(prev => ({
            ...prev,
            [category]: { ...(prev[category] || {}), [field]: value }
        }));
        if (!canWrite) return;
        clearTimeout(performanceSaveTimer.current);
        const merged = { ...(performanceData[category] || {}), [field]: value };
        performanceSaveTimer.current = setTimeout(async () => {
            try {
                await window.axios.put(`/api/performance/${encodeURIComponent(category)}`, {
                    tahun:          merged.tahun          ?? new Date().getFullYear(),
                    monthlyTargets: merged.monthlyTargets ?? new Array(12).fill(0),
                    status:         merged.status         ?? 'On Progress',
                    kendala:        merged.kendala         ?? '',
                    rekomendasi:    merged.rekomendasi     ?? '',
                });
            } catch (error) {
                handleApiError(error);
            }
        }, 1500);
    };

    const handleMonthlyTargetChange = (category, monthIndex, value) => {
        setPerformanceData(prev => {
            const currentData = prev[category] || {};
            const currentTargets = currentData.monthlyTargets || new Array(12).fill(0);
            const newTargets = [...currentTargets];
            newTargets[monthIndex] = Number(value);
            return { ...prev, [category]: { ...currentData, monthlyTargets: newTargets } };
        });
        if (!canWrite) return;
        clearTimeout(performanceSaveTimer.current);
        const currentData = performanceData[category] || {};
        const newTargets = [...(currentData.monthlyTargets || new Array(12).fill(0))];
        newTargets[monthIndex] = Number(value);
        performanceSaveTimer.current = setTimeout(async () => {
            try {
                await window.axios.put(`/api/performance/${encodeURIComponent(category)}`, {
                    tahun:          currentData.tahun      ?? new Date().getFullYear(),
                    monthlyTargets: newTargets,
                    status:         currentData.status     ?? 'On Progress',
                    kendala:        currentData.kendala    ?? '',
                    rekomendasi:    currentData.rekomendasi ?? '',
                });
            } catch (error) {
                handleApiError(error);
            }
        }, 1500);
    };

    // --- MEMOS (Calculations) ---
    const bidangData = useMemo(() => {
        const categoryName = getCategoryFromView(view);
        if (!categoryName) return null;
        const filtered = activities.filter(a => a.kategori === categoryName);
        const totalPagu = filtered.reduce((acc, c) => acc + Number(c.pagu), 0);
        const totalBlokir = filtered.reduce((acc, c) => acc + Number(c.blokir), 0);
        const totalRiil = totalPagu - totalBlokir;
        const totalRealisasi = filtered.reduce((acc, c) => acc + calculateRealisasi(c), 0);
        const totalSisa = totalRiil - totalRealisasi;
        const percent = totalRiil > 0 ? (totalRealisasi / totalRiil) * 100 : 0;
        return { items: filtered, totalPagu, totalBlokir, totalRiil, totalRealisasi, totalSisa, percent, categoryName };
    }, [activities, view]);

    const targetAchievementData = useMemo(() => {
        const categories = ['Tata Usaha', 'PEV', 'RHL', 'PKDAS'];
        return categories.map(cat => {
            const catData = activities.filter(a => a.kategori === cat);
            const pagu = catData.reduce((acc, c) => acc + Number(c.pagu), 0);
            const realisasiKeu = catData.reduce((acc, c) => acc + calculateRealisasi(c), 0);
            const monthlyRealization = calculateCategoryMonthlyRealization(cat);
            const savedPerf = (performanceData && performanceData[cat]) || {};
            const monthlyTargets = savedPerf.monthlyTargets || new Array(12).fill(0);
            return { category: cat, pagu, realisasiKeu, percentKeu: pagu > 0 ? (realisasiKeu / pagu) * 100 : 0, monthlyRealization, monthlyTargets, ...savedPerf };
        });
    }, [activities, performanceData, overviewYear]);

    const globalHistory = useMemo(() => {
        const allLogs = activities.flatMap(act => (act.komponen || []).flatMap(comp => (comp.logs || []).map(log => ({ ...log, kegiatan: act.kegiatan, kode: act.kode, kategori: act.kategori, komponen: comp.nama }))));
        return allLogs.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    }, [activities]);

    const detailedLogs = useMemo(() => {
        if (!detailFilter) return [];
        const relevantActivities = activities.filter(a => {
            if (detailFilter.type === 'kategori') return a.kategori === detailFilter.value;
            if (detailFilter.type === 'sumberDana') return a.sumberDana === detailFilter.value;
            if (detailFilter.type === 'belanja') return a.belanja.includes(detailFilter.value);
            if (detailFilter.type === 'all') return true;
            return false;
        });
        const logs = relevantActivities.flatMap(act => (act.komponen || []).flatMap(comp => (comp.logs || []).filter(log => {
            if (log.tipe !== 'Realisasi') return false;
            const d = new Date(log.tanggal);
            const logYear = d.getFullYear();
            const logMonth = d.getMonth();
            if (isCumulative) { return (logYear < overviewYear) || (logYear === overviewYear && logMonth <= overviewMonth); }
            else { return logYear === overviewYear && logMonth === overviewMonth; }
        }).map(log => ({ ...log, kegiatan: act.kegiatan, kode: act.kode, kategori: act.kategori, komponen: comp.nama }))
        )
        );
        return logs.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    }, [activities, detailFilter, overviewMonth, overviewYear, isCumulative]);

    const overviewSummary = useMemo(() => {
        const categories = ['Tata Usaha', 'PEV', 'RHL', 'PKDAS'];
        const stats = categories.map(cat => {
            const catData = activities.filter(a => a.kategori === cat);
            const pagu = catData.reduce((acc, c) => acc + Number(c.pagu), 0);
            const blokir = catData.reduce((acc, c) => acc + Number(c.blokir), 0);
            const realisasiFiltered = catData.reduce((acc, c) => acc + calculateRealisasiSmart(c, overviewMonth, overviewYear, isCumulative), 0);
            const riil = pagu - blokir;
            return { name: cat, pagu, blokir, realisasi: realisasiFiltered, riil, progresKeu: riil > 0 ? (realisasiFiltered / riil) * 100 : 0 };
        });
        const totalPagu = activities.reduce((acc, c) => acc + Number(c.pagu), 0);
        const totalRealisasiFiltered = activities.reduce((acc, c) => acc + calculateRealisasiSmart(c, overviewMonth, overviewYear, isCumulative), 0);
        const totalBlokir = activities.reduce((acc, c) => acc + Number(c.blokir), 0);
        const sumberDanaList = ['RM', 'PNP'];
        const sumberDanaStats = sumberDanaList.map(sd => {
            const sdData = activities.filter(a => a.sumberDana === sd);
            const pagu = sdData.reduce((acc, c) => acc + c.pagu, 0);
            const realisasi = sdData.reduce((acc, c) => acc + calculateRealisasiSmart(c, overviewMonth, overviewYear, isCumulative), 0);
            return { name: sd, pagu, realisasi, percent: pagu > 0 ? (realisasi / pagu) * 100 : 0 };
        });
        const belanjaList = ['51', '52', '53'];
        const belanjaStats = belanjaList.map(bl => {
            const blData = activities.filter(a => a.belanja === bl);
            const pagu = blData.reduce((acc, c) => acc + c.pagu, 0);
            const realisasi = blData.reduce((acc, c) => acc + calculateRealisasiSmart(c, overviewMonth, overviewYear, isCumulative), 0);
            return { name: `Belanja ${bl}`, pagu, realisasi, percent: pagu > 0 ? (realisasi / pagu) * 100 : 0 };
        });
        return { stats, totalPagu, totalRealisasiFiltered, totalBlokir, sumberDanaStats, belanjaStats };
    }, [activities, overviewMonth, overviewYear, isCumulative]);

    const maxPagu = useMemo(() => {
        if (!overviewSummary?.stats?.length) return 1;
        const maxVal = Math.max(...overviewSummary.stats.map(s => s.pagu));
        return maxVal > 0 ? maxVal : 1;
    }, [overviewSummary]);

    const reportData = useMemo(() => {
        const filteredActs = activities.filter(a => {
            let actualBidang = reportBidang;
            if (reportBidang === 'TU') actualBidang = 'Tata Usaha';
            if (reportBidang === 'PEVDAS') actualBidang = 'PEV';
            if (reportBidang !== 'Semua' && a.kategori !== actualBidang) return false;
            if (reportSumberDana !== 'Semua' && a.sumberDana !== reportSumberDana) return false;
            if (reportBelanja !== 'Semua' && a.belanja !== reportBelanja) return false;
            return true;
        });
        const finalData = filteredActs.map(act => {
            const relevantComponents = (act.komponen || []).map(comp => {
                const relevantLogs = (comp.logs || []).filter(log => {
                    const d = new Date(log.tanggal);
                    const logMonth = d.getMonth();
                    const logYear = d.getFullYear();
                    if (log.tipe !== 'Realisasi') return false;
                    if (isReportCumulative) {
                        if (logYear < reportYear) return true;
                        if (logYear === reportYear && logMonth <= reportMonth) return true;
                        return false;
                    } else {
                        return logYear === reportYear && logMonth === reportMonth;
                    }
                });
                const compRealPeriode = relevantLogs.reduce((acc, l) => acc + Number(l.nominal), 0);
                return { ...comp, filteredLogs: relevantLogs, realisasiPeriode: compRealPeriode };
            });
            const actRealPeriode = relevantComponents.reduce((acc, c) => acc + c.realisasiPeriode, 0);
            return { ...act, components: relevantComponents, realisasiPeriode: actRealPeriode };
        });
        const totalPaguReport = finalData.reduce((acc, a) => acc + Number(a.pagu), 0);
        const totalRealReport = finalData.reduce((acc, a) => acc + a.realisasiPeriode, 0);
        return { data: finalData, totalPagu: totalPaguReport, totalRealisasi: totalRealReport };
    }, [activities, reportBidang, reportSumberDana, reportBelanja, reportMonth, reportYear, isReportCumulative]);

    // --- EFFECTS ---
    // Update "last saved" timestamp whenever activities state changes
    useEffect(() => {
        setLastSaved(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    }, [activities]);

    // Sequential Library Loading to prevent race conditions & Ensure global objects
    useEffect(() => {
        const loadScript = (src) => {
            return new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            });
        };

        const loadLibraries = async () => {
            try {
                await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
                if (window.jspdf && window.jspdf.jsPDF && !window.jsPDF) {
                    window.jsPDF = window.jspdf.jsPDF;
                }
                await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.29/jspdf.plugin.autotable.min.js");
                await loadScript("https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js");
            } catch (error) {
                console.error("Gagal memuat library:", error);
            }
        };

        loadLibraries();
    }, []);

    // --- FORM AUTOMATION EFFECT ---
    // Otomatisasi perhitungan Pagu saat komponen ditambahkan atau diubah nilainya
    useEffect(() => {
        if (isModalOpen) {
            const totalPagu = (formData.komponen || []).reduce((acc, k) => acc + Number(k.pagu || 0), 0);
            if (formData.pagu !== totalPagu) {
                setFormData(prev => ({ ...prev, pagu: totalPagu }));
            }
        }
    }, [formData.komponen, isModalOpen]);


    // --- ACTION HANDLERS ---
    const handleBackupDatabase = async () => {
        try {
            showToast('Mengunduh backup database...', 'success');
            const { data } = await window.axios.get('/api/backup');
            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `simora_fullbackup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast('Backup database lengkap berhasil diunduh.', 'success');
        } catch (error) {
            handleApiError(error);
        }
    };

    const handleRestoreDatabase = async (event) => {
        const file = event.target.files[0];
        event.target.value = null;
        if (!file) return;

        if (!window.confirm('PERHATIAN: Restore akan MENGGANTI seluruh data di database dengan data dari file backup.\n\nAnda yakin ingin melanjutkan?')) return;

        try {
            showToast('Sedang memproses restore...', 'success');
            const text = await file.text();
            const json = JSON.parse(text);

            if (json.meta?.app !== 'SIMORA') {
                showToast('File bukan backup SIMORA yang valid.', 'error');
                return;
            }

            await window.axios.post('/api/restore', json);
            showToast('Database berhasil direstore! Memuat ulang...', 'success');
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            if (error instanceof SyntaxError) {
                showToast('File JSON tidak valid.', 'error');
            } else {
                handleApiError(error);
            }
        }
    };

    // --- USER MANAGEMENT HANDLERS (Admin only) ---
    const loadUsers = async () => {
        try {
            const { data } = await window.axios.get('/api/users');
            setUserList(data);
        } catch (error) {
            handleApiError(error);
        }
    };

    const openUserModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setUserFormData({ name: user.name, email: user.email, password: '', role: user.role });
        } else {
            setEditingUser(null);
            setUserFormData({ name: '', email: '', password: '', role: 'viewer' });
        }
        setShowPassword(false);
        setIsUserModalOpen(true);
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        const payload = { ...userFormData };
        if (editingUser && !payload.password) delete payload.password;

        try {
            if (editingUser) {
                const { data } = await window.axios.put(`/api/users/${editingUser.id}`, payload);
                setUserList(prev => prev.map(u => u.id === editingUser.id ? data : u));
                showToast('User berhasil diperbarui.', 'success');
            } else {
                const { data } = await window.axios.post('/api/users', payload);
                setUserList(prev => [...prev, data]);
                showToast('User berhasil ditambahkan.', 'success');
            }
            setIsUserModalOpen(false);
        } catch (error) {
            handleApiError(error);
        }
    };

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Hapus user "${user.name}" (${user.email})?`)) return;
        try {
            await window.axios.delete(`/api/users/${user.id}`);
            setUserList(prev => prev.filter(u => u.id !== user.id));
            showToast('User berhasil dihapus.', 'success');
        } catch (error) {
            handleApiError(error);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!canWrite) return;
        setIsSaving(true);

        const isEditing = !!editingItem;
        const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);

        // Build API payload (snake_case for backend)
        const payload = {
            kategori:      formData.kategori,
            kode:          formData.kode,
            kegiatan:      formData.kegiatan,
            pagu:          Number(formData.pagu) || 0,
            blokir:        Number(formData.blokir) || 0,
            progres_fisik: Number(formData.progresFisik) || 0,
            ket:           formData.ket,
            belanja:       formData.belanja,
            akun:          formData.akun,
            sumber_dana:   formData.sumberDana,
            komponen: (formData.komponen ?? []).map(k => {
                // DB auto-increment IDs are small integers; Date.now() IDs are 13+ digits.
                // Only send 'id' for real DB records to avoid 'exists' validation failure.
                const isDbRecord = Number.isInteger(k.id) && k.id > 0 && k.id < 2_000_000_000;
                return {
                    ...(isDbRecord ? { id: k.id } : {}),
                    kode_akun: k.kodeAkun,
                    nama:      k.nama,
                    pagu:      Number(k.pagu) || 0,
                };
            }),
        };

        // Optimistic update
        const optimisticEntry = { ...formData, id: isEditing ? editingItem.id : -(Date.now()), updated: timestamp };
        if (isEditing) {
            setActivities(prev => prev.map(a => a.id === editingItem.id ? optimisticEntry : a));
        } else {
            setActivities(prev => [...prev, optimisticEntry]);
        }
        setIsModalOpen(false);

        try {
            const { data } = isEditing
                ? await window.axios.put(`/api/kegiatans/${editingItem.id}`, payload)
                : await window.axios.post('/api/kegiatans', payload);

            // Replace optimistic entry with real server data (gets real DB ids for new komponens)
            setActivities(prev => prev.map(a => a.id === optimisticEntry.id ? data : a));
            showToast('Data berhasil disimpan.', 'success');
        } catch (error) {
            // Rollback on failure
            if (isEditing) {
                setActivities(prev => prev.map(a => a.id === editingItem.id ? editingItem : a));
                setIsModalOpen(true);
            } else {
                setActivities(prev => prev.filter(a => a.id !== optimisticEntry.id));
                setIsModalOpen(true);
            }
            handleApiError(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddLog = async (e) => {
        e.preventDefault();
        if (!canWrite) return;
        if (!logFormData.componentId || !selectedActivity) {
            showToast('Pilih komponen terlebih dahulu!', 'error');
            return;
        }

        const componentId = Number(logFormData.componentId);
        const optimisticLog = {
            id:        -(Date.now()),
            tanggal:   logFormData.tanggal,
            deskripsi: logFormData.deskripsi,
            nominal:   Number(logFormData.nominal),
            tipe:      logFormData.tipe,
        };

        // Optimistic: prepend log to component
        const applyLog = (list, log) => list.map(a => {
            if (a.id !== selectedActivity.id) return a;
            return {
                ...a,
                komponen: a.komponen.map(c =>
                    c.id === componentId ? { ...c, logs: [log, ...(c.logs || [])] } : c
                ),
            };
        });

        setActivities(prev => applyLog(prev, optimisticLog));
        setSelectedActivity(prev => prev ? applyLog([prev], optimisticLog)[0] : null);
        setLogFormData({ ...logFormData, deskripsi: '', nominal: 0, componentId: '' });

        try {
            const { data } = await window.axios.post(
                `/api/komponens/${componentId}/logs`,
                {
                    tanggal:   logFormData.tanggal,
                    deskripsi: logFormData.deskripsi,
                    nominal:   Number(logFormData.nominal),
                    tipe:      logFormData.tipe,
                }
            );

            // Replace optimistic log with real server log
            const replaceLog = (list) => list.map(a => {
                if (a.id !== selectedActivity.id) return a;
                return {
                    ...a,
                    komponen: a.komponen.map(c =>
                        c.id === componentId
                            ? { ...c, logs: c.logs.map(l => l.id === optimisticLog.id ? data : l) }
                            : c
                    ),
                };
            });

            setActivities(prev => replaceLog(prev));
            setSelectedActivity(prev => prev ? replaceLog([prev])[0] : null);
            showToast('Realisasi berhasil disimpan.', 'success');
        } catch (error) {
            // Rollback: remove optimistic log
            const rollback = (list) => list.map(a => {
                if (a.id !== selectedActivity.id) return a;
                return {
                    ...a,
                    komponen: a.komponen.map(c =>
                        c.id === componentId
                            ? { ...c, logs: c.logs.filter(l => l.id !== optimisticLog.id) }
                            : c
                    ),
                };
            });
            setActivities(prev => rollback(prev));
            setSelectedActivity(prev => prev ? rollback([prev])[0] : null);
            handleApiError(error);
        }
    };

    const deleteLog = async (compId, logId) => {
        if (!canWrite) return;
        const originalActivities = activities;
        const originalSelected  = selectedActivity;

        const removeLog = (list) => list.map(a => {
            if (a.id !== selectedActivity.id) return a;
            return {
                ...a,
                komponen: a.komponen.map(c =>
                    c.id === compId ? { ...c, logs: c.logs.filter(l => l.id !== logId) } : c
                ),
            };
        });

        setActivities(prev => removeLog(prev));
        setSelectedActivity(prev => prev ? removeLog([prev])[0] : null);

        try {
            await window.axios.delete(`/api/logs/${logId}`);
        } catch (error) {
            setActivities(originalActivities);
            setSelectedActivity(originalSelected);
            handleApiError(error);
        }
    };

    const deleteActivity = async (id) => {
        if (!canWrite) return;
        if (!window.confirm('Hapus kegiatan ini?')) return;

        const original = activities.find(a => a.id === id);
        if (selectedActivity?.id === id) { setIsTimelineOpen(false); setSelectedActivity(null); }
        setActivities(prev => prev.filter(a => a.id !== id));

        try {
            await window.axios.delete(`/api/kegiatans/${id}`);
            showToast('Kegiatan dihapus.', 'success');
        } catch (error) {
            setActivities(prev => [...prev, original].sort((a, b) => a.id - b.id));
            handleApiError(error);
        }
    };

    const handleCategoryClick = (category) => { setDetailFilter({ type: 'kategori', value: category, title: `Detail Realisasi Bidang: ${category}` }); };
    const handleSumberDanaClick = (sd) => { setDetailFilter({ type: 'sumberDana', value: sd, title: `Detail Realisasi Sumber Dana: ${sd}` }); };
    const handleBelanjaClick = (bl) => { const code = bl.name.split(' ')[1]; setDetailFilter({ type: 'belanja', value: code, title: `Detail Realisasi ${bl.name}` }); };
    const handleTotalRealisasiClick = () => { setDetailFilter({ type: 'all', value: 'all', title: 'Detail Seluruh Transaksi' }); };

    const openAddModal = (category) => {
        setEditingItem(null);
        setFormData({ kategori: category, kode: '', kegiatan: '', pagu: 0, blokir: 0, ket: '', belanja: '51', akun: '', sumberDana: 'RM', komponen: [] });
        setIsModalOpen(true);
    };

    const addKomponenRow = () => { setFormData({ ...formData, komponen: [...(formData.komponen || []), { id: `new_${Date.now()}`, kodeAkun: '', nama: '', pagu: 0, logs: [] }] }); };
    const removeKomponenRow = (id) => { setFormData({ ...formData, komponen: formData.komponen.filter(k => k.id !== id) }); };
    const updateKomponenRow = (id, field, value) => {
        const updated = formData.komponen.map(k => k.id === id ? { ...k, [field]: value } : k);
        setFormData({ ...formData, komponen: updated });
    };

    const handleImportCSV = (event) => {
        const file = event.target.files[0];
        if (file) {
            showToast(`File ${file.name} dipilih. (Logika parsing dinonaktifkan)`, 'success');
            event.target.value = null;
        }
    };

    const handleExportCSV = () => {
        const headers = ["Kategori", "Kode Kegiatan", "Nama Kegiatan", "Kode Akun", "Nama Komponen", "Pagu", "Realisasi", "Sisa"];
        const rows = [];

        activities.forEach(act => {
            if (act.komponen) {
                act.komponen.forEach(comp => {
                    const realisasi = (comp.logs || []).reduce((sum, log) => sum + Number(log.nominal), 0);
                    rows.push([
                        `"${act.kategori}"`,
                        `"${act.kode}"`,
                        `"${act.kegiatan.replace(/"/g, '""')}"`,
                        `"${comp.kodeAkun}"`,
                        `"${comp.nama.replace(/"/g, '""')}"`,
                        comp.pagu,
                        realisasi,
                        comp.pagu - realisasi
                    ]);
                });
            }
        });

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Data_Realisasi_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Ekspor CSV berhasil', 'success');
    };

    const handleExportExcel = () => {
        if (!window.XLSX) { showToast("Library Excel belum siap.", "error"); return; }
        try {
            const XLSX = window.XLSX;
            const ws_data = [];

            // Headers
            ws_data.push(["KEMENTERIAN LINGKUNGAN HIDUP DAN KEHUTANAN"]);
            ws_data.push(["BPDAS BARITO - BANJARBARU"]);
            ws_data.push([isReportCumulative ? 'Laporan Realisasi Akumulasi' : 'Laporan Realisasi Bulanan']);
            ws_data.push([isReportCumulative
                ? `s.d. Bulan ${MONTH_NAMES[reportMonth]} ${reportYear}`
                : `Bulan ${MONTH_NAMES[reportMonth]} ${reportYear}`]);
            ws_data.push([`Filter: ${reportBidang} | ${reportSumberDana} | Belanja ${reportBelanja}`]);
            ws_data.push([]);

            // Table 1
            ws_data.push(["I. Rekapitulasi Anggaran"]);
            ws_data.push(["Uraian", "Pagu DIPA", "Realisasi", "Sisa", "%"]);
            ws_data.push([
                "TOTAL ANGGARAN",
                reportData.totalPagu,
                reportData.totalRealisasi,
                reportData.totalPagu - reportData.totalRealisasi,
                (reportData.totalPagu > 0 ? (reportData.totalRealisasi / reportData.totalPagu) : 0)
            ]);
            ws_data.push([]);

            // Table 2
            ws_data.push(["II. Rincian Realisasi"]);
            ws_data.push(["Kode", "Uraian Kegiatan / Komponen / Transaksi", "Tanggal", "Pagu", "Realisasi", "Sisa"]);

            reportData.data.forEach(act => {
                ws_data.push([act.kode, act.kegiatan, "", act.pagu, act.realisasiPeriode, act.pagu - act.realisasiPeriode]);
                act.components.forEach(comp => {
                    ws_data.push([comp.kodeAkun, comp.nama, "", comp.pagu, comp.realisasiPeriode, comp.pagu - comp.realisasiPeriode]);
                    comp.filteredLogs.forEach(log => {
                        ws_data.push(["", `- ${log.deskripsi}`, log.tanggal, "", Number(log.nominal), ""]);
                    });
                });
            });

            // Signature
            ws_data.push([]); ws_data.push([]);
            ws_data.push(["", "", "", "", `Banjarbaru, ${new Date().getDate()} ${MONTH_NAMES[new Date().getMonth()]} ${new Date().getFullYear()}`]);
            ws_data.push(["", "", "", "", "Pejabat Pembuat Komitmen"]);
            ws_data.push([]); ws_data.push([]);
            ws_data.push(["", "", "", "", pejabatNama]);
            ws_data.push(["", "", "", "", `NIP. ${pejabatNip}`]);

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            ws['!cols'] = [{ wch: 15 }, { wch: 50 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];

            XLSX.utils.book_append_sheet(wb, ws, "Laporan Realisasi");
            XLSX.writeFile(wb, `Laporan_Realisasi_${MONTH_NAMES[reportMonth]}_${reportYear}.xlsx`);
            showToast("Excel berhasil diunduh.", "success");
        } catch (err) { console.error(err); showToast("Gagal export Excel.", "error"); }
    };

    const handleExportPDF = () => {
        if (!window.jspdf || !window.jspdf.jsPDF) { showToast("Library PDF belum siap.", "error"); return; }
        try {
            showToast("Sedang memproses PDF...", "success");
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.setFontSize(16); doc.setFont("helvetica", "bold");
            doc.text("KEMENTERIAN LINGKUNGAN HIDUP DAN KEHUTANAN", 105, 15, { align: "center" });
            doc.text("BPDAS BARITO - BANJARBARU", 105, 22, { align: "center" });
            doc.setFontSize(12); doc.setFont("helvetica", "normal");
            const title = isReportCumulative ? 'Laporan Realisasi Akumulasi' : 'Laporan Realisasi Bulanan';
            doc.text(title, 105, 30, { align: "center" });
            const period = isReportCumulative ? `s.d. Bulan ${MONTH_NAMES[reportMonth]} ${reportYear}` : `Bulan ${MONTH_NAMES[reportMonth]} ${reportYear}`;
            doc.text(period, 105, 36, { align: "center" });
            doc.setFontSize(10);
            doc.text(`Bidang: ${reportBidang} | Sumber: ${reportSumberDana} | Belanja: ${reportBelanja}`, 105, 42, { align: "center" });

            doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("I. Rekapitulasi Anggaran", 14, 55);
            const rekapData = [["TOTAL ANGGARAN", formatIDR(reportData.totalPagu), formatIDR(reportData.totalRealisasi), formatIDR(reportData.totalPagu - reportData.totalRealisasi), `${(reportData.totalPagu > 0 ? (reportData.totalRealisasi / reportData.totalPagu * 100) : 0).toFixed(2)}%`]];
            doc.autoTable({ startY: 60, head: [['Uraian', 'Pagu DIPA', 'Realisasi', 'Sisa', '%']], body: rekapData, theme: 'grid', headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 12 }, styles: { fontSize: 10, cellPadding: 3, textColor: [15, 23, 42] }, columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'center' } } });

            const finalY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(12); doc.text("II. Rincian Realisasi", 14, finalY);
            const detailRows = [];
            reportData.data.forEach(act => {
                const sisaAct = act.pagu - act.realisasiPeriode;
                // PERBAIKAN: Menghapus { content: '' } yang membuat data Pagu tergeser
                detailRows.push([
                    { content: act.kode, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                    { content: act.kegiatan, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                    { content: formatIDR(act.pagu), styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240] } },
                    { content: formatIDR(act.realisasiPeriode), styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240] } },
                    { content: formatIDR(sisaAct), styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240] } }
                ]);

                act.components.forEach(comp => {
                    const sisaComp = comp.pagu - comp.realisasiPeriode;
                    // PERBAIKAN: Sama, menghapus { content: '' } di baris komponen
                    detailRows.push([
                        { content: comp.kodeAkun, styles: { halign: 'right', fontStyle: 'bold' } },
                        { content: comp.nama, colSpan: 2, styles: { fontStyle: 'bold' } },
                        { content: formatIDR(comp.pagu), styles: { halign: 'right' } },
                        { content: formatIDR(comp.realisasiPeriode), styles: { halign: 'right' } },
                        { content: formatIDR(sisaComp), styles: { halign: 'right' } }
                    ]);

                    // Untuk baris Log (Realisasi Aktual), kodenya sudah benar karena tidak pakai colSpan
                    comp.filteredLogs.forEach(log => {
                        detailRows.push([
                            '',
                            { content: `- ${log.deskripsi}`, styles: { fontStyle: 'italic', textColor: [51, 65, 85] } },
                            { content: log.tanggal, styles: { halign: 'center', textColor: [51, 65, 85] } },
                            '',
                            { content: formatIDR(log.nominal), styles: { halign: 'right', textColor: [51, 65, 85] } },
                            ''
                        ]);
                    });
                });
            });

            doc.autoTable({ startY: finalY + 5, head: [['Kode', 'Uraian Kegiatan / Komponen / Transaksi', 'Tanggal', 'Pagu', 'Realisasi', 'Sisa']], body: detailRows, theme: 'grid', headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 12 }, styles: { fontSize: 10, cellPadding: 3, textColor: [15, 23, 42] }, columnStyles: { 0: { cellWidth: 22 }, 2: { cellWidth: 25 }, 3: { halign: 'right', cellWidth: 32 }, 4: { halign: 'right', cellWidth: 32 }, 5: { halign: 'right', cellWidth: 32 } }, showHead: 'everyPage' });

            let lastY = doc.lastAutoTable.finalY + 20;
            if (lastY + 40 > 297) { doc.addPage(); lastY = 20; }
            const sigY = lastY;
            const dateStr = `Banjarbaru, ${new Date().getDate()} ${MONTH_NAMES[new Date().getMonth()]} ${new Date().getFullYear()}`;
            doc.setFontSize(11); doc.setFont("helvetica", "normal");
            doc.text(dateStr, 140, sigY); doc.text("Pejabat Pembuat Komitmen", 140, sigY + 6);
            doc.setFont("helvetica", "bold"); doc.text(pejabatNama.toUpperCase(), 140, sigY + 35);
            doc.setLineWidth(0.5); doc.line(140, sigY + 36, 190, sigY + 36);
            doc.setFont("helvetica", "normal"); doc.text(`NIP. ${pejabatNip}`, 140, sigY + 41);
            doc.save(`Laporan_Realisasi_${MONTH_NAMES[reportMonth]}_${reportYear}.pdf`);
            showToast("PDF berhasil diunduh.", "success");
        } catch (err) { console.error(err); showToast("Gagal export PDF.", "error"); }
    };

    // --- PAGE TITLE ---
    const pageTitle = useMemo(() => {
        if (view === 'executive') return 'Dashboard';
        if (view === 'capaian_target') return 'Capaian Target';
        if (view === 'history') return 'Riwayat Aktivitas';
        if (view === 'manage_users') return 'Kelola User';
        const menu = MENU_ITEMS.find(m => m.id === view);
        return menu ? `Bidang ${menu.label}` : 'SIMORA';
    }, [view]);

    // --- RENDER ---
    return (
        <>
        <Head title={pageTitle} />
        <div className="flex h-screen bg-sky-50/30 font-sans text-slate-900 overflow-hidden antialiased selection:bg-cyan-100 selection:text-cyan-900">
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImportCSV} accept=".csv" />
            <input type="file" ref={restoreInputRef} style={{ display: 'none' }} onChange={handleRestoreDatabase} accept=".json" />

            {/* TOAST NOTIFICATION */}
            <div className={`fixed top-8 right-8 z-[200] transition-all duration-500 ease-in-out transform ${notification.show ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0'}`}>
                <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border ${notification.type === 'error' ? 'bg-white border-rose-100 text-rose-600' : 'bg-slate-900 border-slate-800 text-white'}`}>
                    <div className={`p-2 rounded-full ${notification.type === 'error' ? 'bg-rose-100' : 'bg-emerald-500'}`}>{notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} className="text-white" />}</div>
                    <div><p className="font-bold text-sm">{notification.type === 'error' ? 'Gagal' : 'Berhasil'}</p><p className="text-xs opacity-90">{notification.message}</p></div>
                </div>
            </div>

            {/* STYLES FOR PRINT */}
            <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { background-color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          aside, header, .no-print, button, input[type="file"], .fixed { display: none !important; }
          #root, .flex.h-screen { display: block !important; height: auto !important; width: 100% !important; overflow: visible !important; position: static !important; }
          .modal-overlay { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: auto !important; background: white !important; z-index: 9999 !important; padding: 0 !important; display: block !important; }
          body:has(.modal-overlay) main { display: none !important; }
          .modal-overlay { background: white !important; }
          .modal-content { box-shadow: none !important; border: none !important; width: 100% !important; max-width: none !important; height: auto !important; overflow: visible !important; display: block !important; }
          .printable-content { display: block !important; visibility: visible !important; width: 100% !important; margin: 0 !important; padding: 0 !important; background: white !important; transform: none !important; }
          .printable-content h2 { font-size: 16pt !important; }
          .printable-content h3 { font-size: 14pt !important; }
          .printable-content p { font-size: 11pt !important; }
          .printable-content table { font-size: 10pt !important; }
          .printable-content th, .printable-content td { padding: 6px 10px !important; }
          ::-webkit-scrollbar { display: none; }
          table, th, td { border-color: #000 !important; }
        }
      `}</style>

            {/* SIDEBAR */}
            <aside className="w-20 lg:w-80 bg-white h-full border-r border-cyan-100 flex flex-col justify-between transition-all duration-300 no-print z-50 overflow-y-auto">
                <div>
                    <div className="h-28 flex items-center justify-center lg:justify-start lg:px-8 border-b border-cyan-100 shrink-0">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-200 overflow-hidden"><LogoKLHK size={48} /></div>
                        <div className="hidden lg:block ml-4"><h1 className="font-bold text-xl leading-none tracking-tight text-slate-900">SIMORA</h1><span className="text-sm font-bold text-cyan-600 uppercase tracking-widest mt-1 block">BPDAS Barito</span></div>
                    </div>
                    <div className="p-6 space-y-3 mt-4">
                        <p className="hidden lg:block px-4 text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Menu Utama</p>
                        {MENU_ITEMS.filter(m => !m.isBidang).map(menu => (<button key={menu.id} onClick={() => setView(menu.id)} className={`w-full flex items-center p-4 rounded-2xl transition-all duration-200 group ${view === menu.id ? 'bg-cyan-50 text-cyan-700 shadow-sm' : 'text-slate-500 hover:bg-sky-50'}`}><menu.icon size={24} className={`transition-colors ${view === menu.id ? 'stroke-[2.5px]' : ''}`} /><span className="hidden lg:block ml-4 font-bold text-base">{menu.label}</span></button>))}
                        <p className="hidden lg:block px-4 text-sm font-bold text-slate-500 uppercase tracking-widest mt-8 mb-4">Bidang Teknis</p>
                        {MENU_ITEMS.filter(m => m.isBidang).map(menu => (<button key={menu.id} onClick={() => setView(menu.id)} className={`w-full flex items-center p-4 rounded-2xl transition-all duration-200 group ${view === menu.id ? 'bg-cyan-50 text-cyan-700 shadow-sm' : 'text-slate-500 hover:bg-sky-50'}`}><menu.icon size={24} className={`transition-colors ${view === menu.id ? 'stroke-[2.5px]' : ''}`} /><span className="hidden lg:block ml-4 font-bold text-base">{menu.label}</span></button>))}
                    </div>
                </div>
                <div className="p-6 border-t border-cyan-100 space-y-3 shrink-0">
                    <p className="hidden lg:block px-4 text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Utilitas</p>
                    <button onClick={() => setIsReportOpen(true)} className="w-full flex items-center p-4 rounded-2xl text-slate-500 hover:bg-sky-50 hover:text-blue-900 transition-all duration-200"><Printer size={24} /><span className="hidden lg:block ml-4 font-bold text-base">Cetak Laporan</span></button>
                    {canWrite && (<button onClick={handleBackupDatabase} className="w-full flex items-center p-4 rounded-2xl text-slate-500 hover:bg-sky-50 hover:text-emerald-600 transition-all duration-200"><DownloadCloud size={24} /><span className="hidden lg:block ml-4 font-bold text-base">Backup Database</span></button>)}
                    {canWrite && (<button onClick={() => restoreInputRef.current.click()} className="w-full flex items-center p-4 rounded-2xl text-slate-500 hover:bg-sky-50 hover:text-amber-600 transition-all duration-200"><UploadCloud size={24} /><span className="hidden lg:block ml-4 font-bold text-base">Restore Database</span></button>)}
                    {isAdmin && (<button onClick={() => { setView('manage_users'); loadUsers(); }} className={`w-full flex items-center p-4 rounded-2xl transition-all duration-200 ${view === 'manage_users' ? 'bg-cyan-50 text-cyan-700 shadow-sm' : 'text-slate-500 hover:bg-sky-50 hover:text-violet-600'}`}><Users size={24} /><span className="hidden lg:block ml-4 font-bold text-base">Kelola User</span></button>)}
                </div>

                {/* Auth Section */}
                <div className="p-6 border-t border-cyan-100 shrink-0">
                    {auth?.user ? (
                        <div className="space-y-3">
                            <div className="hidden lg:flex items-center gap-3 px-4 py-3 bg-sky-50 rounded-2xl border border-cyan-100">
                                <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center shrink-0">
                                    <UserCircle className="text-white" size={22} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">{auth.user.name}</p>
                                    <p className="text-xs font-bold text-cyan-600 uppercase tracking-wider">{auth.user.role}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => router.post(route('logout'))}
                                className="w-full flex items-center p-4 rounded-2xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200"
                            >
                                <LogOut size={24} />
                                <span className="hidden lg:block ml-4 font-bold text-base">Logout</span>
                            </button>
                        </div>
                    ) : (
                        <Link
                            href={route('login')}
                            className="w-full flex items-center p-4 rounded-2xl text-slate-500 hover:bg-cyan-50 hover:text-cyan-700 transition-all duration-200"
                        >
                            <LogIn size={24} />
                            <span className="hidden lg:block ml-4 font-bold text-base">Login</span>
                        </Link>
                    )}
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative">
                <header className="sticky top-0 z-30 bg-sky-50/90 backdrop-blur-md px-10 py-8 flex justify-between items-center no-print border-b border-cyan-100">
                    <div><h2 className="text-3xl font-black text-slate-900 tracking-tight">{view === 'executive' ? 'Overview Eksekutif' : view === 'capaian_target' ? 'Capaian Target' : view === 'history' ? 'Riwayat Aktivitas' : view === 'manage_users' ? 'Kelola User' : `Bidang ${MENU_ITEMS.find(m => m.id === view)?.label}`}</h2><div className="flex items-center gap-3 mt-2"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-cyan-200 shadow-md"></span><p className="text-base text-slate-600 font-medium">Terakhir diperbarui: {lastSaved}</p></div></div>
                    <div className="flex gap-4">
                        {view !== 'executive' && (<button onClick={() => setIsReportOpen(true)} className="flex items-center gap-2 bg-white border border-cyan-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-sky-50 transition-all shadow-sm active:scale-95"><Printer size={20} /><span className="hidden sm:inline">Laporan</span></button>)}
                        {view === 'executive' && (<div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-cyan-200 shadow-sm"><div className="flex gap-2"><select className="bg-sky-50 text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-sky-100 transition-colors py-2 px-3 rounded-xl border border-transparent hover:border-cyan-200" value={overviewMonth} onChange={(e) => setOverviewMonth(Number(e.target.value))}>{MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}</select><select className="bg-sky-50 text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-sky-100 transition-colors py-2 px-3 rounded-xl border border-transparent hover:border-cyan-200" value={overviewYear} onChange={(e) => setOverviewYear(Number(e.target.value))}>{[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}</select></div><div className="h-6 w-[1px] bg-slate-200" /><button onClick={() => setIsCumulative(!isCumulative)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${isCumulative ? 'bg-blue-600 text-white shadow-md' : 'bg-sky-100 text-slate-500 hover:bg-sky-200'}`}><BarChart4 size={14} />{isCumulative ? 'Akumulasi' : 'Bulanan'}</button></div>)}
                    </div>
                </header>

                {!canWrite && (
                    <div className="mx-10 mt-6 flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                        <Info className="text-amber-600 shrink-0" size={20} />
                        <p className="text-sm font-medium text-amber-800">
                            Mode baca saja.{' '}
                            {!auth?.user ? (
                                <Link href={route('login')} className="font-bold text-amber-900 underline hover:text-cyan-700 transition-colors">Login</Link>
                            ) : (
                                <span className="font-bold text-amber-900">Hubungi admin untuk akses edit.</span>
                            )}
                        </p>
                    </div>
                )}

                <div className="px-10 pb-16 pt-8">
                    {view === 'history' ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
                            <div className="bg-white rounded-[2.5rem] shadow-sm border border-cyan-100 overflow-hidden"><div className="p-8 border-b border-sky-50 bg-sky-50/50"><h3 className="font-bold text-xl text-slate-800">Kronologi Seluruh Kegiatan</h3></div><div className="divide-y divide-sky-50">{globalHistory.length > 0 ? globalHistory.map((log, idx) => (<div key={idx} className="p-8 hover:bg-sky-50 transition-colors flex gap-8 group"><div className="flex flex-col items-center gap-3 min-w-[100px]"><span className="text-sm font-bold text-slate-400 font-mono">{log.tanggal}</span><div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.tipe === 'Realisasi' ? 'bg-cyan-100 text-cyan-600' : 'bg-blue-100 text-blue-600'}`}>{log.tipe === 'Realisasi' ? <DollarSign size={18} /> : <FileText size={18} />}</div></div><div className="flex-1"><div className="flex justify-between items-start"><h4 className="font-bold text-lg text-slate-800 group-hover:text-cyan-700 transition-colors">{log.kegiatan}</h4><span className="text-xs font-bold px-3 py-1.5 bg-sky-100 rounded-lg text-slate-500">{log.komponen}</span></div><p className="text-base text-slate-600 mt-2 italic">"{log.deskripsi}"</p><div className="flex items-center gap-4 mt-3"><span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{log.kategori}</span>{log.tipe === 'Realisasi' && (<span className="text-sm font-bold text-cyan-600 bg-cyan-50 px-3 py-1 rounded-lg border border-cyan-100">{formatIDR(log.nominal)}</span>)}{log.tipe === 'Catatan' && (<span className="font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-lg text-sm border border-blue-100">CATATAN</span>)}</div></div></div>)) : (<div className="p-16 text-center text-slate-400 italic text-lg">Belum ada riwayat aktivitas tercatat.</div>)}</div></div>
                        </div>
                    ) : view === 'executive' ? (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                {[{ title: 'Pagu Anggaran', val: overviewSummary.totalPagu, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' }, { title: isCumulative ? `Realisasi s.d. ${MONTH_NAMES[overviewMonth]}` : `Realisasi ${MONTH_NAMES[overviewMonth]}`, val: overviewSummary.totalRealisasiFiltered, icon: TrendingUp, color: 'text-cyan-600', bg: 'bg-cyan-50' }, { title: 'Sisa Dana', val: overviewSummary.totalPagu - overviewSummary.totalRealisasiFiltered, icon: Coins, color: 'text-amber-600', bg: 'bg-amber-50' }, { title: 'Dana Blokir', val: overviewSummary.totalBlokir, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },].map((stat, idx) => (<div key={idx} onClick={stat.title.includes('Realisasi') ? handleTotalRealisasiClick : undefined} className={`bg-white p-6 rounded-[2rem] shadow-sm border border-cyan-100 hover:shadow-md transition-shadow group relative overflow-hidden h-40 flex flex-col justify-between ${stat.title.includes('Realisasi') ? 'cursor-pointer hover:bg-blue-50' : ''}`}><div className="flex justify-between items-start"><div className={`${stat.bg} p-3 rounded-2xl ${stat.color}`}><stat.icon size={24} /></div></div><div><p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">{stat.title}</p><h3 className="text-2xl font-black text-slate-900 tracking-tight">{formatIDR(stat.val)}</h3></div></div>))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-cyan-100 flex flex-col justify-center">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600"><Coins size={24} /></div>
                                        <h3 className="text-xl font-bold text-slate-900">Ringkasan Sumber Dana</h3>
                                    </div>
                                    <div className="space-y-6">
                                        {overviewSummary.sumberDanaStats.map((sd) => (
                                            <div key={sd.name} onClick={() => handleSumberDanaClick(sd.name)} className="cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors group">
                                                <div className="flex justify-between items-end mb-2">
                                                    <div>
                                                        <span className="font-bold text-slate-700 text-base group-hover:text-emerald-700 transition-colors">{sd.name}</span>
                                                        <p className="text-sm text-slate-500 font-medium">Pagu: {formatIDR(sd.pagu)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-black text-slate-800">{sd.percent.toFixed(1)}%</span>
                                                        <p className="text-sm font-bold text-emerald-600">{formatIDR(sd.realisasi)}</p>
                                                    </div>
                                                </div>
                                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, sd.percent)}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-cyan-100 flex flex-col justify-center">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600"><Tags size={24} /></div>
                                        <h3 className="text-xl font-bold text-slate-900">Kategori Belanja</h3>
                                    </div>
                                    <div className="space-y-6">
                                        {overviewSummary.belanjaStats.map((bl) => (
                                            <div key={bl.name} onClick={() => handleBelanjaClick(bl)} className="cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors group">
                                                <div className="flex justify-between items-end mb-2">
                                                    <div>
                                                        <span className="font-bold text-slate-700 text-base group-hover:text-indigo-700 transition-colors">{bl.name}</span>
                                                        <p className="text-sm text-slate-500 font-medium">Pagu: {formatIDR(bl.pagu)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-black text-slate-800">{bl.percent.toFixed(1)}%</span>
                                                        <p className="text-sm font-bold text-indigo-600">{formatIDR(bl.realisasi)}</p>
                                                    </div>
                                                </div>
                                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, bl.percent)}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-cyan-100 flex flex-col col-span-1 lg:col-span-2">
                                    <div className="flex items-center justify-between mb-10"><h3 className="text-xl font-bold text-slate-900">Distribusi Pagu vs Realisasi</h3><BarChart2 className="text-slate-300" size={24} /></div>
                                    <div className="flex-1 flex items-end justify-between gap-6 min-h-[280px] px-4 pb-4">
                                        {overviewSummary.stats.map((cat) => (
                                            <div key={cat.name} onClick={() => handleCategoryClick(cat.name)} className="flex flex-col items-center gap-3 flex-1 group relative cursor-pointer">
                                                <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs font-medium p-3 rounded-xl pointer-events-none z-10 whitespace-nowrap shadow-xl mb-2"><p>Pagu: {formatIDR(cat.pagu)}</p><p className="text-cyan-400">Real: {formatIDR(cat.realisasi)}</p></div>
                                                <div className="w-full flex items-end justify-center gap-1.5 h-64 relative bg-sky-50/50 rounded-2xl overflow-hidden p-1">
                                                    <div className="w-1/2 bg-slate-200 rounded-t-lg transition-all group-hover:bg-slate-300 relative" style={{ height: `${(cat.pagu / maxPagu) * 100}%` }} />
                                                    <div className="w-1/2 bg-emerald-500 rounded-t-lg transition-all group-hover:bg-emerald-600 relative shadow-lg shadow-emerald-500/20" style={{ height: `${(cat.realisasi / maxPagu) * 100}%` }} />
                                                </div>
                                                <p className="text-sm font-bold text-slate-500 uppercase text-center truncate w-full mt-3 tracking-wider group-hover:text-blue-600 transition-colors">{cat.name.split(' ')[0]}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-cyan-100 col-span-1 lg:col-span-2">
                                    <div className="flex items-center justify-between mb-8"><h3 className="text-xl font-bold text-slate-900">Ringkasan Performa Bidang</h3></div>
                                    <div className="overflow-x-auto"><table className="w-full text-sm text-left border-separate border-spacing-y-2"><thead><tr className="text-sm font-bold text-slate-500 uppercase tracking-wider"><th className="p-4 bg-white border-b-2 border-cyan-100">Bidang</th><th className="p-4 bg-blue-50/50 text-blue-700 text-right">Pagu</th><th className="p-4 bg-cyan-50/50 text-cyan-700 text-right">Realisasi</th><th className="p-4 bg-amber-50/50 text-amber-700 text-right">Sisa</th><th className="p-4 bg-indigo-50/50 text-indigo-700 text-center">%</th></tr></thead><tbody>{overviewSummary.stats.map(s => (<tr key={s.name} className="group hover:bg-sky-50 cursor-pointer" onClick={() => handleCategoryClick(s.name)}><td className="p-4 font-bold text-slate-800 bg-white border-b border-cyan-100">{s.name}</td><td className="p-4 bg-blue-50/20 text-right border-b border-cyan-100">{formatIDR(s.pagu)}</td><td className="p-4 bg-cyan-50/20 text-right font-bold border-b border-cyan-100">{formatIDR(s.realisasi)}</td><td className="p-4 bg-amber-50/20 text-right border-b border-cyan-100">{formatIDR(s.pagu - s.realisasi - s.blokir)}</td><td className="p-4 bg-indigo-50/20 text-center font-black border-b border-cyan-100">{s.progresKeu.toFixed(1)}%</td></tr>))}</tbody></table></div>
                                </div>
                            </div>
                        </div>
                    ) : view === 'capaian_target' ? (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-wrap gap-3 mb-8 no-print">
                                {['Semua', 'Tata Usaha', 'PEV', 'RHL', 'PKDAS'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCapaianFilter(cat)}
                                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${capaianFilter === cat
                                            ? 'bg-blue-600 text-white shadow-blue-200'
                                            : 'bg-white text-slate-500 hover:bg-blue-50 border border-slate-100'
                                            }`}
                                    >
                                        {cat === 'Semua' ? 'Semua Bidang' : cat}
                                    </button>
                                ))}
                            </div>

                            {targetAchievementData
                                .filter(item => capaianFilter === 'Semua' || item.category === capaianFilter)
                                .map((item) => (
                                    <div key={item.category} className="bg-white rounded-[2.5rem] shadow-sm border border-cyan-100 overflow-hidden">
                                        <div className="p-8 border-b border-sky-50 bg-sky-50/50 flex flex-wrap justify-between items-center gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-white rounded-2xl border border-sky-100 text-sky-600 shadow-sm"><Goal size={24} /></div>
                                                <div><h3 className="text-xl font-bold text-blue-950">{item.category}</h3><p className="text-sm text-slate-500">Laporan Kinerja & Fisik</p></div>
                                            </div>
                                            <div className="flex gap-4 items-center">
                                                <div className="text-right px-4 border-r border-slate-200"><p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Realisasi Keuangan</p><p className="text-lg font-black text-emerald-600">{item.percentKeu.toFixed(1)}%</p></div>
                                            </div>
                                        </div>

                                        {/* --- TABEL RENCANA & REALISASI BULANAN --- */}
                                        <div className="p-8">
                                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2"><CalendarRange size={16} /> Matriks Rencana & Realisasi Bulanan</p>
                                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                                <table className="w-full text-sm text-left">
                                                    <thead>
                                                        <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                                                            <th className="p-4">Bulan</th>
                                                            <th className="p-4 text-right">Rencana Target (Rp)</th>
                                                            <th className="p-4 text-right">Realisasi (Rp)</th>
                                                            <th className="p-4 text-right">Selisih (+/-)</th>
                                                            <th className="p-4 text-center">% Capaian</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {MONTH_NAMES.map((month, index) => {
                                                            const target = item.monthlyTargets[index] || 0;
                                                            const real = item.monthlyRealization[index] || 0;
                                                            const diff = real - target;
                                                            const percent = target > 0 ? (real / target) * 100 : 0;

                                                            return (
                                                                <tr key={index} className="hover:bg-sky-50/50 transition-colors">
                                                                    <td className="p-4 font-bold text-slate-700">{month}</td>
                                                                    <td className="p-4 text-right">
                                                                        <CurrencyInput
                                                                            className={`w-full text-right bg-transparent border-b border-transparent outline-none font-medium text-slate-600 ${canWrite ? 'hover:border-slate-300 focus:border-blue-500' : 'cursor-not-allowed'}`}
                                                                            value={target}
                                                                            placeholder="0"
                                                                            readOnly={!canWrite}
                                                                            onChange={(val) => handleMonthlyTargetChange(item.category, index, val)}
                                                                        />
                                                                    </td>
                                                                    <td className="p-4 text-right font-bold text-cyan-600">{formatIDR(real)}</td>
                                                                    <td className={`p-4 text-right font-bold ${diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                        {diff > 0 ? '+' : ''}{formatIDR(diff)}
                                                                    </td>
                                                                    <td className="p-4 text-center">
                                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${percent >= 100 ? 'bg-emerald-100 text-emerald-700' : percent >= 80 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                                                            {percent.toFixed(1)}%
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                                                        <tr>
                                                            <td className="p-4">TOTAL</td>
                                                            <td className="p-4 text-right">{formatIDR(item.monthlyTargets.reduce((a, b) => a + b, 0))}</td>
                                                            <td className="p-4 text-right text-cyan-700">{formatIDR(item.monthlyRealization.reduce((a, b) => a + b, 0))}</td>
                                                            <td className="p-4 text-right"></td>
                                                            <td className="p-4 text-center"></td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>

                                        <div className="p-8 pt-0 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <div><div className="flex justify-between mb-2"><span className="text-sm font-bold text-slate-500 uppercase">Kesesuaian Target Anggaran</span><span className="text-sm font-bold text-emerald-600">{formatIDR(item.realisasiKeu)} / {formatIDR(item.pagu)}</span></div><div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, item.percentKeu)}%` }}></div></div></div>
                                                <div className="pt-4 border-t border-slate-100"><label className="text-sm font-bold text-slate-500 uppercase mb-2 block">Status Capaian</label><select disabled={!canWrite} className={`w-full p-3 rounded-xl border-2 font-bold outline-none transition-colors ${!canWrite ? 'opacity-60 cursor-not-allowed' : ''} ${(item.status === 'Tercapai') ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : (item.status === 'Tidak Tercapai') ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`} value={item.status || 'On Progress'} onChange={(e) => handlePerformanceChange(item.category, 'status', e.target.value)}><option value="On Progress">On Progress</option><option value="Tercapai">Tercapai</option><option value="Tidak Tercapai">Tidak Tercapai</option></select></div>
                                            </div>
                                            <div className="space-y-4">
                                                <div><label className="text-sm font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><AlertTriangle size={16} /> Kendala Lapangan</label><textarea readOnly={!canWrite} className={`w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-base font-medium focus:border-blue-400 outline-none resize-none h-24 ${!canWrite ? 'cursor-not-allowed opacity-60' : ''}`} placeholder="Deskripsikan kendala yang dihadapi..." value={item.kendala || ''} onChange={(e) => handlePerformanceChange(item.category, 'kendala', e.target.value)} /></div>
                                                <div><label className="text-sm font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><Lightbulb size={16} /> Rekomendasi Tindak Lanjut</label><textarea readOnly={!canWrite} className={`w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-base font-medium focus:border-blue-400 outline-none resize-none h-24 ${!canWrite ? 'cursor-not-allowed opacity-60' : ''}`} placeholder="Saran atau tindakan yang diperlukan..." value={item.rekomendasi || ''} onChange={(e) => handlePerformanceChange(item.category, 'rekomendasi', e.target.value)} /></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : view === 'manage_users' && isAdmin ? (
                        /* --- USER MANAGEMENT VIEW --- */
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
                            <div className="bg-white rounded-[2.5rem] shadow-sm border border-cyan-100 overflow-hidden">
                                <div className="p-8 border-b border-sky-50 bg-sky-50/50 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-2xl bg-violet-50 text-violet-600"><Users size={24} /></div>
                                        <h3 className="font-bold text-xl text-slate-800">Daftar User</h3>
                                    </div>
                                    <button onClick={() => openUserModal()} className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-xl active:scale-95 transition-all">
                                        <Plus size={18} /> Tambah User
                                    </button>
                                </div>
                                <div className="divide-y divide-sky-50">
                                    {userList.length > 0 ? userList.map(user => (
                                        <div key={user.id} className="p-6 flex items-center justify-between hover:bg-sky-50/50 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${user.role === 'admin' ? 'bg-violet-100 text-violet-600' : user.role === 'operator' ? 'bg-cyan-100 text-cyan-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    {user.role === 'admin' ? <Shield size={22} /> : <UserCircle size={22} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-base">{user.name}</p>
                                                    <p className="text-sm text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg ${user.role === 'admin' ? 'bg-violet-100 text-violet-700' : user.role === 'operator' ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-600'}`}>{user.role}</span>
                                                <button onClick={() => openUserModal(user)} className="p-2.5 rounded-xl text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100"><Edit3 size={18} /></button>
                                                {user.id !== auth?.user?.id && (
                                                    <button onClick={() => handleDeleteUser(user)} className="p-2.5 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-16 text-center text-slate-400 italic text-lg">Memuat data user...</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* --- DETAIL BIDANG VIEW (SMART COMPONENT LIST) --- */
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
                            {bidangData && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[{ title: 'Total Pagu', val: bidangData.totalPagu }, { title: 'Realisasi Bidang', val: bidangData.totalRealisasi }, { title: 'Sisa Dana', val: bidangData.totalSisa }, { title: 'Terblokir', val: bidangData.totalBlokir },].map((stat, idx) => (<div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-cyan-100"><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{stat.title}</p><h3 className="text-2xl font-black text-blue-950 truncate">{formatIDR(stat.val)}</h3></div>))}
                                </div>
                            )}

                            <div className="bg-white rounded-[2.5rem] shadow-sm border border-cyan-100 overflow-hidden">
                                <div className="p-8 border-b border-cyan-50 bg-sky-50/50 flex justify-between items-center">
                                    <h3 className="font-bold text-xl text-blue-950">Daftar Kegiatan & Realisasi</h3>
                                    {bidangData && canWrite && (<button onClick={() => openAddModal(bidangData.categoryName)} className="flex items-center gap-2 bg-blue-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-cyan-600 transition-all shadow-md active:scale-95"><Plus size={18} /> Tambah Kegiatan Baru</button>)}
                                </div>

                                {bidangData && bidangData.items.length > 0 ? (
                                    <div className="divide-y divide-cyan-100">
                                        {bidangData.items.map(item => {
                                            const itemReal = calculateRealisasi(item);
                                            const itemPercent = (item.pagu - item.blokir) > 0 ? (itemReal / (item.pagu - item.blokir)) * 100 : 0;

                                            return (
                                                <div key={item.id} className="p-8 hover:bg-sky-50/30 transition-colors group">
                                                    {/* Activity Header */}
                                                    <div className="flex flex-col lg:flex-row lg:items-center gap-6 mb-6">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <span className="text-sm font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-lg border border-blue-200 shadow-sm">{item.kode}</span>
                                                                <span className="text-sm font-bold text-slate-500 flex items-center gap-1.5"><CreditCard size={14} /> {item.akun}</span>
                                                            </div>
                                                            <h4 className="font-black text-2xl text-slate-900 leading-tight mb-2">{item.kegiatan}</h4>
                                                            <p className="text-base font-medium text-slate-600">{item.ket}</p>
                                                            <div className="flex gap-3 mt-5">
                                                                {canWrite && (<button onClick={() => openInputRealisasi(item)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all shadow-sm"><FilePlus size={16} /> Input Realisasi</button>)}
                                                                {canWrite && (<button onClick={() => { setEditingItem(item); setFormData({ ...item, komponen: item.komponen || [] }); setIsModalOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"><Edit3 size={16} /> Ubah</button>)}
                                                                {canWrite && (<button onClick={() => deleteActivity(item.id)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-rose-600 border border-slate-200 hover:bg-rose-50 hover:border-rose-100 transition-all shadow-sm"><Trash2 size={16} /> Hapus</button>)}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-10 items-center bg-white p-6 rounded-3xl border border-cyan-100 shadow-sm">
                                                            <div className="text-right space-y-1">
                                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pagu Anggaran</p>
                                                                <p className="text-lg font-black text-slate-800">{formatIDR(item.pagu)}</p>
                                                            </div>
                                                            <div className="w-px h-12 bg-slate-100"></div>
                                                            <div className="text-right space-y-1">
                                                                <p className="text-xs font-bold text-cyan-600 uppercase tracking-widest">Total Realisasi</p>
                                                                <p className="text-lg font-black text-cyan-600">{formatIDR(itemReal)}</p>
                                                            </div>
                                                            <div className="w-16 h-16 relative flex items-center justify-center">
                                                                <PieChart className="text-slate-100 absolute" size={64} />
                                                                <span className="text-xs font-black text-blue-950 z-10">{itemPercent.toFixed(0)}%</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* --- INTEGRATED COMPONENT LIST (ACCORDION STYLE) --- */}
                                                    <div className="mt-6 space-y-4">
                                                        {item.komponen && item.komponen.map((comp) => {
                                                            const compReal = (comp.logs || []).reduce((a, b) => a + Number(b.nominal), 0);
                                                            const compPercent = comp.pagu > 0 ? (compReal / comp.pagu) * 100 : 0;
                                                            const isExpanded = expandedComponents[comp.id];

                                                            // Progress Bar Color Logic
                                                            let progressColor = 'bg-emerald-500';
                                                            if (compPercent > 80) progressColor = 'bg-amber-500';
                                                            if (compPercent >= 100) progressColor = 'bg-rose-500';

                                                            return (
                                                                <div key={comp.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                                    {/* Component Header Bar */}
                                                                    <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex justify-between items-center cursor-pointer" onClick={() => toggleComponentExpand(comp.id)}>
                                                                        <div className="flex items-center gap-4 flex-1">
                                                                            <button className={`p-1 rounded-full transition-colors ${isExpanded ? 'bg-slate-200 text-slate-600' : 'text-slate-400 hover:bg-slate-100'}`}>
                                                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                                            </button>
                                                                            <div className="bg-white border border-slate-200 px-2 py-1 rounded-md text-center min-w-[60px]">
                                                                                <span className="text-[10px] font-black text-slate-500 block uppercase">MAK</span>
                                                                                <span className="text-xs font-bold text-slate-700">{comp.kodeAkun || '---'}</span>
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <h5 className="font-bold text-slate-700 text-sm truncate">{comp.nama}</h5>
                                                                                <div className="w-32 h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                                                                                    <div className={`h-full ${progressColor} transition-all duration-500`} style={{ width: `${Math.min(100, compPercent)}%` }}></div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center gap-6 pl-4 border-l border-slate-200">
                                                                            <div className="text-right">
                                                                                <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Realisasi / Pagu</p>
                                                                                <div className="flex items-baseline gap-1 justify-end">
                                                                                    <span className={`font-bold text-sm ${compPercent >= 100 ? 'text-rose-600' : 'text-cyan-600'}`}>{formatIDR(compReal)}</span>
                                                                                    <span className="text-xs text-slate-400">/</span>
                                                                                    <span className="text-xs text-slate-500 font-medium">{formatIDR(comp.pagu)}</span>
                                                                                </div>
                                                                            </div>
                                                                            {/* Quick Action Button */}
                                                                            {canWrite && (
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); openQuickRealization(item, comp.id); }}
                                                                                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                                                                title="Tambah Realisasi Cepat"
                                                                            >
                                                                                <Plus size={16} />
                                                                            </button>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Expanded Logs View */}
                                                                    {isExpanded && (
                                                                        <div className="bg-white animate-in slide-in-from-top-2 duration-200">
                                                                            {comp.logs && comp.logs.length > 0 ? (
                                                                                <div className="divide-y divide-slate-50">
                                                                                    {comp.logs.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)).map(log => (
                                                                                        <div key={log.id} className="flex items-center gap-4 p-3 px-12 hover:bg-sky-50 transition-colors group/log">
                                                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover/log:bg-cyan-500 transition-colors"></div>
                                                                                            <span className="font-mono text-xs text-slate-500 font-bold min-w-[80px]">{log.tanggal}</span>
                                                                                            <p className="text-sm text-slate-600 flex-1 font-medium">{log.deskripsi}</p>
                                                                                            <span className="text-sm font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">{formatIDR(log.nominal)}</span>
                                                                                            {canWrite && (<button onClick={() => deleteLog(comp.id, log.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover/log:opacity-100 transition-opacity"><Trash2 size={14} /></button>)}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            ) : (
                                                                                <div className="py-4 text-center text-sm text-slate-400 italic bg-slate-50/50">
                                                                                    Belum ada data realisasi. Klik tombol (+) untuk menambahkan.
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-16 flex flex-col items-center justify-center text-slate-400"><FileText size={48} className="mb-4 opacity-20" /><p>Tidak ada kegiatan terdaftar pada bidang ini.</p></div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* --- FORM OVERLAY (INPUT REALISASI) --- */}
            {isTimelineOpen && selectedActivity && (
                <div className="fixed inset-0 z-[150] bg-slate-50 flex flex-col animate-in zoom-in-95 duration-300 no-print">
                    {/* Header */}
                    <div className="bg-white px-8 py-6 border-b border-slate-200 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-6">
                            <button onClick={() => setIsTimelineOpen(false)} className="p-3 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h2 className="text-2xl font-black text-blue-950">Input Realisasi</h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-bold">{selectedActivity.kode}</span>
                                    <p className="text-slate-500 text-sm font-medium">{selectedActivity.kegiatan}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-6 text-right">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Sisa Dana</p>
                                <p className="text-xl font-black text-slate-800">{formatIDR(selectedActivity.pagu - selectedActivity.blokir - calculateRealisasi(selectedActivity))}</p>
                            </div>
                            <div className="pl-6 border-l border-slate-100">
                                <p className="text-xs font-bold text-cyan-600 uppercase">Total Terpakai</p>
                                <p className="text-xl font-black text-cyan-600">{formatIDR(calculateRealisasi(selectedActivity))}</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                        {/* Left Panel: Form */}
                        <div className="w-full lg:w-1/3 bg-white border-r border-slate-200 p-8 overflow-y-auto">
                            <form onSubmit={handleAddLog} className="space-y-6">
                                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-6">
                                    <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                                        <Info size={18} />
                                        Silakan pilih komponen dan isi detail transaksi.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Komponen Anggaran</label>
                                    <div className="relative">
                                        <select required className="w-full bg-slate-50 rounded-xl px-4 py-3.5 text-sm font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none" value={logFormData.componentId} onChange={e => setLogFormData({ ...logFormData, componentId: e.target.value })}>
                                            <option value="">-- Pilih Komponen --</option>
                                            {selectedActivity.komponen && selectedActivity.komponen.map(c => (
                                                <option key={c.id} value={c.id}>[{c.kodeAkun}] {c.nama}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Tanggal Transaksi</label>
                                    <input type="date" required className="w-full bg-slate-50 rounded-xl px-4 py-3.5 text-sm font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={logFormData.tanggal} onChange={e => setLogFormData({ ...logFormData, tanggal: e.target.value })} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Nominal (Rp)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                                        <CurrencyInput placeholder="0" className="w-full bg-slate-50 rounded-xl pl-12 pr-4 py-3.5 text-lg font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={logFormData.nominal} onChange={(val) => setLogFormData({ ...logFormData, nominal: val })} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Keterangan / Uraian</label>
                                    <textarea placeholder="Contoh: Pembelian ATK bulan Januari..." required className="w-full bg-slate-50 rounded-xl px-4 py-3.5 text-sm font-medium border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none h-32" value={logFormData.deskripsi} onChange={e => setLogFormData({ ...logFormData, deskripsi: e.target.value })} />
                                </div>

                                <div className="pt-4">
                                    <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl text-base font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all flex justify-center items-center gap-2">
                                        <Save size={20} /> Simpan Realisasi
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Right Panel: History */}
                        <div className="flex-1 bg-slate-50 p-8 overflow-y-auto">
                            <div className="max-w-4xl mx-auto">
                                <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2"><History size={20} /> Riwayat Transaksi per Komponen</h3>

                                <div className="space-y-6">
                                    {selectedActivity.komponen && selectedActivity.komponen.map(comp => (
                                        <div key={comp.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded text-xs font-bold">{comp.kodeAkun}</span>
                                                    <span className="font-bold text-slate-700 text-sm">{comp.nama}</span>
                                                </div>
                                                <span className="text-sm font-black text-cyan-600">{formatIDR((comp.logs || []).reduce((a, b) => a + Number(b.nominal), 0))}</span>
                                            </div>
                                            <div className="p-2">
                                                {comp.logs && comp.logs.length > 0 ? (
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="text-xs text-slate-400 uppercase bg-slate-50/50">
                                                            <tr>
                                                                <th className="px-4 py-2 w-32">Tanggal</th>
                                                                <th className="px-4 py-2">Uraian</th>
                                                                <th className="px-4 py-2 text-right">Nominal</th>
                                                                <th className="px-4 py-2 w-10"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {comp.logs.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)).map(log => (
                                                                <tr key={log.id} className="hover:bg-blue-50/50 group">
                                                                    <td className="px-4 py-3 font-mono text-slate-500 text-xs">{log.tanggal}</td>
                                                                    <td className="px-4 py-3 text-slate-700 font-medium">{log.deskripsi}</td>
                                                                    <td className="px-4 py-3 text-right font-bold text-cyan-600">{formatIDR(log.nominal)}</td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        {canWrite && (
                                                                        <button onClick={() => deleteLog(comp.id, log.id)} className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100">
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <div className="p-8 text-center text-slate-400 italic text-sm">Belum ada transaksi pada komponen ini.</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL EDIT/TAMBAH DATA --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-blue-950/40">
                    <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="px-10 py-8 border-b border-cyan-100 flex justify-between items-center bg-sky-50/50 sticky top-0 z-10 backdrop-blur-md">
                            <h3 className="font-bold text-2xl text-blue-950">{editingItem ? 'Ubah Data Kegiatan' : 'Data Kegiatan Baru'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white rounded-full shadow-sm hover:text-rose-500 transition-colors"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-10 space-y-8">
                            <div className="space-y-6">
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="col-span-1 space-y-2">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Kode Kegiatan</label>
                                        <input className="w-full bg-sky-50 border border-cyan-100 rounded-2xl px-4 py-3 text-base font-bold outline-none focus:ring-4 focus:ring-cyan-500/10" value={formData.kode} onChange={e => setFormData({ ...formData, kode: e.target.value })} required />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Kategori (Bidang)</label>
                                        <select className="w-full bg-sky-50 border border-cyan-100 rounded-2xl px-4 py-3 text-base font-bold outline-none focus:ring-4 focus:ring-cyan-500/10" value={formData.kategori} onChange={e => setFormData({ ...formData, kategori: e.target.value })}>
                                            {['Tata Usaha', 'PEV', 'RHL', 'PKDAS'].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    <div className="col-span-1 space-y-2">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Kategori Belanja</label>
                                        <select className="w-full bg-sky-50 border border-cyan-100 rounded-2xl px-4 py-3 text-base font-bold outline-none focus:ring-4 focus:ring-cyan-500/10" value={formData.belanja} onChange={e => setFormData({ ...formData, belanja: e.target.value })}>
                                            {['51', '52', '53'].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Sumber Dana</label>
                                        <select className="w-full bg-sky-50 border border-cyan-100 rounded-2xl px-4 py-3 text-base font-bold outline-none focus:ring-4 focus:ring-cyan-500/10" value={formData.sumberDana} onChange={e => setFormData({ ...formData, sumberDana: e.target.value })}>
                                            {['RM', 'PNP'].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Nama Kegiatan</label>
                                    <input className="w-full bg-sky-50 border border-cyan-100 rounded-2xl px-4 py-3 text-base font-bold outline-none focus:ring-4 focus:ring-cyan-500/10" value={formData.kegiatan} onChange={e => setFormData({ ...formData, kegiatan: e.target.value })} required />
                                </div>

                                {/* Komponen Anggaran (Rincian) */}
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2"><List size={14} /> Rincian Komponen Anggaran (MAK)</label>
                                        <button type="button" onClick={addKomponenRow} className="text-xs font-bold bg-white border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200 transition-colors flex items-center gap-1"><Plus size={12} /> Tambah Baris</button>
                                    </div>

                                    {formData.komponen && formData.komponen.length > 0 && (
                                        <div className="grid grid-cols-12 gap-3 mb-2 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <div className="col-span-2">Kode Akun</div>
                                            <div className="col-span-4">Nama Komponen</div>
                                            <div className="col-span-3 text-right">Pagu Komponen</div>
                                            <div className="col-span-3 text-right pr-8">Realisasi (Otomatis)</div>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {formData.komponen && formData.komponen.length > 0 ? (
                                            formData.komponen.map((k) => {
                                                // Hitung realisasi per komponen berdasarkan logs
                                                const compReal = (k.logs || []).reduce((a, b) => a + Number(b.nominal), 0);

                                                return (
                                                    <div key={k.id} className="grid grid-cols-12 gap-3 items-center animate-in slide-in-from-left-2 duration-300 relative">
                                                        <div className="col-span-2">
                                                            <input type="text" placeholder="521111" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 focus:border-cyan-400 outline-none" value={k.kodeAkun} onChange={(e) => updateKomponenRow(k.id, 'kodeAkun', e.target.value)} required />
                                                        </div>
                                                        <div className="col-span-4">
                                                            <input type="text" placeholder="Nama Komponen / Rincian" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-cyan-400 outline-none" value={k.nama} onChange={(e) => updateKomponenRow(k.id, 'nama', e.target.value)} required />
                                                        </div>
                                                        <div className="col-span-3">
                                                            <CurrencyInput placeholder="0" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-right focus:border-cyan-400 outline-none" value={k.pagu} onChange={(val) => updateKomponenRow(k.id, 'pagu', val)} required />
                                                        </div>
                                                        <div className="col-span-3 flex items-center gap-2">
                                                            <input type="text" readOnly className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-right text-slate-500 outline-none cursor-not-allowed" value={formatIDR(compReal)} title="Realisasi dihitung otomatis dari log" />
                                                            <button type="button" onClick={() => removeKomponenRow(k.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors absolute -right-8"><X size={16} /></button>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <p className="text-center text-sm text-slate-400 italic py-4 bg-white rounded-xl border border-slate-100">Belum ada rincian komponen. Tambahkan minimal 1 komponen.</p>
                                        )}
                                    </div>

                                    {formData.komponen && formData.komponen.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-500 uppercase">Total Realisasi</p>
                                                <p className="text-base font-bold text-cyan-600">
                                                    {formatIDR(formData.komponen.reduce((a, c) => a + (c.logs || []).reduce((sum, l) => sum + Number(l.nominal), 0), 0))}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-500 uppercase">Total Pagu (Otomatis)</p>
                                                <p className="text-lg font-black text-slate-700">
                                                    {formatIDR(formData.komponen.reduce((a, b) => a + Number(b.pagu || 0), 0))}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Pagu Kegiatan (Rp)</label>
                                        <input type="text" readOnly className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-base font-bold text-slate-500 outline-none cursor-not-allowed" value={formatIDR(formData.pagu)} title="Total Pagu Kegiatan dihitung otomatis dari Pagu Komponen" />
                                        <p className="text-xs text-slate-400 italic flex items-center gap-1"><Info size={12} /> Dihitung otomatis dari total rincian komponen.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-rose-500 uppercase tracking-wider">Dana Blokir (Rp)</label>
                                        <CurrencyInput className="w-full bg-sky-50 border border-cyan-100 rounded-2xl px-4 py-3 text-base font-bold outline-none focus:ring-4 focus:ring-rose-500/10 text-rose-600" value={formData.blokir} onChange={v => setFormData({ ...formData, blokir: v })} />
                                    </div>
                                </div>

                            </div>
                            <button type="submit" disabled={isSaving} className="w-full bg-blue-900 text-white py-5 rounded-2xl font-bold text-base hover:bg-cyan-600 transition-all shadow-xl active:scale-95 uppercase tracking-wide disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center gap-2">
                                {isSaving ? (<><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Menyimpan...</>) : (editingItem ? 'Simpan Perubahan' : 'Tambahkan Kegiatan')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- REPORT CONFIGURATION MODAL --- */}
            {isReportOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-blue-950/50 backdrop-blur-sm modal-overlay">
                    <div className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden modal-content">
                        <div className="p-8 border-b flex justify-between items-center bg-sky-50/50 no-print">
                            <h3 className="font-bold text-xl text-blue-950">Konfigurasi Laporan</h3>
                            <div className="flex gap-3"><button onClick={handleExportExcel} className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:bg-emerald-700 transition-colors"><FileSpreadsheet size={16} /> Export Excel</button><button onClick={handleExportPDF} className="bg-rose-600 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:bg-rose-700 transition-colors"><FileDown size={16} /> Export PDF</button><button onClick={() => window.print()} className="bg-blue-900 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:bg-blue-800 transition-colors"><Printer size={16} /> Cetak</button><button onClick={() => setIsReportOpen(false)} className="bg-sky-100 p-3 rounded-xl hover:bg-sky-200"><X size={20} /></button></div>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-sky-50/30 p-10 print:p-0 print:bg-white">
                            <div className="printable-content bg-white w-full max-w-[210mm] mx-auto p-12 min-h-[297mm] shadow-lg text-slate-900 scale-100 origin-top">
                                <div className="mb-8 p-6 bg-blue-50 rounded-3xl border border-blue-100 flex flex-wrap items-center gap-6 no-print">
                                    <div className="space-y-1"><span className="text-sm font-bold text-blue-600 uppercase">Periode</span><div className="flex gap-2"><select className="bg-white border border-blue-200 text-base font-bold rounded-lg px-3 py-2 outline-none" value={reportMonth} onChange={(e) => setReportMonth(Number(e.target.value))}>{MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}</select><select className="bg-white border border-blue-200 text-base font-bold rounded-lg px-3 py-2 outline-none" value={reportYear} onChange={(e) => setReportYear(Number(e.target.value))}>{[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}</select></div></div>
                                    <div className="space-y-1"><span className="text-sm font-bold text-blue-600 uppercase">Mode Laporan</span><div className="flex bg-white rounded-lg border border-blue-200 p-1"><button onClick={() => setIsReportCumulative(false)} className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${!isReportCumulative ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-sky-100'}`}>Bulanan</button><button onClick={() => setIsReportCumulative(true)} className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${isReportCumulative ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-sky-100'}`}>Akumulasi</button></div></div>
                                    <div className="space-y-1"><span className="text-sm font-bold text-blue-600 uppercase">Bidang</span><select className="bg-white border border-blue-200 text-base font-bold rounded-lg px-3 py-2 outline-none" value={reportBidang} onChange={(e) => setReportBidang(e.target.value)}><option value="Semua">Semua Bidang</option>{['TU', 'PEVDAS', 'RHL', 'PKDAS'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                    <div className="space-y-1"><span className="text-sm font-bold text-blue-600 uppercase">Sumber Dana</span><select className="bg-white border border-blue-200 text-base font-bold rounded-lg px-3 py-2 outline-none" value={reportSumberDana} onChange={(e) => setReportSumberDana(e.target.value)}><option value="Semua">Semua Sumber</option>{['RM', 'PNP'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                    <div className="space-y-1"><span className="text-sm font-bold text-blue-600 uppercase">Belanja</span><select className="bg-white border border-blue-200 text-base font-bold rounded-lg px-3 py-2 outline-none" value={reportBelanja} onChange={(e) => setReportBelanja(e.target.value)}><option value="Semua">Semua Belanja</option>{['51', '52', '53'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                    <div className="space-y-1"><span className="text-sm font-bold text-blue-600 uppercase">Nama Pejabat (PPK)</span><input type="text" className="bg-white border border-blue-200 text-base font-bold rounded-lg px-3 py-2 outline-none w-48" value={pejabatNama} onChange={(e) => setPejabatNama(e.target.value)} placeholder="Nama Pejabat" /></div>
                                    <div className="space-y-1"><span className="text-sm font-bold text-blue-600 uppercase">NIP</span><input type="text" className="bg-white border border-blue-200 text-base font-bold rounded-lg px-3 py-2 outline-none w-48" value={pejabatNip} onChange={(e) => setPejabatNip(e.target.value)} placeholder="NIP" /></div>
                                </div>

                                <div className="text-center border-b-2 border-slate-900 pb-8 mb-10">
                                    <h2 className="font-black text-2xl uppercase tracking-widest text-slate-900">KEMENTERIAN LINGKUNGAN HIDUP DAN KEHUTANAN</h2>
                                    <h3 className="font-bold text-xl uppercase mt-2 text-slate-900">BPDAS BARITO - BANJARBARU</h3>
                                    <p className="text-base mt-3 font-medium text-slate-700">{isReportCumulative ? 'Laporan Realisasi Akumulasi' : 'Laporan Realisasi Bulanan'}</p>
                                    <p className="text-sm font-bold mt-1 uppercase text-slate-600">
                                        Filter: {reportBidang !== 'Semua' ? reportBidang : 'Semua Bidang'} | {reportSumberDana !== 'Semua' ? reportSumberDana : 'Semua Sumber'} | {reportBelanja !== 'Semua' ? `Belanja ${reportBelanja}` : 'Semua Belanja'}
                                    </p>
                                    <p className="text-base font-bold mt-1 uppercase text-slate-700">
                                        {isReportCumulative ? `s.d. Bulan ${MONTH_NAMES[reportMonth]} ${reportYear}` : `Bulan ${MONTH_NAMES[reportMonth]} ${reportYear}`}
                                    </p>
                                </div>

                                <div className="mb-10">
                                    <h4 className="font-bold text-lg uppercase mb-4 border-l-4 border-slate-900 pl-3 text-slate-800">I. Rekapitulasi Anggaran</h4>
                                    <table className="w-full text-sm border-collapse border border-slate-300">
                                        <thead>
                                            <tr className="bg-slate-100 text-left text-slate-900">
                                                <th className="p-4 border border-slate-300">Uraian</th>
                                                <th className="p-4 border border-slate-300 text-right">Pagu DIPA</th>
                                                <th className="p-4 border border-slate-300 text-right">Realisasi</th>
                                                <th className="p-4 border border-slate-300 text-right">Sisa</th>
                                                <th className="p-4 border border-slate-300 text-center">%</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="p-4 border border-slate-300 font-bold text-slate-900">TOTAL ANGGARAN</td>
                                                <td className="p-4 border border-slate-300 text-right font-bold text-slate-900">{formatIDR(reportData.totalPagu)}</td>
                                                <td className="p-4 border border-slate-300 text-right font-bold text-slate-900">{formatIDR(reportData.totalRealisasi)}</td>
                                                <td className="p-4 border border-slate-300 text-right font-bold text-slate-900">{formatIDR(reportData.totalPagu - reportData.totalRealisasi)}</td>
                                                <td className="p-4 border border-slate-300 text-center font-bold text-slate-900">{(reportData.totalPagu > 0 ? (reportData.totalRealisasi / reportData.totalPagu * 100) : 0).toFixed(2)}%</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div>
                                    <h4 className="font-bold text-lg uppercase mb-4 border-l-4 border-slate-900 pl-3 text-slate-800">II. Rincian Realisasi</h4>
                                    <table className="w-full text-sm border-collapse border border-slate-300">
                                        <thead>
                                            <tr className="bg-slate-100 text-slate-900">
                                                <th className="border border-slate-300 p-3 w-28 font-bold">Kode</th>
                                                <th className="border border-slate-300 p-3 font-bold">Uraian Kegiatan / Komponen / Transaksi</th>
                                                <th className="border border-slate-300 p-3 w-24 text-center font-bold">Tanggal</th>
                                                <th className="border border-slate-300 p-3 w-32 text-right font-bold">Pagu</th>
                                                <th className="border border-slate-300 p-3 w-32 text-right font-bold">Realisasi</th>
                                                <th className="border border-slate-300 p-3 w-32 text-right font-bold">Sisa</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.data.map(act => (
                                                <React.Fragment key={act.id}>
                                                    <tr className="bg-slate-50 font-bold text-slate-900">
                                                        <td className="border border-slate-300 p-3 align-top">{act.kode}</td>
                                                        <td className="border border-slate-300 p-3" colSpan="2">{act.kegiatan}</td>
                                                        <td className="border border-slate-300 p-3 text-right">{formatIDR(act.pagu)}</td>
                                                        <td className="border border-slate-300 p-3 text-right">{formatIDR(act.realisasiPeriode)}</td>
                                                        <td className="border border-slate-300 p-3 text-right">{formatIDR(act.pagu - act.realisasiPeriode)}</td>
                                                    </tr>
                                                    {act.components.map(comp => (
                                                        <React.Fragment key={comp.id}>
                                                            <tr className="text-slate-800 font-semibold bg-white">
                                                                <td className="border border-slate-300 p-3 pl-6 align-top">{comp.kodeAkun}</td>
                                                                <td className="border border-slate-300 p-3" colSpan="2">{comp.nama}</td>
                                                                <td className="border border-slate-300 p-3 text-right text-slate-600">{formatIDR(comp.pagu)}</td>
                                                                <td className="border border-slate-300 p-3 text-right">{formatIDR(comp.realisasiPeriode)}</td>
                                                                <td className="border border-slate-300 p-3 text-right">{formatIDR(comp.pagu - comp.realisasiPeriode)}</td>
                                                            </tr>
                                                            {comp.filteredLogs.map(log => (
                                                                <tr key={log.id} className="text-slate-600 italic text-xs bg-slate-50/30">
                                                                    <td className="border border-slate-300 p-2"></td>
                                                                    <td className="border border-slate-300 p-2 pl-10">- {log.deskripsi}</td>
                                                                    <td className="border border-slate-300 p-2 text-center">{log.tanggal}</td>
                                                                    <td className="border border-slate-300 p-2"></td>
                                                                    <td className="border border-slate-300 p-2 text-right">{formatIDR(log.nominal)}</td>
                                                                    <td className="border border-slate-300 p-2 text-right"></td>
                                                                </tr>
                                                            ))}
                                                        </React.Fragment>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-20 flex justify-end break-inside-avoid">
                                    <div className="text-center w-56">
                                        <p className="text-base text-slate-800">Banjarbaru, {new Date().getDate()} {MONTH_NAMES[new Date().getMonth()]} {new Date().getFullYear()}</p>
                                        <p className="text-base font-bold mt-1 text-slate-900">Pejabat Pembuat Komitmen</p>
                                        <div className="h-24" />
                                        <p className="text-base font-bold underline uppercase text-slate-900">{pejabatNama}</p>
                                        <p className="text-sm text-slate-700">NIP. {pejabatNip}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- USER MANAGEMENT MODAL --- */}
            {isUserModalOpen && (
                <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 no-print animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-sky-50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-violet-50 text-violet-600"><Shield size={22} /></div>
                                <h3 className="text-xl font-bold text-slate-800">{editingUser ? 'Edit User' : 'Tambah User Baru'}</h3>
                            </div>
                            <button onClick={() => setIsUserModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleSaveUser} className="p-8 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">Nama</label>
                                <input type="text" required value={userFormData.name} onChange={e => setUserFormData(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-3 bg-sky-50/50 border-2 border-cyan-100 rounded-xl text-slate-700 font-medium outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all" placeholder="Nama lengkap" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">Email</label>
                                <input type="email" required value={userFormData.email} onChange={e => setUserFormData(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-3 bg-sky-50/50 border-2 border-cyan-100 rounded-xl text-slate-700 font-medium outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all" placeholder="email@bpdas-barito.go.id" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">
                                    Password {editingUser && <span className="normal-case tracking-normal text-slate-400">(kosongkan jika tidak diubah)</span>}
                                </label>
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} required={!editingUser} minLength={8} value={userFormData.password} onChange={e => setUserFormData(p => ({ ...p, password: e.target.value }))} className="w-full px-4 py-3 pr-12 bg-sky-50/50 border-2 border-cyan-100 rounded-xl text-slate-700 font-medium outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all" placeholder="Minimal 8 karakter" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">Role</label>
                                <select value={userFormData.role} onChange={e => setUserFormData(p => ({ ...p, role: e.target.value }))} className="w-full px-4 py-3 bg-sky-50/50 border-2 border-cyan-100 rounded-xl text-slate-700 font-bold outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all cursor-pointer">
                                    <option value="viewer">Viewer (Baca Saja)</option>
                                    <option value="operator">Operator (CRUD)</option>
                                    <option value="admin">Admin (CRUD + Kelola User)</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95">Batal</button>
                                <button type="submit" className="flex-1 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 shadow-lg shadow-cyan-500/20 hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                                    <Save size={18} /> {editingUser ? 'Simpan Perubahan' : 'Tambah User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- DRILL DOWN OVERLAY --- */}
            {detailFilter && (
                <div className="fixed inset-0 z-[120] bg-sky-50 no-print flex flex-col animate-in fade-in duration-300">
                    <div className="bg-white border-b border-cyan-200 px-8 py-5 flex items-center justify-between shadow-sm sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setDetailFilter(null)} className="p-3 hover:bg-sky-100 rounded-full transition-colors border border-cyan-200"><ArrowLeft size={24} className="text-slate-600" /></button>
                            <div>
                                <h2 className="text-2xl font-black text-blue-950 leading-tight">Detail Realisasi: {detailFilter.title.split(': ')[1] || detailFilter.title}</h2>
                                <p className="text-sm text-slate-500 font-medium mt-1">Filter Aktif: <span className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded text-xs uppercase font-bold">{isCumulative ? 'Akumulasi' : 'Bulanan'}</span> • Periode: {isCumulative ? `s.d. ${MONTH_NAMES[overviewMonth]} ${overviewYear}` : `${MONTH_NAMES[overviewMonth]} ${overviewYear}`}</p>
                            </div>
                        </div>
                        <div className="bg-sky-100 px-6 py-3 rounded-2xl"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Terfilter</p><p className="text-2xl font-black text-cyan-600">{formatIDR(detailedLogs.reduce((acc, l) => acc + Number(l.nominal), 0))}</p></div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 w-full max-w-[1600px] mx-auto">
                        {detailedLogs.length > 0 ? (
                            <div className="grid gap-4">
                                {detailedLogs.map((log, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-[2rem] border border-cyan-200 shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow group"><div className="w-16 h-16 bg-sky-50 rounded-2xl flex flex-col items-center justify-center border border-cyan-100 text-slate-500"><span className="text-xs font-bold uppercase">{new Date(log.tanggal).toLocaleString('default', { month: 'short' })}</span><span className="text-xl font-black">{new Date(log.tanggal).getDate()}</span></div><div className="flex-1 min-w-0"><div className="flex items-center gap-3 mb-1"><span className="text-xs font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase">{log.kategori}</span><span className="text-xs font-bold text-slate-400">{log.kode}</span></div><h4 className="text-lg font-bold text-slate-800 truncate mb-1">{log.kegiatan}</h4><p className="text-sm font-medium text-slate-500 mb-1">{log.komponen}</p><p className="text-sm text-slate-600 italic">"{log.deskripsi}"</p></div><div className="text-right pl-6 border-l border-cyan-100"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nominal</p><p className="text-xl font-black text-cyan-600">{formatIDR(log.nominal)}</p></div></div>
                                ))}
                            </div>
                        ) : (<div className="h-full flex flex-col items-center justify-center text-slate-400"><FileText size={64} className="opacity-20 mb-6" /><p className="text-lg font-medium">Tidak ada data realisasi yang ditemukan untuk kategori dan periode ini.</p></div>)}
                    </div>
                </div>
            )}
        </div>
        </>
    );
};

export default App;