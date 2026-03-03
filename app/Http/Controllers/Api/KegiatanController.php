<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Kegiatan\StoreKegiatanRequest;
use App\Http\Requests\Kegiatan\UpdateKegiatanRequest;
use App\Http\Resources\KegiatanResource;
use App\Models\Kegiatan;
use App\Services\KegiatanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class KegiatanController extends Controller
{
    public function __construct(private readonly KegiatanService $service) {}

    /**
     * GET /api/kegiatans
     * Public — no auth required.
     */
    public function index(): AnonymousResourceCollection
    {
        $kegiatans = Kegiatan::with([
            'komponens'      => fn ($q) => $q->orderBy('id'),
            'komponens.logs' => fn ($q) => $q->orderByDesc('tanggal'),
        ])
            ->orderBy('kategori')
            ->orderBy('kode')
            ->get();

        return KegiatanResource::collection($kegiatans);
    }

    /**
     * POST /api/kegiatans
     * Protected — operator/admin only.
     */
    public function store(StoreKegiatanRequest $request): JsonResponse
    {
        $kegiatan = $this->service->create($request->validated());

        return (new KegiatanResource($kegiatan))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * PUT /api/kegiatans/{kegiatan}
     * Protected — operator/admin only.
     */
    public function update(UpdateKegiatanRequest $request, Kegiatan $kegiatan): KegiatanResource
    {
        $updated = $this->service->update($kegiatan, $request->validated());

        return new KegiatanResource($updated);
    }

    /**
     * DELETE /api/kegiatans/{kegiatan}
     * Protected — operator/admin only.
     * DB cascade handles komponen and log deletion.
     */
    public function destroy(Kegiatan $kegiatan): Response
    {
        $kegiatan->delete();

        return response()->noContent();
    }
}
