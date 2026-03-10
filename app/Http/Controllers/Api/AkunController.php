<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MasterData\StoreAkunRequest;
use App\Http\Requests\MasterData\UpdateAkunRequest;
use App\Http\Resources\AkunResource;
use App\Imports\AkunImport;
use App\Models\Akun;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Maatwebsite\Excel\Facades\Excel;

class AkunController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return AkunResource::collection(
            Akun::orderBy('kode')->get()
        );
    }

    public function store(StoreAkunRequest $request): JsonResponse
    {
        $item = Akun::create($request->validated());

        return (new AkunResource($item))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateAkunRequest $request, Akun $akun): AkunResource
    {
        $akun->update($request->validated());

        return new AkunResource($akun);
    }

    public function destroy(Akun $akun): Response
    {
        $akun->delete();

        return response()->noContent();
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:5120',
        ]);

        $import = new AkunImport();
        Excel::import($import, $request->file('file'));

        return response()->json([
            'message'  => "Berhasil mengimpor {$import->imported} data Akun.",
            'imported' => $import->imported,
        ]);
    }
}
