<?php

namespace Database\Seeders;

use App\Models\SumberDana;
use Illuminate\Database\Seeder;

class SumberDanaSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            ['kode' => 'RM',  'nama' => 'Rupiah Murni'],
            ['kode' => 'PNP', 'nama' => 'Penerimaan Negara Bukan Pajak'],
        ];

        foreach ($data as $item) {
            SumberDana::firstOrCreate(
                ['kode' => $item['kode']],
                ['nama' => $item['nama'], 'is_active' => true]
            );
        }
    }
}
