<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kegiatan;
use App\Models\PerformanceData;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class BackupController extends Controller
{
    /**
     * Export seluruh database sebagai JSON.
     */
    public function export(): JsonResponse
    {
        $data = [
            'meta' => [
                'app'        => 'SIMORA',
                'version'    => '1.0',
                'exported_at' => now()->toIso8601String(),
                'exported_by' => auth()->user()?->email ?? 'system',
            ],
            'users' => User::all()->map(fn ($u) => [
                'name'  => $u->name,
                'email' => $u->email,
                'role'  => $u->role,
            ]),
            'kegiatans' => Kegiatan::with(['komponens.logs'])->get()->map(fn ($k) => [
                'kategori'      => $k->kategori,
                'kode'          => $k->kode,
                'kegiatan'      => $k->kegiatan,
                'pagu'          => $k->pagu,
                'blokir'        => $k->blokir,
                'progres_fisik' => $k->progres_fisik,
                'ket'           => $k->ket,
                'belanja'       => $k->belanja,
                'akun'          => $k->akun,
                'komponens'     => $k->komponens->map(fn ($c) => [
                    'kode_akun'   => $c->kode_akun,
                    'nama'        => $c->nama,
                    'pagu'        => $c->pagu,
                    'sumber_dana' => $c->sumber_dana,
                    'logs'      => $c->logs->map(fn ($l) => [
                        'tanggal'   => $l->tanggal->format('Y-m-d'),
                        'deskripsi' => $l->deskripsi,
                        'nominal'   => $l->nominal,
                        'tipe'      => $l->tipe,
                    ]),
                ]),
            ]),
            'performance_data' => PerformanceData::all()->map(fn ($p) => [
                'kategori'        => $p->kategori,
                'tahun'           => $p->tahun,
                'monthly_targets' => $p->monthly_targets,
                'status'          => $p->status,
                'kendala'         => $p->kendala,
                'rekomendasi'     => $p->rekomendasi,
            ]),
        ];

        return response()->json($data);
    }

    /**
     * Import backup JSON ke database (replace all).
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'meta'                          => 'required|array',
            'meta.app'                      => 'required|string|in:SIMORA',
            'users'                         => 'present|array',
            'kegiatans'                     => 'present|array',
            'kegiatans.*.kategori'          => 'required|string',
            'kegiatans.*.kode'              => 'required|string',
            'kegiatans.*.kegiatan'          => 'required|string',
            'performance_data'              => 'present|array',
        ]);

        DB::transaction(function () use ($request) {
            $data = $request->all();

            // 1. Restore users (update existing by email, create new ones)
            foreach ($data['users'] ?? [] as $userData) {
                User::updateOrCreate(
                    ['email' => $userData['email']],
                    [
                        'name'     => $userData['name'],
                        'role'     => $userData['role'] ?? 'viewer',
                        'password' => Hash::make('password'), // default password for new users
                    ]
                );
            }

            // 2. Clear existing kegiatan data (cascade deletes komponens + logs)
            Kegiatan::query()->delete();

            // 3. Restore kegiatans with nested komponens & logs
            foreach ($data['kegiatans'] ?? [] as $kData) {
                $kegiatan = Kegiatan::create([
                    'kategori'      => $kData['kategori'],
                    'kode'          => $kData['kode'],
                    'kegiatan'      => $kData['kegiatan'],
                    'pagu'          => $kData['pagu'] ?? 0,
                    'blokir'        => $kData['blokir'] ?? 0,
                    'progres_fisik' => $kData['progres_fisik'] ?? 0,
                    'ket'           => $kData['ket'] ?? '',
                    'belanja'       => $kData['belanja'] ?? '52',
                    'akun'          => $kData['akun'] ?? '',
                ]);

                // Fallback: jika backup lama punya sumber_dana di level kegiatan
                $fallbackSumberDana = $kData['sumber_dana'] ?? 'RM';

                foreach ($kData['komponens'] ?? [] as $cData) {
                    $komponen = $kegiatan->komponens()->create([
                        'kode_akun'   => $cData['kode_akun'],
                        'nama'        => $cData['nama'],
                        'pagu'        => $cData['pagu'] ?? 0,
                        'sumber_dana' => $cData['sumber_dana'] ?? $fallbackSumberDana,
                    ]);

                    foreach ($cData['logs'] ?? [] as $lData) {
                        $komponen->logs()->create([
                            'tanggal'   => $lData['tanggal'],
                            'deskripsi' => $lData['deskripsi'],
                            'nominal'   => $lData['nominal'] ?? 0,
                            'tipe'      => $lData['tipe'] ?? 'Realisasi',
                        ]);
                    }
                }
            }

            // 4. Restore performance data
            PerformanceData::query()->delete();
            foreach ($data['performance_data'] ?? [] as $pData) {
                PerformanceData::create([
                    'kategori'        => $pData['kategori'],
                    'tahun'           => $pData['tahun'],
                    'monthly_targets' => $pData['monthly_targets'] ?? array_fill(0, 12, 0),
                    'status'          => $pData['status'] ?? 'On Progress',
                    'kendala'         => $pData['kendala'] ?? '',
                    'rekomendasi'     => $pData['rekomendasi'] ?? '',
                ]);
            }
        });

        return response()->json(['message' => 'Database berhasil direstore dari backup.']);
    }
}
