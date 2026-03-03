<?php

use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\KegiatanController;
use App\Http\Controllers\Api\PerformanceController;
use App\Http\Controllers\Api\RealisasiLogController;
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
});
