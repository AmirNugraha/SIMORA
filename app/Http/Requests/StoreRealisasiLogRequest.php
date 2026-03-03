<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRealisasiLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by RequireOperator middleware
    }

    public function rules(): array
    {
        return [
            'tanggal'   => 'required|date_format:Y-m-d',
            'deskripsi' => 'required|string|max:500',
            'nominal'   => 'required|numeric|min:0',
            'tipe'      => 'required|in:Realisasi,Catatan',
        ];
    }

    public function messages(): array
    {
        return [
            'tanggal.required'   => 'Tanggal realisasi wajib diisi.',
            'tanggal.date_format' => 'Format tanggal tidak valid.',
            'deskripsi.required' => 'Deskripsi realisasi wajib diisi.',
            'nominal.required'   => 'Nominal realisasi wajib diisi.',
            'nominal.min'        => 'Nominal tidak boleh negatif.',
            'tipe.required'      => 'Tipe realisasi wajib dipilih.',
            'tipe.in'            => 'Tipe harus berupa Realisasi atau Catatan.',
        ];
    }
}
