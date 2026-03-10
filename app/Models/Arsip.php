<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Arsip extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'nomor_berkas',
        'bulan',
        'tanggal',
        'kode_transaksi_id',
        'sumber_dana_id',
        'arsip_kegiatan_id',
        'akun_id',
        'metode_pengadaan_id',
        'penerima_dana',
        'uraian_kegiatan',
        'jumlah_bruto',
        'potongan',
        'ppk',
        'file_path',
        'file_name',
        'file_size',
        'file_mime',
        'status_verifikasi',
        'verified_by',
        'verified_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'tanggal'      => 'date',
        'jumlah_bruto' => 'float',
        'potongan'     => 'float',
        'bulan'        => 'integer',
        'verified_at'  => 'datetime',
    ];

    public function getJumlahNettoAttribute(): float
    {
        return $this->jumlah_bruto - $this->potongan;
    }

    public function kodeTransaksi(): BelongsTo
    {
        return $this->belongsTo(KodeTransaksi::class);
    }

    public function sumberDana(): BelongsTo
    {
        return $this->belongsTo(SumberDana::class);
    }

    public function arsipKegiatan(): BelongsTo
    {
        return $this->belongsTo(ArsipKegiatan::class);
    }

    public function akun(): BelongsTo
    {
        return $this->belongsTo(Akun::class);
    }

    public function metodePengadaan(): BelongsTo
    {
        return $this->belongsTo(MetodePengadaan::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
