<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kegiatans', function (Blueprint $table) {
            $table->id();
            $table->enum('kategori', ['Tata Usaha', 'PEV', 'RHL', 'PKDAS']);
            $table->string('kode', 50);
            $table->string('kegiatan');
            $table->unsignedBigInteger('pagu')->default(0);
            $table->unsignedBigInteger('blokir')->default(0);
            $table->tinyInteger('progres_fisik')->default(0);
            $table->string('ket')->nullable();
            $table->enum('belanja', ['51', '52', '53']);
            $table->string('akun', 20)->nullable();
            $table->enum('sumber_dana', ['RM', 'PNP'])->default('RM');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kegiatans');
    }
};
