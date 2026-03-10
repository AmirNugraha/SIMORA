<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MasterData\StoreSumberDanaRequest;
use App\Http\Requests\MasterData\UpdateSumberDanaRequest;
use App\Http\Resources\SumberDanaResource;
use App\Imports\SumberDanaImport;
use App\Models\SumberDana;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Maatwebsite\Excel\Facades\Excel;

class SumberDanaController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return SumberDanaResource::collection(
            SumberDana::orderBy('kode')->get()
        );
    }

    public function store(StoreSumberDanaRequest $request): JsonResponse
    {
        $item = SumberDana::create($request->validated());

        return (new SumberDanaResource($item))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateSumberDanaRequest $request, SumberDana $sumberDana): SumberDanaResource
    {
        $sumberDana->update($request->validated());

        return new SumberDanaResource($sumberDana);
    }

    public function destroy(SumberDana $sumberDana): Response
    {
        $sumberDana->delete();

        return response()->noContent();
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:5120',
        ]);

        $import = new SumberDanaImport();
        Excel::import($import, $request->file('file'));

        return response()->json([
            'message'  => "Berhasil mengimpor {$import->imported} data Sumber Dana.",
            'imported' => $import->imported,
        ]);
    }
}
