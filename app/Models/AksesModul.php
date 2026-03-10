<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AksesModul extends Model
{
    protected $fillable = [
        'user_id',
        'modul_id',
        'can_read',
        'can_write',
    ];

    protected $casts = [
        'can_read'  => 'boolean',
        'can_write' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function modul(): BelongsTo
    {
        return $this->belongsTo(Modul::class);
    }
}
