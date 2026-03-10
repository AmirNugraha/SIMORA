<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MasterData\StoreMetodePengadaanRequest;
use App\Http\Requests\MasterData\UpdateMetodePengadaanRequest;
use App\Http\Resources\MetodePengadaanResource;
use App\Imports\MetodePengadaanImport;
use App\Models\MetodePengadaan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Maatwebsite\Excel\Facades\Excel;

class MetodePengadaanController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return MetodePengadaanResource::collection(
            MetodePengadaan::orderBy('kategori')->orderBy('nama')->get()
        );
    }

    public function store(StoreMetodePengadaanRequest $request): JsonResponse
    {
        $item = MetodePengadaan::create($request->validated());

        return (new MetodePengadaanResource($item))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateMetodePengadaanRequest $request, MetodePengadaan $metodePengadaan): MetodePengadaanResource
    {
        $metodePengadaan->update($request->validated());

        return new MetodePengadaanResource($metodePengadaan);
    }

    public function destroy(MetodePengadaan $metodePengadaan): Response
    {
        $metodePengadaan->delete();

        return response()->noContent();
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:5120',
        ]);

        $import = new MetodePengadaanImport();
        Excel::import($import, $request->file('file'));

        return response()->json([
            'message'  => "Berhasil mengimpor {$import->imported} data Metode Pengadaan.",
            'imported' => $import->imported,
        ]);
    }
}
