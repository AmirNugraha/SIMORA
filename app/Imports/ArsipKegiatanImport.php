<?php

namespace App\Imports;

use App\Models\ArsipKegiatan;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

class ArsipKegiatanImport implements ToModel, WithHeadingRow, WithValidation, SkipsEmptyRows
{
    public int $imported = 0;

    public function model(array $row): ?ArsipKegiatan
    {
        $nama = trim($row['nama'] ?? '');

        if ($nama === '') {
            return null;
        }

        ArsipKegiatan::firstOrCreate(
            ['nama' => $nama],
            ['is_active' => true]
        );

        $this->imported++;

        return null;
    }

    public function rules(): array
    {
        return [
            'nama' => 'required|string|max:255',
        ];
    }
}
