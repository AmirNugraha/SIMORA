<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('moduls', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 50)->unique();
            $table->string('nama');
            $table->text('deskripsi')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('akses_moduls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('modul_id')->constrained('moduls')->cascadeOnDelete();
            $table->boolean('can_read')->default(true);
            $table->boolean('can_write')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'modul_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('akses_moduls');
        Schema::dropIfExists('moduls');
    }
};
