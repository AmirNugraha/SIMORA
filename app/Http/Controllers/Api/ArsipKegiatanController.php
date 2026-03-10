<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MasterData\StoreArsipKegiatanRequest;
use App\Http\Requests\MasterData\UpdateArsipKegiatanRequest;
use App\Http\Resources\ArsipKegiatanResource;
use App\Imports\ArsipKegiatanImport;
use App\Models\ArsipKegiatan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Maatwebsite\Excel\Facades\Excel;

class ArsipKegiatanController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return ArsipKegiatanResource::collection(
            ArsipKegiatan::orderBy('nama')->get()
        );
    }

    public function store(StoreArsipKegiatanRequest $request): JsonResponse
    {
        $item = ArsipKegiatan::create($request->validated());

        return (new ArsipKegiatanResource($item))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateArsipKegiatanRequest $request, ArsipKegiatan $arsipKegiatan): ArsipKegiatanResource
    {
        $arsipKegiatan->update($request->validated());

        return new ArsipKegiatanResource($arsipKegiatan);
    }

    public function destroy(ArsipKegiatan $arsipKegiatan): Response
    {
        $arsipKegiatan->delete();

        return response()->noContent();
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:5120',
        ]);

        $import = new ArsipKegiatanImport();
        Excel::import($import, $request->file('file'));

        return response()->json([
            'message'  => "Berhasil mengimpor {$import->imported} data Kegiatan Arsip.",
            'imported' => $import->imported,
        ]);
    }
}
