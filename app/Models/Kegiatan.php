<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kegiatan extends Model
{
    protected $fillable = [
        'kategori',
        'kode',
        'kegiatan',
        'pagu',
        'blokir',
        'progres_fisik',
        'ket',
        'belanja',
        'akun',
        'sumber_dana',
    ];

    protected $casts = [
        'progres_fisik' => 'integer',
    ];

    public function komponens(): HasMany
    {
        return $this->hasMany(Komponen::class);
    }
}
