<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AkunResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'       => $this->id,
            'kode'     => $this->kode,
            'nama'     => $this->nama,
            'isActive' => $this->is_active,
        ];
    }
}
