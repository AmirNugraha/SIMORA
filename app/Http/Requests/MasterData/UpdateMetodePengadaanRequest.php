<?php

namespace App\Http\Requests\MasterData;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMetodePengadaanRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'kategori'  => 'required|in:Penyedia,Swakelola',
            'nama'      => 'required|string|max:255',
            'is_active' => 'boolean',
        ];
    }
}
