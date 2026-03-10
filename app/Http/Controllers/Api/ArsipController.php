<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Arsip\StoreArsipRequest;
use App\Http\Requests\Arsip\UpdateArsipRequest;
use App\Http\Resources\ArsipResource;
use App\Models\Arsip;
use App\Services\ArsipService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ArsipController extends Controller
{
    public function __construct(private readonly ArsipService $service) {}

    /**
     * GET /api/arsips — paginated + filtered list
     */
    public function index(Request $request)
    {
        $query = Arsip::with([
            'kodeTransaksi', 'sumberDana', 'arsipKegiatan',
            'akun', 'metodePengadaan', 'creator',
        ]);

        if ($request->filled('bulan')) {
            $query->where('bulan', $request->bulan);
        }
        if ($request->filled('kode_transaksi_id')) {
            $query->where('kode_transaksi_id', $request->kode_transaksi_id);
        }
        if ($request->filled('sumber_dana_id')) {
            $query->where('sumber_dana_id', $request->sumber_dana_id);
        }
        if ($request->filled('status_verifikasi')) {
            $query->where('status_verifikasi', $request->status_verifikasi);
        }
        if ($request->filled('metode_pengadaan_id')) {
            $query->where('metode_pengadaan_id', $request->metode_pengadaan_id);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nomor_berkas', 'like', "%{$search}%")
                  ->orWhere('penerima_dana', 'like', "%{$search}%")
                  ->orWhere('uraian_kegiatan', 'like', "%{$search}%");
            });
        }

        $arsips = $query->orderByDesc('tanggal')->orderByDesc('id')->paginate(25);

        return ArsipResource::collection($arsips);
    }

    /**
     * GET /api/arsips/{arsip}
     */
    public function show(Arsip $arsip): ArsipResource
    {
        return new ArsipResource($arsip->load([
            'kodeTransaksi', 'sumberDana', 'arsipKegiatan',
            'akun', 'metodePengadaan', 'creator', 'verifier',
        ]));
    }

    /**
     * POST /api/arsips
     */
    public function store(StoreArsipRequest $request): JsonResponse
    {
        $arsip = $this->service->create(
            $request->safe()->except('file'),
            $request->file('file'),
            $request->user()?->id
        );

        return (new ArsipResource($arsip))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * POST /api/arsips/{arsip} — uses POST for multipart file upload
     */
    public function update(UpdateArsipRequest $request, Arsip $arsip): ArsipResource
    {
        $updated = $this->service->update(
            $arsip,
            $request->safe()->except('file'),
            $request->file('file'),
            $request->user()?->id
        );

        return new ArsipResource($updated);
    }

    /**
     * DELETE /api/arsips/{arsip}
     */
    public function destroy(Arsip $arsip): Response
    {
        $this->service->delete($arsip);

        return response()->noContent();
    }

    /**
     * GET /api/arsips/{arsip}/download
     */
    public function download(Arsip $arsip): StreamedResponse|JsonResponse
    {
        if (!$arsip->file_path || !Storage::disk('local')->exists($arsip->file_path)) {
            return response()->json(['message' => 'File tidak ditemukan.'], 404);
        }

        return Storage::disk('local')->download(
            $arsip->file_path,
            $arsip->file_name ?? basename($arsip->file_path)
        );
    }
}
