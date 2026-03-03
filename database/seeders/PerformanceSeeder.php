<?php

namespace Database\Seeders;

use App\Models\PerformanceData;
use Illuminate\Database\Seeder;

class PerformanceSeeder extends Seeder
{
    private const CATEGORIES = ['Tata Usaha', 'PEV', 'RHL', 'PKDAS'];

    public function run(): void
    {
        foreach (self::CATEGORIES as $kategori) {
            PerformanceData::firstOrCreate(
                ['kategori' => $kategori, 'tahun' => 2026],
                [
                    'monthly_targets' => array_fill(0, 12, 0),
                    'status'          => 'On Progress',
                    'kendala'         => null,
                    'rekomendasi'     => null,
                ]
            );
        }
    }
}
