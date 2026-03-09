<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tambah kolom sumber_dana ke komponens
        Schema::table('komponens', function (Blueprint $table) {
            $table->enum('sumber_dana', ['RM', 'PNP'])->default('RM')->after('pagu');
            $table->index('sumber_dana');
        });

        // 2. Copy nilai dari parent kegiatan ke semua komponennya
        DB::statement('UPDATE komponens k JOIN kegiatans g ON k.kegiatan_id = g.id SET k.sumber_dana = g.sumber_dana');

        // 3. Hapus kolom sumber_dana dari kegiatans
        Schema::table('kegiatans', function (Blueprint $table) {
            $table->dropIndex(['sumber_dana']);
            $table->dropColumn('sumber_dana');
        });
    }

    public function down(): void
    {
        // 1. Tambah kembali kolom ke kegiatans
        Schema::table('kegiatans', function (Blueprint $table) {
            $table->enum('sumber_dana', ['RM', 'PNP'])->default('RM')->after('akun');
            $table->index('sumber_dana');
        });

        // 2. Copy balik dari komponen pertama ke parent kegiatan
        DB::statement('
            UPDATE kegiatans g
            JOIN (SELECT kegiatan_id, sumber_dana FROM komponens GROUP BY kegiatan_id, sumber_dana) k
            ON g.id = k.kegiatan_id
            SET g.sumber_dana = k.sumber_dana
        ');

        // 3. Hapus kolom dari komponens
        Schema::table('komponens', function (Blueprint $table) {
            $table->dropIndex(['sumber_dana']);
            $table->dropColumn('sumber_dana');
        });
    }
};
