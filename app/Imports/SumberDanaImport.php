<?php

namespace App\Imports;

use App\Models\SumberDana;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

class SumberDanaImport implements ToModel, WithHeadingRow, WithValidation, SkipsEmptyRows
{
    public int $imported = 0;

    public function model(array $row): ?SumberDana
    {
        $kode = trim($row['kode'] ?? '');
        $nama = trim($row['nama'] ?? '');

        if ($kode === '' || $nama === '') {
            return null;
        }

        SumberDana::updateOrCreate(
            ['kode' => $kode],
            ['nama' => $nama, 'is_active' => true]
        );

        $this->imported++;

        return null;
    }

    public function rules(): array
    {
        return [
            'kode' => 'required|string|max:20',
            'nama' => 'required|string|max:255',
        ];
    }
}
