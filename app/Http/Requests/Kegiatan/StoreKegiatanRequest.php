<?php

namespace App\Http\Requests\Kegiatan;

use Illuminate\Foundation\Http\FormRequest;

class StoreKegiatanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by RequireOperator middleware
    }

    public function rules(): array
    {
        return [
            'kategori'             => 'required|in:Tata Usaha,PEV,RHL,PKDAS',
            'kode'                 => 'required|string|max:50',
            'kegiatan'             => 'required|string|max:255',
            'pagu'                 => 'required|numeric|min:0',
            'blokir'               => 'numeric|min:0',
            'progres_fisik'        => 'integer|min:0|max:100',
            'ket'                  => 'nullable|string',
            'belanja'              => 'required|in:51,52,53',
            'akun'                 => 'nullable|string|max:20',
            'sumber_dana'          => 'required|in:RM,PNP',
            'komponen'             => 'array|max:50',
            'komponen.*.kode_akun' => 'required|string|max:20',
            'komponen.*.nama'      => 'required|string|max:255',
            'komponen.*.pagu'      => 'required|numeric|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'kategori.required'             => 'Kategori wajib dipilih.',
            'kode.required'                 => 'Kode kegiatan wajib diisi.',
            'kegiatan.required'             => 'Nama kegiatan wajib diisi.',
            'pagu.required'                 => 'Pagu anggaran wajib diisi.',
            'belanja.required'              => 'Kategori belanja wajib dipilih.',
            'sumber_dana.required'          => 'Sumber dana wajib dipilih.',
            'komponen.*.kode_akun.required' => 'Kode akun komponen wajib diisi.',
            'komponen.*.nama.required'      => 'Nama komponen wajib diisi.',
            'komponen.*.pagu.required'      => 'Pagu komponen wajib diisi.',
        ];
    }
}
