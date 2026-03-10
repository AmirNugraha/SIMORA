<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AksesModulResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'       => $this->id,
            'userId'   => $this->user_id,
            'modulId'  => $this->modul_id,
            'canRead'  => $this->can_read,
            'canWrite' => $this->can_write,
            'user'     => $this->whenLoaded('user', fn () => [
                'id'   => $this->user->id,
                'name' => $this->user->name,
            ]),
            'modul'    => $this->whenLoaded('modul', fn () => [
                'id'   => $this->modul->id,
                'nama' => $this->modul->nama,
            ]),
        ];
    }
}
