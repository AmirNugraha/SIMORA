<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class MasterDataTemplateExport implements FromArray, WithHeadings, WithStyles, WithColumnWidths
{
    private string $type;

    private const TEMPLATES = [
        'kode-transaksis' => [
            'headings' => ['kode', 'nama', 'deskripsi'],
            'widths'   => ['A' => 15, 'B' => 35, 'C' => 45],
            'examples' => [
                ['KT-001', 'Pembayaran Langsung (LS)', 'Pembayaran langsung ke penerima'],
                ['KT-002', 'Uang Persediaan (UP)', 'Pengeluaran dari uang persediaan'],
                ['KT-003', 'Tambahan Uang Persediaan (TUP)', ''],
            ],
        ],
        'sumber-danas' => [
            'headings' => ['kode', 'nama'],
            'widths'   => ['A' => 15, 'B' => 40],
            'examples' => [
                ['RM', 'Rupiah Murni'],
                ['PNP', 'Penerimaan Negara Bukan Pajak'],
            ],
        ],
        'akuns' => [
            'headings' => ['kode', 'nama'],
            'widths'   => ['A' => 20, 'B' => 45],
            'examples' => [
                ['521111', 'Belanja Keperluan Perkantoran'],
                ['521211', 'Belanja Bahan'],
                ['522111', 'Belanja Langganan Listrik'],
                ['524111', 'Belanja Perjalanan Biasa'],
            ],
        ],
        'arsip-kegiatans' => [
            'headings' => ['nama'],
            'widths'   => ['A' => 55],
            'examples' => [
                ['Pengadaan Alat Tulis Kantor'],
                ['Pemeliharaan Gedung Kantor'],
                ['Perjalanan Dinas Dalam Kota'],
                ['Rehabilitasi Hutan dan Lahan'],
            ],
        ],
        'metode-pengadaans' => [
            'headings' => ['kategori', 'nama'],
            'widths'   => ['A' => 18, 'B' => 35],
            'examples' => [
                ['Penyedia', 'Pengadaan Langsung'],
                ['Penyedia', 'Penunjukan Langsung'],
                ['Penyedia', 'Tender'],
                ['Swakelola', 'Tipe 1'],
                ['Swakelola', 'Tipe 2'],
            ],
        ],
    ];

    public function __construct(string $type)
    {
        $this->type = $type;
    }

    public static function supports(string $type): bool
    {
        return isset(self::TEMPLATES[$type]);
    }

    public function headings(): array
    {
        return self::TEMPLATES[$this->type]['headings'];
    }

    public function array(): array
    {
        return self::TEMPLATES[$this->type]['examples'];
    }

    public function columnWidths(): array
    {
        return self::TEMPLATES[$this->type]['widths'];
    }

    public function styles(Worksheet $sheet): array
    {
        $colCount = count(self::TEMPLATES[$this->type]['headings']);
        $lastCol  = chr(64 + $colCount); // A=1, B=2, etc.
        $lastRow  = count(self::TEMPLATES[$this->type]['examples']) + 1;

        // Header style
        $headerRange = "A1:{$lastCol}1";
        $sheet->getStyle($headerRange)->applyFromArray([
            'font' => [
                'bold'  => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size'  => 11,
            ],
            'fill' => [
                'fillType'   => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '0E7490'], // cyan-700
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical'   => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '0891B2']],
            ],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(25);

        // Example data style (italic + light bg)
        if ($lastRow > 1) {
            $dataRange = "A2:{$lastCol}{$lastRow}";
            $sheet->getStyle($dataRange)->applyFromArray([
                'font' => [
                    'italic' => true,
                    'color'  => ['rgb' => '6B7280'],
                    'size'   => 10,
                ],
                'fill' => [
                    'fillType'   => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'FEF3C7'], // amber-100
                ],
                'borders' => [
                    'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E5E7EB']],
                ],
            ]);
        }

        // Add note
        $noteRow = $lastRow + 2;
        $sheet->setCellValue("A{$noteRow}", "Catatan: Baris contoh di atas (warna kuning) boleh dihapus/ditimpa. Pastikan baris pertama (header) tidak diubah.");
        $sheet->getStyle("A{$noteRow}")->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'DC2626'], 'size' => 9],
        ]);

        return [];
    }
}
