<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MasterData\StoreAksesModulRequest;
use App\Http\Requests\MasterData\UpdateAksesModulRequest;
use App\Http\Resources\AksesModulResource;
use App\Models\AksesModul;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class AksesModulController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return AksesModulResource::collection(
            AksesModul::with(['user', 'modul'])->get()
        );
    }

    public function store(StoreAksesModulRequest $request): JsonResponse
    {
        $item = AksesModul::create($request->validated());

        return (new AksesModulResource($item->load(['user', 'modul'])))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateAksesModulRequest $request, AksesModul $aksesModul): AksesModulResource
    {
        $aksesModul->update($request->validated());

        return new AksesModulResource($aksesModul->load(['user', 'modul']));
    }

    public function destroy(AksesModul $aksesModul): Response
    {
        $aksesModul->delete();

        return response()->noContent();
    }
}
