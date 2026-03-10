<?php

namespace App\Http\Requests\MasterData;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAkunRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'kode'      => 'required|string|max:30|unique:akuns,kode,' . $this->route('akun'),
            'nama'      => 'required|string|max:255',
            'is_active' => 'boolean',
        ];
    }
}
