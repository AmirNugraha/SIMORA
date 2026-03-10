<?php

namespace Database\Seeders;

use App\Models\MetodePengadaan;
use Illuminate\Database\Seeder;

class MetodePengadaanSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            ['kategori' => 'Penyedia', 'nama' => 'Pengadaan Langsung'],
            ['kategori' => 'Penyedia', 'nama' => 'Penunjukan Langsung'],
            ['kategori' => 'Penyedia', 'nama' => 'Tender'],
            ['kategori' => 'Penyedia', 'nama' => 'E-Purchasing'],
            ['kategori' => 'Penyedia', 'nama' => 'Sayembara'],
            ['kategori' => 'Swakelola', 'nama' => 'Tipe 1'],
            ['kategori' => 'Swakelola', 'nama' => 'Tipe 2'],
            ['kategori' => 'Swakelola', 'nama' => 'Tipe 3'],
            ['kategori' => 'Swakelola', 'nama' => 'Tipe 4'],
        ];

        foreach ($data as $item) {
            MetodePengadaan::firstOrCreate(
                ['kategori' => $item['kategori'], 'nama' => $item['nama']],
                ['is_active' => true]
            );
        }
    }
}
