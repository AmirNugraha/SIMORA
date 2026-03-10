<?php

use App\Http\Controllers\Api\AksesModulController;
use App\Http\Controllers\Api\AkunController;
use App\Http\Controllers\Api\ArsipController;
use App\Http\Controllers\Api\ArsipKegiatanController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\KegiatanController;
use App\Http\Controllers\Api\KodeTransaksiController;
use App\Http\Controllers\Api\MasterDataTemplateController;
use App\Http\Controllers\Api\MetodePengadaanController;
use App\Http\Controllers\Api\ModulController;
use App\Http\Controllers\Api\PerformanceController;
use App\Http\Controllers\Api\RealisasiLogController;
use App\Http\Controllers\Api\SumberDanaController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES — Accessible without authentication (read-only)
|--------------------------------------------------------------------------
*/
Route::get('/kegiatans',  [KegiatanController::class, 'index']);
Route::get('/performance', [PerformanceController::class, 'index']);

/*
|--------------------------------------------------------------------------
| ARSIP — Authenticated routes (read for all, write for operator+)
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {
    Route::get('/arsips',                  [ArsipController::class, 'index']);
    Route::get('/arsips/{arsip}',          [ArsipController::class, 'show']);
    Route::get('/arsips/{arsip}/download', [ArsipController::class, 'download']);
});

Route::middleware(['auth', 'operator'])->group(function () {
    Route::post  ('/arsips',          [ArsipController::class, 'store']);
    Route::post  ('/arsips/{arsip}',  [ArsipController::class, 'update']); // POST for multipart
    Route::delete('/arsips/{arsip}',  [ArsipController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| PROTECTED ROUTES — Requires authentication + operator/admin role
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'operator'])->group(function () {

    // Kegiatan CRUD
    Route::post  ('/kegiatans',             [KegiatanController::class, 'store']);
    Route::put   ('/kegiatans/{kegiatan}',  [KegiatanController::class, 'update']);
    Route::delete('/kegiatans/{kegiatan}',  [KegiatanController::class, 'destroy']);

    // Realisasi Logs (nested under komponen)
    Route::post  ('/komponens/{komponen}/logs', [RealisasiLogController::class, 'store']);
    Route::delete('/logs/{log}',               [RealisasiLogController::class, 'destroy']);

    // Performance Data
    Route::put('/performance/{kategori}', [PerformanceController::class, 'update'])
        ->where('kategori', 'Tata Usaha|PEV|RHL|PKDAS');

    // Backup & Restore (full database)
    Route::get ('/backup',  [BackupController::class, 'export']);
    Route::post('/restore', [BackupController::class, 'import']);

    // Master Data Template Download
    Route::get('master/template/{type}', [MasterDataTemplateController::class, 'download'])
        ->where('type', 'kode-transaksis|sumber-danas|akuns|arsip-kegiatans|metode-pengadaans');

    // Master Data Import Excel (before apiResource to avoid route conflict)
    Route::post('master/kode-transaksis/import',   [KodeTransaksiController::class, 'import']);
    Route::post('master/sumber-danas/import',      [SumberDanaController::class, 'import']);
    Route::post('master/akuns/import',             [AkunController::class, 'import']);
    Route::post('master/arsip-kegiatans/import',   [ArsipKegiatanController::class, 'import']);
    Route::post('master/metode-pengadaans/import', [MetodePengadaanController::class, 'import']);

    // Master Data CRUD
    Route::apiResource('master/kode-transaksis',   KodeTransaksiController::class);
    Route::apiResource('master/sumber-danas',      SumberDanaController::class);
    Route::apiResource('master/akuns',             AkunController::class);
    Route::apiResource('master/arsip-kegiatans',   ArsipKegiatanController::class);
    Route::apiResource('master/metode-pengadaans', MetodePengadaanController::class);
    Route::apiResource('master/moduls',            ModulController::class);
});

/*
|--------------------------------------------------------------------------
| ADMIN-ONLY ROUTES — Requires admin role
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'admin'])->group(function () {
    Route::get   ('/users',         [App\Http\Controllers\Api\UserController::class, 'index']);
    Route::post  ('/users',         [App\Http\Controllers\Api\UserController::class, 'store']);
    Route::put   ('/users/{user}',  [App\Http\Controllers\Api\UserController::class, 'update']);
    Route::delete('/users/{user}',  [App\Http\Controllers\Api\UserController::class, 'destroy']);

    Route::apiResource('akses-moduls', AksesModulController::class);
});
