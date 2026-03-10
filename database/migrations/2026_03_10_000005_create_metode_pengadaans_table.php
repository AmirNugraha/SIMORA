<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('metode_pengadaans', function (Blueprint $table) {
            $table->id();
            $table->enum('kategori', ['Penyedia', 'Swakelola']);
            $table->string('nama');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['kategori', 'nama']);
            $table->index('kategori');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metode_pengadaans');
    }
};
