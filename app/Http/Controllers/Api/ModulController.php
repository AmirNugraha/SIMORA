<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MasterData\StoreModulRequest;
use App\Http\Requests\MasterData\UpdateModulRequest;
use App\Http\Resources\ModulResource;
use App\Models\Modul;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ModulController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return ModulResource::collection(
            Modul::orderBy('kode')->get()
        );
    }

    public function store(StoreModulRequest $request): JsonResponse
    {
        $item = Modul::create($request->validated());

        return (new ModulResource($item))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateModulRequest $request, Modul $modul): ModulResource
    {
        $modul->update($request->validated());

        return new ModulResource($modul);
    }

    public function destroy(Modul $modul): Response
    {
        $modul->delete();

        return response()->noContent();
    }
}
