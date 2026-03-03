<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RealisasiLog extends Model
{
    protected $fillable = [
        'komponen_id',
        'tanggal',
        'deskripsi',
        'nominal',
        'tipe',
        'created_by',
    ];

    protected $casts = [
        'tanggal' => 'date',
    ];

    public function komponen(): BelongsTo
    {
        return $this->belongsTo(Komponen::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
