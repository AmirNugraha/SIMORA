<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MasterData\StoreKodeTransaksiRequest;
use App\Http\Requests\MasterData\UpdateKodeTransaksiRequest;
use App\Http\Resources\KodeTransaksiResource;
use App\Imports\KodeTransaksiImport;
use App\Models\KodeTransaksi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Maatwebsite\Excel\Facades\Excel;

class KodeTransaksiController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return KodeTransaksiResource::collection(
            KodeTransaksi::orderBy('kode')->get()
        );
    }

    public function store(StoreKodeTransaksiRequest $request): JsonResponse
    {
        $item = KodeTransaksi::create($request->validated());

        return (new KodeTransaksiResource($item))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateKodeTransaksiRequest $request, KodeTransaksi $kodeTransaksi): KodeTransaksiResource
    {
        $kodeTransaksi->update($request->validated());

        return new KodeTransaksiResource($kodeTransaksi);
    }

    public function destroy(KodeTransaksi $kodeTransaksi): Response
    {
        $kodeTransaksi->delete();

        return response()->noContent();
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:5120',
        ]);

        $import = new KodeTransaksiImport();
        Excel::import($import, $request->file('file'));

        return response()->json([
            'message'  => "Berhasil mengimpor {$import->imported} data Kode Transaksi.",
            'imported' => $import->imported,
        ]);
    }
}
