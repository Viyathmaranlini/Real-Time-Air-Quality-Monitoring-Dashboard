<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sensor extends Model
{
    protected $fillable = ['name', 'location_description', 'latitude', 'longitude', 'status'];

    public function aqiData()
    {
        return $this->hasMany(AqiData::class);
    }

    public function latestAqi()
    {
        return $this->hasOne(AqiData::class)->latestOfMany('recorded_at');
    }
}