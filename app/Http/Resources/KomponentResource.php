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
            'pagu'       => (float) $this->pagu,
            'sumberDana' => $this->sumber_dana,
            'logs'       => RealisasiLogResource::collection($this->whenLoaded('logs')),
        ];
    }
}
