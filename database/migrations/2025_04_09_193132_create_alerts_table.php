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
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sensor_id')->constrained('sensors')->onDelete('cascade');
            $table->integer('aqi_value');
            $table->enum('alert_level', ['Good', 'Moderate', 'Unhealthy']);
            $table->timestamp('triggered_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};
