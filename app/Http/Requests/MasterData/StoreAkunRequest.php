<?php

namespace App\Http\Requests\MasterData;

use Illuminate\Foundation\Http\FormRequest;

class StoreAkunRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'kode'      => 'required|string|max:30|unique:akuns,kode',
            'nama'      => 'required|string|max:255',
            'is_active' => 'boolean',
        ];
    }
}
