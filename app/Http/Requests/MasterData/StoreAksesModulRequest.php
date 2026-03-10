<?php

namespace App\Http\Requests\MasterData;

use Illuminate\Foundation\Http\FormRequest;

class StoreAksesModulRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'user_id'   => 'required|exists:users,id',
            'modul_id'  => 'required|exists:moduls,id',
            'can_read'  => 'boolean',
            'can_write' => 'boolean',
        ];
    }
}
