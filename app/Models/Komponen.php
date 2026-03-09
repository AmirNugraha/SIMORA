<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Komponen extends Model
{
    protected $fillable = [
        'kegiatan_id',
        'kode_akun',
        'nama',
        'pagu',
        'sumber_dana',
    ];

    protected $casts = [];

    public function kegiatan(): BelongsTo
    {
        return $this->belongsTo(Kegiatan::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(RealisasiLog::class);
    }
}
