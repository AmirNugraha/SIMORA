<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRealisasiLogRequest;
use App\Http\Resources\RealisasiLogResource;
use App\Models\Komponen;
use App\Models\RealisasiLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class RealisasiLogController extends Controller
{
    /**
     * POST /api/komponens/{komponen}/logs
     * Protected — operator/admin only.
     */
    public function store(StoreRealisasiLogRequest $request, Komponen $komponen): JsonResponse
    {
        $validated = $request->validated();
        $validated['nominal'] = (string) $validated['nominal'];

        $log = $komponen->logs()->create([
            ...$validated,
            'created_by' => $request->user()?->id,
        ]);

        return (new RealisasiLogResource($log))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * DELETE /api/logs/{log}
     * Protected — operator/admin only.
     */
    public function destroy(RealisasiLog $log): Response
    {
        $log->delete();

        return response()->noContent();
    }
}
