<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PerformanceData extends Model
{
    protected $table = 'performance_data';

    protected $fillable = [
        'kategori',
        'tahun',
        'monthly_targets',
        'status',
        'kendala',
        'rekomendasi',
    ];

    protected $casts = [
        'monthly_targets' => 'array',
        'tahun'           => 'integer',
    ];
}
