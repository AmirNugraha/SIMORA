<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KegiatanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'kategori'     => $this->kategori,
            'kode'         => $this->kode,
            'kegiatan'     => $this->kegiatan,
            'pagu'         => (float) $this->pagu,
            'blokir'       => (float) $this->blokir,
            'progresFisik' => $this->progres_fisik,
            'ket'          => $this->ket,
            'belanja'      => $this->belanja,
            'akun'         => $this->akun,
            'updated'      => $this->updated_at?->format('Y-m-d H:i'),
            'komponen'     => KomponentResource::collection($this->whenLoaded('komponens')),
        ];
    }
}
