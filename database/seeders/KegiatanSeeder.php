<?php

namespace Database\Seeders;

use App\Models\Kegiatan;
use Illuminate\Database\Seeder;

class KegiatanSeeder extends Seeder
{
    public function run(): void
    {
        if (Kegiatan::count() > 0) {
            return;
        }

        $data = [
            [
                'kategori'      => 'Tata Usaha',
                'kode'          => '001',
                'kegiatan'      => 'Gaji dan Tunjangan',
                'pagu'          => 7376566000,
                'blokir'        => 0,
                'progres_fisik' => 100,
                'ket'           => 'Rutin Bulanan',
                'belanja'       => '51',
                'akun'          => '511111',
                'sumber_dana'   => 'RM',
                'komponen'      => [
                    [
                        'kode_akun' => '511111',
                        'nama'      => 'Gaji Pokok PNS',
                        'pagu'      => 4500000000,
                        'logs'      => [
                            ['tanggal' => '2026-01-05', 'deskripsi' => 'Pembayaran Gaji Induk Januari 2026', 'nominal' => 450000000, 'tipe' => 'Realisasi'],
                            ['tanggal' => '2026-02-01', 'deskripsi' => 'Pembayaran Gaji Induk Februari 2026', 'nominal' => 450000000, 'tipe' => 'Realisasi'],
                        ],
                    ],
                    [
                        'kode_akun' => '512211',
                        'nama'      => 'Tunjangan Kinerja',
                        'pagu'      => 2000000000,
                        'logs'      => [
                            ['tanggal' => '2026-01-15', 'deskripsi' => 'Tukin Januari 2026', 'nominal' => 200000000, 'tipe' => 'Realisasi'],
                        ],
                    ],
                    [
                        'kode_akun' => '511129',
                        'nama'      => 'Tunjangan Makan',
                        'pagu'      => 876566000,
                        'logs'      => [],
                    ],
                ],
            ],
            [
                'kategori'      => 'Tata Usaha',
                'kode'          => '002.A',
                'kegiatan'      => 'Operasional Kantor',
                'pagu'          => 15000000,
                'blokir'        => 0,
                'progres_fisik' => 15,
                'ket'           => 'Kebutuhan Dasar',
                'belanja'       => '52',
                'akun'          => '521111',
                'sumber_dana'   => 'RM',
                'komponen'      => [
                    [
                        'kode_akun' => '521111',
                        'nama'      => 'Keperluan Sehari-hari Perkantoran',
                        'pagu'      => 10000000,
                        'logs'      => [
                            ['tanggal' => '2026-01-10', 'deskripsi' => 'Pembelian ATK dan Kertas HVS', 'nominal' => 2500000, 'tipe' => 'Realisasi'],
                            ['tanggal' => '2026-01-25', 'deskripsi' => 'Konsumsi Rapat Bulanan', 'nominal' => 750000, 'tipe' => 'Realisasi'],
                        ],
                    ],
                    [
                        'kode_akun' => '521111',
                        'nama'      => 'Langganan Surat Kabar',
                        'pagu'      => 5000000,
                        'logs'      => [],
                    ],
                ],
            ],
            [
                'kategori'      => 'PEV',
                'kode'          => '7275',
                'kegiatan'      => 'Rancangan Bangunan KTA Rehab Vegetatif',
                'pagu'          => 57500000,
                'blokir'        => 0,
                'progres_fisik' => 15,
                'ket'           => '55 Unit',
                'belanja'       => '52',
                'akun'          => '524111',
                'sumber_dana'   => 'RM',
                'komponen'      => [
                    [
                        'kode_akun' => '524111',
                        'nama'      => 'Survey dan Identifikasi Lokasi',
                        'pagu'      => 25000000,
                        'logs'      => [
                            ['tanggal' => '2026-01-15', 'deskripsi' => 'Survei lapangan awal lokasi KTA', 'nominal' => 0, 'tipe' => 'Catatan'],
                            ['tanggal' => '2026-01-18', 'deskripsi' => 'Perjalanan dinas tim teknis ke Hulu Sungai', 'nominal' => 4500000, 'tipe' => 'Realisasi'],
                        ],
                    ],
                    [
                        'kode_akun' => '522141',
                        'nama'      => 'Penyusunan Laporan Rancangan',
                        'pagu'      => 32500000,
                        'logs'      => [],
                    ],
                ],
            ],
            [
                'kategori'      => 'RHL',
                'kode'          => 'KTA',
                'kegiatan'      => 'Pembuatan Bangunan KTA',
                'pagu'          => 881820000,
                'blokir'        => 881820000,
                'progres_fisik' => 5,
                'ket'           => 'Fisik Sipil',
                'belanja'       => '53',
                'akun'          => '532111',
                'sumber_dana'   => 'RM',
                'komponen'      => [
                    [
                        'kode_akun' => '532111',
                        'nama'      => 'Pengadaan Bahan (Batu, Semen, Kawat)',
                        'pagu'      => 600000000,
                        'logs'      => [
                            ['tanggal' => '2026-02-01', 'deskripsi' => 'Pembelian Material Batu dan Semen (Termin 1)', 'nominal' => 45000000, 'tipe' => 'Realisasi'],
                        ],
                    ],
                    [
                        'kode_akun' => '521213',
                        'nama'      => 'Upah Tenaga Kerja (HOK)',
                        'pagu'      => 281820000,
                        'logs'      => [
                            ['tanggal' => '2026-02-05', 'deskripsi' => 'Upah HOK Tukang (Minggu 1)', 'nominal' => 12000000, 'tipe' => 'Realisasi'],
                        ],
                    ],
                ],
            ],
            [
                'kategori'      => 'PKDAS',
                'kode'          => 'BIB',
                'kegiatan'      => 'Produksi Bibit Berkualitas',
                'pagu'          => 1176800000,
                'blokir'        => 0,
                'progres_fisik' => 65,
                'ket'           => '600rb Btg',
                'belanja'       => '52',
                'akun'          => '521211',
                'sumber_dana'   => 'RM',
                'komponen'      => [
                    [
                        'kode_akun' => '521811',
                        'nama'      => 'Pengadaan Media Tanam',
                        'pagu'      => 400000000,
                        'logs'      => [
                            ['tanggal' => '2026-01-08', 'deskripsi' => 'Pembelian media tanam (top soil)', 'nominal' => 75000000, 'tipe' => 'Realisasi'],
                            ['tanggal' => '2026-01-28', 'deskripsi' => 'Pembelian Polybag ukuran 10x15', 'nominal' => 18000000, 'tipe' => 'Realisasi'],
                        ],
                    ],
                    [
                        'kode_akun' => '521811',
                        'nama'      => 'Pengadaan Benih/Biji',
                        'pagu'      => 200000000,
                        'logs'      => [],
                    ],
                ],
            ],
        ];

        foreach ($data as $item) {
            $komponen = $item['komponen'];
            unset($item['komponen']);

            $kegiatan = Kegiatan::create($item);

            foreach ($komponen as $k) {
                $logs = $k['logs'];
                unset($k['logs']);

                $comp = $kegiatan->komponens()->create($k);

                foreach ($logs as $log) {
                    $comp->logs()->create($log);
                }
            }
        }
    }
}
