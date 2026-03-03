<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performance_data', function (Blueprint $table) {
            $table->id();
            $table->enum('kategori', ['Tata Usaha', 'PEV', 'RHL', 'PKDAS']);
            $table->smallInteger('tahun');
            $table->json('monthly_targets');
            $table->enum('status', ['On Progress', 'Tercapai', 'Tidak Tercapai'])
                ->default('On Progress');
            $table->text('kendala')->nullable();
            $table->text('rekomendasi')->nullable();
            $table->timestamps();

            $table->unique(['kategori', 'tahun']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_data');
    }
};
