<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('simulation_settings', function (Blueprint $table) {
            $table->id();
            $table->integer('update_interval_minutes')->default(5);
            $table->integer('baseline_aqi')->default(50);
            $table->integer('fluctuation_range')->default(20);
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('simulation_settings');
    }
};
