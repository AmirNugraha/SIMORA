<?php

namespace App\Imports;

use App\Models\KodeTransaksi;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

class KodeTransaksiImport implements ToModel, WithHeadingRow, WithValidation, SkipsEmptyRows
{
    public int $imported = 0;

    public function model(array $row): ?KodeTransaksi
    {
        $kode = trim($row['kode'] ?? '');
        $nama = trim($row['nama'] ?? '');

        if ($kode === '' || $nama === '') {
            return null;
        }

        $item = KodeTransaksi::updateOrCreate(
            ['kode' => $kode],
            [
                'nama'      => $nama,
                'deskripsi' => trim($row['deskripsi'] ?? '') ?: null,
                'is_active' => true,
            ]
        );

        $this->imported++;

        return null; // already saved via updateOrCreate
    }

    public function rules(): array
    {
        return [
            'kode' => 'required|string|max:50',
            'nama' => 'required|string|max:255',
        ];
    }
}
