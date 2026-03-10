<?php

namespace App\Imports;

use App\Models\MetodePengadaan;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

class MetodePengadaanImport implements ToModel, WithHeadingRow, WithValidation, SkipsEmptyRows
{
    public int $imported = 0;

    public function model(array $row): ?MetodePengadaan
    {
        $kategori = trim($row['kategori'] ?? '');
        $nama     = trim($row['nama'] ?? '');

        if ($kategori === '' || $nama === '') {
            return null;
        }

        MetodePengadaan::updateOrCreate(
            ['kategori' => $kategori, 'nama' => $nama],
            ['is_active' => true]
        );

        $this->imported++;

        return null;
    }

    public function rules(): array
    {
        return [
            'kategori' => 'required|string|in:Penyedia,Swakelola',
            'nama'     => 'required|string|max:255',
        ];
    }
}
