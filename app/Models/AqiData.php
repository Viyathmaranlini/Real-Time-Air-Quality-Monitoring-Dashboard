<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AqiData extends Model
{
    public $timestamps = false;

    protected $fillable = ['sensor_id', 'aqi_value', 'recorded_at'];

    public function sensor()
    {
        return $this->belongsTo(Sensor::class);
    }
}