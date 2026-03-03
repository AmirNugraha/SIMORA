<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KomponentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'       => $this->id,
            'kodeAkun' => $this->kode_akun,
            'nama'     => $this->nama,
            'pagu'     => $this->pagu,
            'logs'     => RealisasiLogResource::collection($this->whenLoaded('logs')),
        ];
    }
}
