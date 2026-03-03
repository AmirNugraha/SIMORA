<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdatePerformanceRequest;
use App\Models\PerformanceData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PerformanceController extends Controller
{
    private const CATEGORIES = ['Tata Usaha', 'PEV', 'RHL', 'PKDAS'];

    /**
     * GET /api/performance?tahun=2026
     * Public — no auth required.
     * Always returns all 4 categories for the given year (with defaults if missing).
     */
    public function index(Request $request): JsonResponse
    {
        $tahun   = $request->integer('tahun', now()->year);
        $records = PerformanceData::where('tahun', $tahun)->get()->keyBy('kategori');

        $result = collect(self::CATEGORIES)->map(fn (string $cat) => [
            'kategori'       => $cat,
            'tahun'          => $tahun,
            'monthlyTargets' => $records[$cat]?->monthly_targets ?? array_fill(0, 12, 0),
            'status'         => $records[$cat]?->status ?? 'On Progress',
            'kendala'        => $records[$cat]?->kendala ?? '',
            'rekomendasi'    => $records[$cat]?->rekomendasi ?? '',
        ]);

        return response()->json($result);
    }

    /**
     * PUT /api/performance/{kategori}
     * Protected — operator/admin only.
     */
    public function update(UpdatePerformanceRequest $request, string $kategori): JsonResponse
    {
        $validated = $request->validated();

        $record = PerformanceData::updateOrCreate(
            ['kategori' => $kategori, 'tahun' => $validated['tahun']],
            [
                'monthly_targets' => $validated['monthlyTargets'],
                'status'          => $validated['status'],
                'kendala'         => $validated['kendala'] ?? null,
                'rekomendasi'     => $validated['rekomendasi'] ?? null,
            ]
        );

        return response()->json([
            'kategori'       => $record->kategori,
            'tahun'          => $record->tahun,
            'monthlyTargets' => $record->monthly_targets,
            'status'         => $record->status,
            'kendala'        => $record->kendala ?? '',
            'rekomendasi'    => $record->rekomendasi ?? '',
        ]);
    }
}
