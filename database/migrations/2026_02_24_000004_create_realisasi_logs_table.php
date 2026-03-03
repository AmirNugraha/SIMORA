<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('realisasi_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('komponen_id')
                ->constrained('komponens')
                ->cascadeOnDelete();
            $table->date('tanggal');
            $table->text('deskripsi');
            $table->unsignedBigInteger('nominal')->default(0);
            $table->enum('tipe', ['Realisasi', 'Catatan'])->default('Realisasi');
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('realisasi_logs');
    }
};
