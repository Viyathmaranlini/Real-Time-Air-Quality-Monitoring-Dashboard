<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Alert extends Model
{
    public $timestamps = false;

    protected $fillable = ['sensor_id', 'aqi_value', 'alert_level', 'triggered_at'];

    public function sensor()
    {
        return $this->belongsTo(Sensor::class);
    }
}