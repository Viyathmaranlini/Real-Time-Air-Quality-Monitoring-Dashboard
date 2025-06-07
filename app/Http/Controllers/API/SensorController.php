<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Sensor;
use App\Models\AqiData;

class SensorController extends Controller
{
    // GET /api/sensors - List all sensors with latest AQI
    public function index()
    {
        return Sensor::with(['latestAqi'])->get();
    }

    // GET /api/sensors/{id}/history - Return historical AQI for a sensor
    public function history($id)
    {
        $sensor = Sensor::findOrFail($id);
        return $sensor->aqiData()->orderBy('recorded_at', 'desc')->take(100)->get();
    }

    // POST /api/admin/sensors - Create sensor
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'latitude' => 'required',
            'longitude' => 'required',
        ]);
        return Sensor::create($request->all());
    }

    // PUT /api/admin/sensors/{id} - Update sensor
    public function update(Request $request, $id)
    {
        $sensor = Sensor::findOrFail($id);
        $sensor->update($request->all());
        return $sensor;
    }

    // DELETE /api/admin/sensors/{id} - Delete sensor
    public function destroy($id)
    {
        return Sensor::destroy($id);
    }
}