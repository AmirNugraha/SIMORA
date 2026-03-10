<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('arsips', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_berkas', 100);
            $table->unsignedTinyInteger('bulan');
            $table->date('tanggal');
            $table->foreignId('kode_transaksi_id')->nullable()->constrained('kode_transaksis')->nullOnDelete();
            $table->foreignId('sumber_dana_id')->nullable()->constrained('sumber_danas')->nullOnDelete();
            $table->foreignId('arsip_kegiatan_id')->nullable()->constrained('arsip_kegiatans')->nullOnDelete();
            $table->foreignId('akun_id')->nullable()->constrained('akuns')->nullOnDelete();
            $table->foreignId('metode_pengadaan_id')->nullable()->constrained('metode_pengadaans')->nullOnDelete();
            $table->string('penerima_dana');
            $table->text('uraian_kegiatan');
            $table->decimal('jumlah_bruto', 15, 2)->default(0);
            $table->decimal('potongan', 15, 2)->default(0);
            $table->string('ppk')->nullable();
            $table->string('file_path', 500)->nullable();
            $table->string('file_name')->nullable();
            $table->unsignedInteger('file_size')->nullable();
            $table->string('file_mime', 100)->nullable();
            $table->enum('status_verifikasi', ['draft', 'verified', 'rejected'])->default('draft');
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('nomor_berkas');
            $table->index('bulan');
            $table->index('tanggal');
            $table->index('status_verifikasi');
            $table->index('kode_transaksi_id');
            $table->index('sumber_dana_id');
            $table->index('created_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('arsips');
    }
};
