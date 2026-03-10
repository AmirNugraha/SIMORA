import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    LayoutDashboard, Plus, Edit3, Trash2, X, Save, Search, Filter,
    Download, Eye, FileText, ChevronDown, ChevronRight, ChevronLeft,
    Archive, Upload, AlertCircle, CheckCircle2, Clock, FileDown,
    ArrowLeft, Layers, UserCircle, LogOut, LogIn, Briefcase,
    Settings, Database, BookOpen, Coins, CreditCard, Tag,
    Package, FolderOpen, MoreHorizontal
} from 'lucide-react';
import LogoKLHK from '@/Components/LogoKLHK';
import CurrencyInput from '@/Components/CurrencyInput';

const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const formatIDR = (val) => {
    const num = Number(val);
    if (isNaN(num)) return "Rp 0";
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
};

const MASTER_TABS = [
    { key: 'kodeTransaksis', label: 'Kode Transaksi', icon: Tag, fields: ['kode', 'nama', 'deskripsi'] },
    { key: 'sumberDanas', label: 'Sumber Dana', icon: Coins, fields: ['kode', 'nama'] },
    { key: 'akuns', label: 'Akun', icon: CreditCard, fields: ['kode', 'nama'] },
    { key: 'arsipKegiatans', label: 'Kegiatan Arsip', icon: BookOpen, fields: ['nama'] },
    { key: 'metodePengadaans', label: 'Metode Pengadaan', icon: Package, fields: ['kategori', 'nama'] },
];

