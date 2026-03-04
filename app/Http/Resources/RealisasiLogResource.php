<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RealisasiLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'        => $this->id,
            'tanggal'   => $this->tanggal->format('Y-m-d'),
            'deskripsi' => $this->deskripsi,
            'nominal'   => (float) $this->nominal,
            'tipe'      => $this->tipe,
        ];
    }
}
