<?php

namespace App\Http\Requests\MasterData;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSumberDanaRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'kode'      => 'required|string|max:20|unique:sumber_danas,kode,' . $this->route('sumber_dana'),
            'nama'      => 'required|string|max:255',
            'is_active' => 'boolean',
        ];
    }
}
