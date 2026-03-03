<?php

namespace App\Http\Controllers;

use App\Http\Resources\KegiatanResource;
use App\Models\Kegiatan;
use App\Models\PerformanceData;
use Inertia\Inertia;
use Inertia\Response;

class SiioraController extends Controller
{
    /**
     * Render the SIMORA dashboard with server-side initial data.
     * Eliminates client-side loading flash on first visit.
     */
    public function index(): Response
    {
        $kegiatans = Kegiatan::with([
            'komponens'      => fn ($q) => $q->orderBy('id'),
            'komponens.logs' => fn ($q) => $q->orderByDesc('tanggal'),
        ])
            ->orderBy('kategori')
            ->orderBy('kode')
            ->get();

        $tahun       = now()->year;
        $perfByKey   = PerformanceData::where('tahun', $tahun)->get()->keyBy('kategori');
        $categories  = ['Tata Usaha', 'PEV', 'RHL', 'PKDAS'];

        $initialPerformance = collect($categories)->map(fn ($cat) => [
            'kategori'       => $cat,
            'tahun'          => $tahun,
            'monthlyTargets' => $perfByKey[$cat]?->monthly_targets ?? array_fill(0, 12, 0),
            'status'         => $perfByKey[$cat]?->status          ?? 'On Progress',
            'kendala'        => $perfByKey[$cat]?->kendala          ?? '',
            'rekomendasi'    => $perfByKey[$cat]?->rekomendasi      ?? '',
        ]);

        return Inertia::render('Simora', [
            'initialActivities'  => KegiatanResource::collection($kegiatans),
            'initialPerformance' => $initialPerformance,
        ]);
    }
}
