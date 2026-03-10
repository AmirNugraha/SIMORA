<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MetodePengadaan extends Model
{
    protected $fillable = [
        'kategori',
        'nama',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function arsips(): HasMany
    {
        return $this->hasMany(Arsip::class);
    }
}
