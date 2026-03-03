<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Kegiatans — tambah index pada kolom yang sering di-filter/sort
        Schema::table('kegiatans', function (Blueprint $table) {
            $table->index('kategori');
            $table->index('sumber_dana');
            $table->index('belanja');
            $table->unsignedTinyInteger('progres_fisik')->default(0)->change();
        });

        // 2. Komponens — tambah explicit index pada FK (penting untuk semua DB engine)
        Schema::table('komponens', function (Blueprint $table) {
            $table->index('kegiatan_id');
        });

        // 3. Realisasi Logs — index pada FK, tanggal, dan tipe
        Schema::table('realisasi_logs', function (Blueprint $table) {
            $table->index('komponen_id');
            $table->index('tanggal');
            $table->index('tipe');
            $table->index('created_by');
        });

        // 4. Performance Data — index pada tahun, perbaiki tipe kolom
        Schema::table('performance_data', function (Blueprint $table) {
            $table->index('tahun');
            $table->unsignedSmallInteger('tahun')->change();
        });
    }

    public function down(): void
    {
        Schema::table('kegiatans', function (Blueprint $table) {
            $table->dropIndex(['kategori']);
            $table->dropIndex(['sumber_dana']);
            $table->dropIndex(['belanja']);
            $table->tinyInteger('progres_fisik')->default(0)->change();
        });

        Schema::table('komponens', function (Blueprint $table) {
            $table->dropIndex(['kegiatan_id']);
        });

        Schema::table('realisasi_logs', function (Blueprint $table) {
            $table->dropIndex(['komponen_id']);
            $table->dropIndex(['tanggal']);
            $table->dropIndex(['tipe']);
            $table->dropIndex(['created_by']);
        });

        Schema::table('performance_data', function (Blueprint $table) {
            $table->dropIndex(['tahun']);
            $table->smallInteger('tahun')->change();
        });
    }
};
