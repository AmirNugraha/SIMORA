<?php

namespace App\Http\Controllers;

use App\Http\Resources\AkunResource;
use App\Http\Resources\ArsipKegiatanResource;
use App\Http\Resources\KodeTransaksiResource;
use App\Http\Resources\MetodePengadaanResource;
use App\Http\Resources\SumberDanaResource;
use App\Models\Akun;
use App\Models\ArsipKegiatan;
use App\Models\KodeTransaksi;
use App\Models\MetodePengadaan;
use App\Models\SumberDana;
use Inertia\Inertia;
use Inertia\Response;

class ArsipPageController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Arsip', [
            'masterData' => [
                'kodeTransaksis'   => KodeTransaksiResource::collection(KodeTransaksi::where('is_active', true)->orderBy('kode')->get()),
                'sumberDanas'      => SumberDanaResource::collection(SumberDana::where('is_active', true)->orderBy('kode')->get()),
                'akuns'            => AkunResource::collection(Akun::where('is_active', true)->orderBy('kode')->get()),
                'arsipKegiatans'   => ArsipKegiatanResource::collection(ArsipKegiatan::where('is_active', true)->orderBy('nama')->get()),
                'metodePengadaans' => MetodePengadaanResource::collection(MetodePengadaan::where('is_active', true)->orderBy('kategori')->orderBy('nama')->get()),
            ],
        ]);
    }
}