const App = ({ masterData: initialMasterData, auth }) => {
    const canWrite = ['operator', 'admin'].includes(auth?.user?.role);
    const isAdmin = auth?.user?.role === 'admin';

    // View state
    const [view, setView] = useState('arsip_index'); // arsip_index | master_data
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    // Arsip state
    const [arsips, setArsips] = useState([]);
    const [arsipMeta, setArsipMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [arsipLoading, setArsipLoading] = useState(false);
    const [arsipFilters, setArsipFilters] = useState({ bulan: '', kode_transaksi_id: '', sumber_dana_id: '', status_verifikasi: '', search: '' });
    const [isArsipModalOpen, setIsArsipModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingArsip, setEditingArsip] = useState(null);
    const [viewingArsip, setViewingArsip] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const emptyArsipForm = {
        nomor_berkas: '', bulan: new Date().getMonth() + 1, tanggal: new Date().toISOString().split('T')[0],
        kode_transaksi_id: '', sumber_dana_id: '', arsip_kegiatan_id: '', akun_id: '',
        metode_pengadaan_id: '', penerima_dana: '', uraian_kegiatan: '',
        jumlah_bruto: 0, potongan: 0, ppk: '',
    };
    const [arsipForm, setArsipForm] = useState(emptyArsipForm);

    // Master data state
    const [masterData, setMasterData] = useState(initialMasterData || {});
    const [activeMasterTab, setActiveMasterTab] = useState('kodeTransaksis');
    const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
    const [editingMaster, setEditingMaster] = useState(null);
    const [masterForm, setMasterForm] = useState({});

    const showToast = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    };

    const handleApiError = (error) => {
        const status = error.response?.status;
        if (status === 403) {
            showToast('Akses ditolak. Anda tidak memiliki izin.', 'error');
        } else if (status === 422) {
            const errors = Object.values(error.response.data.errors ?? {}).flat();
            showToast(errors[0] ?? 'Data tidak valid.', 'error');
        } else {
            const msg = error.response?.data?.message || error.message;
            showToast(`Gagal (${status}): ${msg}`, 'error');
        }
    };

    // --- ARSIP CRUD ---
    const loadArsips = async (page = 1) => {
        setArsipLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', page);
            Object.entries(arsipFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
            const { data } = await window.axios.get(`/api/arsips?${params}`);
            setArsips(data.data || []);
            setArsipMeta(data.meta || { current_page: 1, last_page: 1, total: 0 });
        } catch (error) {
            handleApiError(error);
        } finally {
            setArsipLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'arsip_index') loadArsips();
    }, [view, arsipFilters]);

    const openCreateArsip = () => {
        setEditingArsip(null);
        setArsipForm(emptyArsipForm);
        setSelectedFile(null);
        setIsArsipModalOpen(true);
    };

    const openEditArsip = (item) => {
        setEditingArsip(item);
        setArsipForm({
            nomor_berkas: item.nomorBerkas, bulan: item.bulan,
            tanggal: item.tanggal, kode_transaksi_id: item.kodeTransaksiId || '',
            sumber_dana_id: item.sumberDanaId || '', arsip_kegiatan_id: item.arsipKegiatanId || '',
            akun_id: item.akunId || '', metode_pengadaan_id: item.metodePengadaanId || '',
            penerima_dana: item.penerimaDana, uraian_kegiatan: item.uraianKegiatan,
            jumlah_bruto: item.jumlahBruto, potongan: item.potongan, ppk: item.ppk || '',
        });
        setSelectedFile(null);
        setIsArsipModalOpen(true);
    };

    const openViewArsip = async (item) => {
        try {
            const { data } = await window.axios.get(`/api/arsips/${item.id}`);
            setViewingArsip(data.data || data);
            setIsViewModalOpen(true);
        } catch (error) {
            handleApiError(error);
        }
    };

    const handleSaveArsip = async (e) => {
        e.preventDefault();
        if (!canWrite) return;
        setIsSaving(true);

        const formData = new FormData();
        Object.entries(arsipForm).forEach(([key, val]) => {
            if (val !== '' && val !== null && val !== undefined) formData.append(key, val);
        });
        if (selectedFile) formData.append('file', selectedFile);

        try {
            const isEditing = !!editingArsip;
            const url = isEditing ? `/api/arsips/${editingArsip.id}` : '/api/arsips';
            await window.axios.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            showToast(isEditing ? 'Arsip berhasil diperbarui.' : 'Arsip berhasil ditambahkan.');
            setIsArsipModalOpen(false);
            loadArsips(arsipMeta.current_page);
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteArsip = async (id) => {
        if (!window.confirm('Hapus arsip ini? Data akan dipindahkan ke sampah.')) return;
        try {
            await window.axios.delete(`/api/arsips/${id}`);
            showToast('Arsip berhasil dihapus.');
            loadArsips(arsipMeta.current_page);
        } catch (error) {
            handleApiError(error);
        }
    };

    const downloadFile = (id) => {
        window.open(`/api/arsips/${id}/download`, '_blank');
    };

    // --- MASTER DATA CRUD ---
    const masterTabConfig = MASTER_TABS.find(t => t.key === activeMasterTab);
    const masterApiPath = {
        kodeTransaksis: 'kode-transaksis',
        sumberDanas: 'sumber-danas',
        akuns: 'akuns',
        arsipKegiatans: 'arsip-kegiatans',
        metodePengadaans: 'metode-pengadaans',
    };

    const loadMasterData = async (key) => {
        try {
            const { data } = await window.axios.get(`/api/master/${masterApiPath[key]}`);
            setMasterData(prev => ({ ...prev, [key]: data.data || data }));
        } catch (error) {
            handleApiError(error);
        }
    };

    const openCreateMaster = () => {
        setEditingMaster(null);
        const initial = {};
        masterTabConfig.fields.forEach(f => { initial[f] = ''; });
        if (masterTabConfig.key === 'metodePengadaans') initial.kategori = 'Penyedia';
        setMasterForm(initial);
        setIsMasterModalOpen(true);
    };

    const openEditMaster = (item) => {
        setEditingMaster(item);
        const form = {};
        masterTabConfig.fields.forEach(f => { form[f] = item[f] || ''; });
        setMasterForm(form);
        setIsMasterModalOpen(true);
    };

    const handleSaveMaster = async (e) => {
        e.preventDefault();
        if (!canWrite) return;
        setIsSaving(true);

        try {
            const apiKey = masterApiPath[activeMasterTab];
            const isEditing = !!editingMaster;
            if (isEditing) {
                await window.axios.put(`/api/master/${apiKey}/${editingMaster.id}`, masterForm);
            } else {
                await window.axios.post(`/api/master/${apiKey}`, masterForm);
            }
            showToast(isEditing ? 'Data berhasil diperbarui.' : 'Data berhasil ditambahkan.');
            setIsMasterModalOpen(false);
            loadMasterData(activeMasterTab);
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteMaster = async (id) => {
        if (!window.confirm('Hapus data master ini?')) return;
        try {
            const apiKey = masterApiPath[activeMasterTab];
            await window.axios.delete(`/api/master/${apiKey}/${id}`);
            showToast('Data berhasil dihapus.');
            loadMasterData(activeMasterTab);
        } catch (error) {
            handleApiError(error);
        }
    };

    const importFileRef = useRef(null);
    const [isImporting, setIsImporting] = useState(false);

    const handleImportExcel = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';

        setIsImporting(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const apiKey = masterApiPath[activeMasterTab];
            const { data } = await window.axios.post(`/api/master/${apiKey}/import`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            showToast(data.message);
            loadMasterData(activeMasterTab);
        } catch (error) {
            if (error.response?.status === 422) {
                const errors = error.response.data.errors;
                if (errors) {
                    const msgs = Object.values(errors).flat();
                    showToast(msgs[0] ?? 'File tidak valid.', 'error');
                } else {
                    showToast(error.response.data.message || 'File tidak valid.', 'error');
                }
            } else {
                handleApiError(error);
            }
        } finally {
            setIsImporting(false);
        }
    };

    // Page title
    const pageTitle = useMemo(() => {
        if (view === 'arsip_index') return 'Data Arsip Digital';
        if (view === 'master_data') return 'Master Data';
        return 'Arsip Digital';
    }, [view]);

    return (
        <>
            <Head title={`Arsip Digital — SIMORA`} />

            {/* Toast */}
            {notification.show && (
                <div className={`fixed top-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl text-white font-bold text-base animate-in slide-in-from-top-4 duration-300 ${notification.type === 'success' ? 'bg-cyan-600' : 'bg-rose-500'}`}>
                    {notification.type === 'success' ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
                    {notification.message}
                </div>
            )}

            <div className="flex h-screen bg-sky-50 font-sans antialiased">
                {/* SIDEBAR */}
                <aside className="w-20 lg:w-72 bg-white h-full border-r border-cyan-100 flex flex-col justify-between transition-all duration-300 z-50 overflow-y-auto">
                    <div>
                        <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-cyan-100 shrink-0">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-200 overflow-hidden"><LogoKLHK size={40} /></div>
                            <div className="hidden lg:block ml-3"><h1 className="font-bold text-lg leading-none tracking-tight text-slate-900">SIMORA</h1><span className="text-xs font-bold text-cyan-600 uppercase tracking-widest mt-0.5 block">Arsip Digital</span></div>
                        </div>
                        <div className="p-4 space-y-1 mt-2">
                            <a href="/" className="w-full flex items-center p-3 rounded-2xl text-slate-500 hover:bg-sky-50 transition-all duration-200 group">
                                <ArrowLeft size={22} />
                                <span className="hidden lg:block ml-3 font-semibold text-sm">Kembali ke SIMORA</span>
                            </a>
                            <div className="my-2 border-t border-cyan-100" />
                            <button onClick={() => setView('arsip_index')} className={`w-full flex items-center p-3 rounded-2xl transition-all duration-200 ${view === 'arsip_index' ? 'bg-cyan-50 text-cyan-700 shadow-sm' : 'text-slate-500 hover:bg-sky-50'}`}>
                                <Archive size={22} className={view === 'arsip_index' ? 'stroke-[2.5px]' : ''} />
                                <span className="hidden lg:block ml-3 font-semibold text-sm">Data Arsip</span>
                            </button>
                            {canWrite && (
                                <button onClick={() => setView('master_data')} className={`w-full flex items-center p-3 rounded-2xl transition-all duration-200 ${view === 'master_data' ? 'bg-cyan-50 text-cyan-700 shadow-sm' : 'text-slate-500 hover:bg-sky-50'}`}>
                                    <Database size={22} className={view === 'master_data' ? 'stroke-[2.5px]' : ''} />
                                    <span className="hidden lg:block ml-3 font-semibold text-sm">Master Data</span>
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="p-4 border-t border-cyan-100 shrink-0">
                        {auth?.user && (
                            <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-sky-50 rounded-xl border border-cyan-100">
                                <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center shrink-0"><UserCircle className="text-white" size={18} /></div>
                                <div className="min-w-0"><p className="text-xs font-bold text-slate-800 truncate">{auth.user.name}</p><p className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider">{auth.user.role}</p></div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* MAIN */}
                <main className="flex-1 h-full overflow-y-auto overflow-x-hidden">
                    <header className="sticky top-0 z-30 bg-sky-50/90 backdrop-blur-md px-8 py-6 flex justify-between items-center border-b border-cyan-100">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{pageTitle}</h2>
                            <p className="text-sm text-slate-500 mt-1">{arsipMeta.total ?? 0} total arsip</p>
                        </div>
                        <div className="flex gap-3">
                        </div>
                    </header>

                    <div className="px-8 pb-12 pt-6">
                        {/* ===== ARSIP INDEX ===== */}
                        {view === 'arsip_index' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Search bar */}
                                <div className="flex gap-3 items-center">
                                    <div className="flex-1 relative">
                                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="text" placeholder="Cari nomor berkas, penerima, uraian..." value={arsipFilters.search} onChange={e => setArsipFilters(p => ({ ...p, search: e.target.value }))} className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 outline-none bg-white" />
                                    </div>
                                    {canWrite && (
                                        <button onClick={openCreateArsip} className="flex items-center gap-1.5 bg-cyan-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-cyan-700 transition-all shadow-sm active:scale-95 shrink-0">
                                            <Plus size={15} /> Tambah
                                        </button>
                                    )}
                                </div>

                                {/* Spreadsheet-style Table */}
                                <div className="bg-white rounded-xl border border-cyan-200 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs border-collapse">
                                            {/* Header row */}
                                            <thead>
                                                <tr className="bg-cyan-700 text-white text-left">
                                                    <th className="px-2 py-2.5 font-semibold border-r border-cyan-600 whitespace-nowrap w-10 text-center">Bln</th>
                                                    <th className="px-2 py-2.5 font-semibold border-r border-cyan-600 whitespace-nowrap w-10 text-center">Ket</th>
                                                    <th className="px-2 py-2.5 font-semibold border-r border-cyan-600 whitespace-nowrap">NB</th>
                                                    <th className="px-2 py-2.5 font-semibold border-r border-cyan-600 whitespace-nowrap w-20">Tgl</th>
                                                    <th className="px-2 py-2.5 font-semibold border-r border-cyan-600 whitespace-nowrap">Kode Transaksi</th>
                                                    <th className="px-2 py-2.5 font-semibold border-r border-cyan-600 whitespace-nowrap w-10 text-center">SD</th>
                                                    <th className="px-2 py-2.5 font-semibold border-r border-cyan-600 whitespace-nowrap">Kegiatan</th>
                                                    <th className="px-2 py-2.5 font-semibold border-r border-cyan-600 whitespace-nowrap">Penerima</th>
                                                    <th className="px-2 py-2.5 font-semibold border-r border-cyan-600 min-w-[200px]">Uraian</th>
                                                    <th className="px-2 py-2.5 font-semibold border-r border-cyan-600 whitespace-nowrap text-right">Jumlah Bruto</th>
                                                    <th className="px-2 py-2.5 font-semibold border-r border-cyan-600 whitespace-nowrap text-right">Potongan</th>
                                                    <th className="px-2 py-2.5 font-semibold border-r border-cyan-600 whitespace-nowrap">Metode</th>
                                                    <th className="px-2 py-2.5 font-semibold border-r border-cyan-600 whitespace-nowrap w-8 text-center">File</th>
                                                    <th className="px-2 py-2.5 font-semibold whitespace-nowrap w-20 text-center">Aksi</th>
                                                </tr>
                                                {/* Filter row */}
                                                <tr className="bg-cyan-50 border-b border-cyan-200">
                                                    <td className="px-1 py-1 border-r border-cyan-200">
                                                        <select value={arsipFilters.bulan} onChange={e => setArsipFilters(p => ({ ...p, bulan: e.target.value }))} className="w-full px-1 py-0.5 text-[10px] rounded border border-slate-200 outline-none bg-white">
                                                            <option value="">-</option>
                                                            {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{String(i + 1).padStart(2, '0')}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-1 py-1 border-r border-cyan-200">
                                                        <select value={arsipFilters.status_verifikasi} onChange={e => setArsipFilters(p => ({ ...p, status_verifikasi: e.target.value }))} className="w-full px-1 py-0.5 text-[10px] rounded border border-slate-200 outline-none bg-white">
                                                            <option value="">-</option>
                                                            <option value="draft">Draft</option>
                                                            <option value="verified">OK</option>
                                                            <option value="rejected">Tolak</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-1 py-1 border-r border-cyan-200" />
                                                    <td className="px-1 py-1 border-r border-cyan-200" />
                                                    <td className="px-1 py-1 border-r border-cyan-200">
                                                        <select value={arsipFilters.kode_transaksi_id} onChange={e => setArsipFilters(p => ({ ...p, kode_transaksi_id: e.target.value }))} className="w-full px-1 py-0.5 text-[10px] rounded border border-slate-200 outline-none bg-white">
                                                            <option value="">-</option>
                                                            {(masterData.kodeTransaksis || []).map(kt => <option key={kt.id} value={kt.id}>{kt.kode}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-1 py-1 border-r border-cyan-200">
                                                        <select value={arsipFilters.sumber_dana_id} onChange={e => setArsipFilters(p => ({ ...p, sumber_dana_id: e.target.value }))} className="w-full px-1 py-0.5 text-[10px] rounded border border-slate-200 outline-none bg-white">
                                                            <option value="">-</option>
                                                            {(masterData.sumberDanas || []).map(sd => <option key={sd.id} value={sd.id}>{sd.kode}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-1 py-1 border-r border-cyan-200" />
                                                    <td className="px-1 py-1 border-r border-cyan-200" />
                                                    <td className="px-1 py-1 border-r border-cyan-200" />
                                                    <td className="px-1 py-1 border-r border-cyan-200" />
                                                    <td className="px-1 py-1 border-r border-cyan-200" />
                                                    <td className="px-1 py-1 border-r border-cyan-200">
                                                        <select value={arsipFilters.metode_pengadaan_id || ''} onChange={e => setArsipFilters(p => ({ ...p, metode_pengadaan_id: e.target.value }))} className="w-full px-1 py-0.5 text-[10px] rounded border border-slate-200 outline-none bg-white">
                                                            <option value="">-</option>
                                                            {(masterData.metodePengadaans || []).map(mp => <option key={mp.id} value={mp.id}>{mp.nama}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-1 py-1 border-r border-cyan-200" />
                                                    <td className="px-1 py-1" />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {arsipLoading ? (
                                                    <tr><td colSpan="14" className="px-3 py-10 text-center text-slate-400 italic text-xs">Memuat data...</td></tr>
                                                ) : arsips.length === 0 ? (
                                                    <tr><td colSpan="14" className="px-3 py-10 text-center text-slate-400 italic text-xs">Belum ada data arsip.</td></tr>
                                                ) : arsips.map((a, idx) => (
                                                    <tr key={a.id} className={`border-b border-slate-100 hover:bg-cyan-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-sky-50/30'}`}>
                                                        <td className="px-2 py-1.5 border-r border-slate-100 text-center font-mono text-slate-600">{String(a.bulan).padStart(2, '0')}</td>
                                                        <td className="px-2 py-1.5 border-r border-slate-100 text-center">
                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${a.statusVerifikasi === 'verified' ? 'bg-emerald-100 text-emerald-700' : a.statusVerifikasi === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                {a.statusVerifikasi === 'verified' ? 'ok' : a.statusVerifikasi === 'rejected' ? 'tolak' : 'draft'}
                                                            </span>
                                                        </td>
                                                        <td className="px-2 py-1.5 border-r border-slate-100 font-semibold text-slate-800 whitespace-nowrap">{a.nomorBerkas}</td>
                                                        <td className="px-2 py-1.5 border-r border-slate-100 text-slate-600 whitespace-nowrap font-mono">{a.tanggal?.substring(5)}</td>
                                                        <td className="px-2 py-1.5 border-r border-slate-100 text-slate-600 whitespace-nowrap">{a.kodeTransaksi ? `${a.kodeTransaksi.kode} ${a.kodeTransaksi.nama}` : '-'}</td>
                                                        <td className="px-2 py-1.5 border-r border-slate-100 text-center font-semibold text-slate-700">{a.sumberDana?.kode || '-'}</td>
                                                        <td className="px-2 py-1.5 border-r border-slate-100 text-slate-600 max-w-[120px] truncate">{a.arsipKegiatan?.nama || '-'}</td>
                                                        <td className="px-2 py-1.5 border-r border-slate-100 text-slate-700 max-w-[100px] truncate">{a.penerimaDana}</td>
                                                        <td className="px-2 py-1.5 border-r border-slate-100 text-slate-600 max-w-[250px]"><p className="line-clamp-2 leading-tight">{a.uraianKegiatan}</p></td>
                                                        <td className="px-2 py-1.5 border-r border-slate-100 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">{Number(a.jumlahBruto).toLocaleString('id-ID')}</td>
                                                        <td className="px-2 py-1.5 border-r border-slate-100 text-right font-mono text-slate-500 whitespace-nowrap">{Number(a.potongan) > 0 ? Number(a.potongan).toLocaleString('id-ID') : '-'}</td>
                                                        <td className="px-2 py-1.5 border-r border-slate-100 text-slate-600 whitespace-nowrap text-[10px]">{a.metodePengadaan ? a.metodePengadaan.nama : '-'}</td>
                                                        <td className="px-2 py-1.5 border-r border-slate-100 text-center">
                                                            {a.hasFile ? <button onClick={() => downloadFile(a.id)} className="text-cyan-600 hover:text-cyan-800" title="Download"><FileDown size={14} /></button> : <span className="text-slate-300 text-[10px]">-</span>}
                                                        </td>
                                                        <td className="px-1 py-1.5 text-center">
                                                            <div className="flex items-center justify-center gap-0.5">
                                                                <button onClick={() => openViewArsip(a)} className="p-1 rounded hover:bg-sky-100 text-slate-400 hover:text-cyan-700" title="Lihat"><Eye size={13} /></button>
                                                                {canWrite && <button onClick={() => openEditArsip(a)} className="p-1 rounded hover:bg-sky-100 text-slate-400 hover:text-blue-700" title="Edit"><Edit3 size={13} /></button>}
                                                                {canWrite && <button onClick={() => deleteArsip(a.id)} className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600" title="Hapus"><Trash2 size={13} /></button>}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            {arsips.length > 0 && (
                                                <tfoot>
                                                    <tr className="bg-cyan-700 text-white font-semibold">
                                                        <td colSpan="9" className="px-2 py-2 text-right text-xs">Total {arsips.length} data</td>
                                                        <td className="px-2 py-2 text-right font-mono text-xs whitespace-nowrap">{arsips.reduce((s, a) => s + Number(a.jumlahBruto), 0).toLocaleString('id-ID')}</td>
                                                        <td className="px-2 py-2 text-right font-mono text-xs whitespace-nowrap">{arsips.reduce((s, a) => s + Number(a.potongan), 0).toLocaleString('id-ID')}</td>
                                                        <td colSpan="3" />
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {arsipMeta.last_page > 1 && (
                                        <div className="flex items-center justify-between px-5 py-4 border-t border-sky-50">
                                            <p className="text-sm text-slate-500">Halaman {arsipMeta.current_page} dari {arsipMeta.last_page} ({arsipMeta.total} data)</p>
                                            <div className="flex gap-2">
                                                <button onClick={() => loadArsips(arsipMeta.current_page - 1)} disabled={arsipMeta.current_page <= 1} className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold disabled:opacity-30 hover:bg-sky-50 transition-colors"><ChevronLeft size={16} /></button>
                                                <button onClick={() => loadArsips(arsipMeta.current_page + 1)} disabled={arsipMeta.current_page >= arsipMeta.last_page} className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold disabled:opacity-30 hover:bg-sky-50 transition-colors"><ChevronRight size={16} /></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ===== MASTER DATA ===== */}
                        {view === 'master_data' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Tabs */}
                                <div className="flex gap-2 flex-wrap">
                                    {MASTER_TABS.map(tab => (
                                        <button key={tab.key} onClick={() => { setActiveMasterTab(tab.key); loadMasterData(tab.key); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeMasterTab === tab.key ? 'bg-cyan-600 text-white shadow-md' : 'bg-white text-slate-600 border border-cyan-100 hover:bg-sky-50'}`}>
                                            <tab.icon size={16} /> {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Master Table */}
                                <div className="bg-white rounded-2xl border border-cyan-100 shadow-sm overflow-hidden">
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-sky-50">
                                        <h3 className="font-bold text-lg text-slate-800">{masterTabConfig?.label}</h3>
                                        <div className="flex gap-2">
                                            <input type="file" ref={importFileRef} accept=".xlsx,.xls,.csv" onChange={handleImportExcel} className="hidden" />
                                            <button onClick={() => window.open(`/api/master/template/${masterApiPath[activeMasterTab]}`, '_blank')} className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl font-bold text-sm hover:bg-sky-50 transition-all active:scale-95">
                                                <FileDown size={16} /> Template
                                            </button>
                                            <button onClick={() => importFileRef.current?.click()} disabled={isImporting} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50">
                                                <Upload size={16} /> {isImporting ? 'Mengimpor...' : 'Import Excel'}
                                            </button>
                                            <button onClick={openCreateMaster} className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-cyan-700 transition-all active:scale-95"><Plus size={16} /> Tambah</button>
                                        </div>
                                    </div>
                                    <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-100 flex items-start gap-2">
                                        <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                                        <p className="text-xs text-amber-700">
                                            <strong>Format Excel:</strong> Baris pertama harus header kolom: <code className="bg-amber-100 px-1 rounded">{masterTabConfig?.fields.join(', ')}</code>. Format file: .xlsx, .xls, atau .csv. Data duplikat akan diperbarui otomatis.
                                        </p>
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-sky-50 text-left">
                                                <th className="px-6 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider w-12">#</th>
                                                {masterTabConfig?.fields.map(f => (
                                                    <th key={f} className="px-6 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider capitalize">{f}</th>
                                                ))}
                                                <th className="px-6 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider text-center w-24">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-sky-50">
                                            {(masterData[activeMasterTab] || []).length === 0 ? (
                                                <tr><td colSpan={masterTabConfig?.fields.length + 2} className="px-6 py-10 text-center text-slate-400 italic">Belum ada data.</td></tr>
                                            ) : (masterData[activeMasterTab] || []).map((item, idx) => (
                                                <tr key={item.id} className="hover:bg-sky-50/50 transition-colors">
                                                    <td className="px-6 py-3 text-slate-400">{idx + 1}</td>
                                                    {masterTabConfig?.fields.map(f => (
                                                        <td key={f} className="px-6 py-3 text-slate-700">{item[f] || '-'}</td>
                                                    ))}
                                                    <td className="px-6 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button onClick={() => openEditMaster(item)} className="p-1.5 rounded-lg hover:bg-sky-100 text-slate-500 hover:text-blue-700 transition-colors"><Edit3 size={16} /></button>
                                                            <button onClick={() => deleteMaster(item.id)} className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* ===== ARSIP FORM MODAL ===== */}
            {isArsipModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-blue-950/40">
                    <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-8 py-5 border-b border-cyan-100 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-xl text-slate-900">{editingArsip ? 'Edit Arsip' : 'Tambah Arsip Baru'}</h3>
                            <button onClick={() => setIsArsipModalOpen(false)} className="p-2 rounded-xl hover:bg-sky-100 transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveArsip} className="overflow-y-auto flex-1 p-8 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Nomor Berkas *</label>
                                    <input type="text" required value={arsipForm.nomor_berkas} onChange={e => setArsipForm(p => ({ ...p, nomor_berkas: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-cyan-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Bulan *</label>
                                    <select required value={arsipForm.bulan} onChange={e => setArsipForm(p => ({ ...p, bulan: Number(e.target.value) }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-cyan-500 outline-none">
                                        {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Tanggal *</label>
                                    <input type="date" required value={arsipForm.tanggal} onChange={e => setArsipForm(p => ({ ...p, tanggal: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-cyan-500 outline-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Kode Transaksi</label>
                                    <select value={arsipForm.kode_transaksi_id} onChange={e => setArsipForm(p => ({ ...p, kode_transaksi_id: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-cyan-500 outline-none">
                                        <option value="">-- Pilih --</option>
                                        {(masterData.kodeTransaksis || []).map(kt => <option key={kt.id} value={kt.id}>{kt.kode} - {kt.nama}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Sumber Dana</label>
                                    <select value={arsipForm.sumber_dana_id} onChange={e => setArsipForm(p => ({ ...p, sumber_dana_id: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-cyan-500 outline-none">
                                        <option value="">-- Pilih --</option>
                                        {(masterData.sumberDanas || []).map(sd => <option key={sd.id} value={sd.id}>{sd.kode} - {sd.nama}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Judul Kegiatan</label>
                                    <select value={arsipForm.arsip_kegiatan_id} onChange={e => setArsipForm(p => ({ ...p, arsip_kegiatan_id: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-cyan-500 outline-none">
                                        <option value="">-- Pilih --</option>
                                        {(masterData.arsipKegiatans || []).map(ak => <option key={ak.id} value={ak.id}>{ak.nama}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Nomor Akun</label>
                                    <select value={arsipForm.akun_id} onChange={e => setArsipForm(p => ({ ...p, akun_id: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-cyan-500 outline-none">
                                        <option value="">-- Pilih --</option>
                                        {(masterData.akuns || []).map(a => <option key={a.id} value={a.id}>{a.kode} - {a.nama}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Penerima Dana *</label>
                                <input type="text" required value={arsipForm.penerima_dana} onChange={e => setArsipForm(p => ({ ...p, penerima_dana: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-cyan-500 outline-none" />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Uraian Kegiatan *</label>
                                <textarea required rows={3} value={arsipForm.uraian_kegiatan} onChange={e => setArsipForm(p => ({ ...p, uraian_kegiatan: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-cyan-500 outline-none resize-none" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Jumlah Bruto *</label>
                                    <CurrencyInput value={arsipForm.jumlah_bruto} onChange={val => setArsipForm(p => ({ ...p, jumlah_bruto: val }))} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Potongan</label>
                                    <CurrencyInput value={arsipForm.potongan} onChange={val => setArsipForm(p => ({ ...p, potongan: val }))} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">PPK</label>
                                    <input type="text" value={arsipForm.ppk} onChange={e => setArsipForm(p => ({ ...p, ppk: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-cyan-500 outline-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Metode Pengadaan</label>
                                    <select value={arsipForm.metode_pengadaan_id} onChange={e => setArsipForm(p => ({ ...p, metode_pengadaan_id: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-cyan-500 outline-none">
                                        <option value="">-- Pilih --</option>
                                        {(masterData.metodePengadaans || []).map(mp => <option key={mp.id} value={mp.id}>[{mp.kategori}] {mp.nama}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">File Scan (PDF/JPG/PNG, maks 10MB)</label>
                                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" ref={fileInputRef} onChange={e => setSelectedFile(e.target.files[0] || null)} className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100" />
                                    {editingArsip?.hasFile && !selectedFile && (
                                        <p className="text-xs text-slate-500 mt-1">File saat ini: {editingArsip.fileName}</p>
                                    )}
                                </div>
                            </div>
                        </form>
                        <div className="px-8 py-4 border-t border-cyan-100 flex justify-end gap-3 shrink-0">
                            <button onClick={() => setIsArsipModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-sky-50 transition-all">Batal</button>
                            <button onClick={handleSaveArsip} disabled={isSaving} className="px-6 py-2.5 rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-700 transition-all disabled:opacity-50 flex items-center gap-2">
                                <Save size={16} /> {isSaving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== VIEW MODAL ===== */}
            {isViewModalOpen && viewingArsip && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-blue-950/40">
                    <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-8 py-5 border-b border-cyan-100 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-xl text-slate-900">Detail Arsip</h3>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-2 rounded-xl hover:bg-sky-100 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-8">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                {[
                                    ['Nomor Berkas', viewingArsip.nomorBerkas],
                                    ['Tanggal', viewingArsip.tanggal],
                                    ['Bulan', MONTH_NAMES[(viewingArsip.bulan || 1) - 1]],
                                    ['Kode Transaksi', viewingArsip.kodeTransaksi ? `${viewingArsip.kodeTransaksi.kode} - ${viewingArsip.kodeTransaksi.nama}` : '-'],
                                    ['Sumber Dana', viewingArsip.sumberDana ? `${viewingArsip.sumberDana.kode} - ${viewingArsip.sumberDana.nama}` : '-'],
                                    ['Judul Kegiatan', viewingArsip.arsipKegiatan?.nama || '-'],
                                    ['Nomor Akun', viewingArsip.akun ? `${viewingArsip.akun.kode} - ${viewingArsip.akun.nama}` : '-'],
                                    ['Penerima Dana', viewingArsip.penerimaDana],
                                    ['Jumlah Bruto', formatIDR(viewingArsip.jumlahBruto)],
                                    ['Potongan', formatIDR(viewingArsip.potongan)],
                                    ['Jumlah Netto', formatIDR(viewingArsip.jumlahNetto)],
                                    ['PPK', viewingArsip.ppk || '-'],
                                    ['Metode Pengadaan', viewingArsip.metodePengadaan ? `[${viewingArsip.metodePengadaan.kategori}] ${viewingArsip.metodePengadaan.nama}` : '-'],
                                    ['Status', viewingArsip.statusVerifikasi],
                                    ['File', viewingArsip.fileName || 'Tidak ada file'],
                                ].map(([label, value]) => (
                                    <div key={label}>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                                        <p className="font-semibold text-slate-800 mt-0.5">{value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-5">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Uraian Kegiatan</p>
                                <p className="font-medium text-slate-700 mt-1 bg-sky-50 p-4 rounded-xl">{viewingArsip.uraianKegiatan}</p>
                            </div>
                        </div>
                        <div className="px-8 py-4 border-t border-cyan-100 flex justify-end gap-3 shrink-0">
                            {viewingArsip.hasFile && (
                                <button onClick={() => downloadFile(viewingArsip.id)} className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-700 flex items-center gap-2"><FileDown size={16} /> Download File</button>
                            )}
                            <button onClick={() => setIsViewModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-sky-50 transition-all">Tutup</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MASTER DATA FORM MODAL ===== */}
            {isMasterModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-blue-950/40">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
                        <div className="px-8 py-5 border-b border-cyan-100 flex justify-between items-center">
                            <h3 className="font-bold text-xl text-slate-900">{editingMaster ? 'Edit' : 'Tambah'} {masterTabConfig?.label}</h3>
                            <button onClick={() => setIsMasterModalOpen(false)} className="p-2 rounded-xl hover:bg-sky-100 transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveMaster} className="p-8 space-y-4">
                            {masterTabConfig?.fields.map(field => (
                                <div key={field}>
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block capitalize">{field}</label>
                                    {field === 'kategori' ? (
                                        <select value={masterForm[field] || ''} onChange={e => setMasterForm(p => ({ ...p, [field]: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-cyan-500 outline-none">
                                            <option value="Penyedia">Penyedia</option>
                                            <option value="Swakelola">Swakelola</option>
                                        </select>
                                    ) : field === 'deskripsi' ? (
                                        <textarea rows={3} value={masterForm[field] || ''} onChange={e => setMasterForm(p => ({ ...p, [field]: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-cyan-500 outline-none resize-none" />
                                    ) : (
                                        <input type="text" required value={masterForm[field] || ''} onChange={e => setMasterForm(p => ({ ...p, [field]: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-cyan-500 outline-none" />
                                    )}
                                </div>
                            ))}
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsMasterModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-sky-50 transition-all">Batal</button>
                                <button type="submit" disabled={isSaving} className="px-6 py-2.5 rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-700 transition-all disabled:opacity-50 flex items-center gap-2">
                                    <Save size={16} /> {isSaving ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default App;
