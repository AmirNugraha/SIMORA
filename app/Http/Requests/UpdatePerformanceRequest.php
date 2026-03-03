<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePerformanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by RequireOperator middleware
    }

    public function rules(): array
    {
        return [
            'tahun'             => 'required|integer|min:2020|max:2099',
            'monthlyTargets'    => 'required|array|size:12',
            'monthlyTargets.*'  => 'integer|min:0',
            'status'            => 'required|in:On Progress,Tercapai,Tidak Tercapai',
            'kendala'           => 'nullable|string|max:2000',
            'rekomendasi'       => 'nullable|string|max:2000',
        ];
    }

    public function messages(): array
    {
        return [
            'tahun.required'          => 'Tahun wajib diisi.',
            'monthlyTargets.required' => 'Target bulanan wajib diisi.',
            'monthlyTargets.size'     => 'Target bulanan harus memiliki 12 elemen.',
            'status.required'         => 'Status capaian wajib dipilih.',
            'status.in'               => 'Status tidak valid.',
        ];
    }
}
