<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Sensor;
use App\Models\AqiData;
use App\Models\Alert;
use App\Models\SimulationSetting;
use Carbon\Carbon;

class SimulationController extends Controller
{
    // POST /api/simulate
    public function simulate()
    {
        $sensors = Sensor::where('status', 'active')->get();
        $settings = SimulationSetting::latest()->first();

        foreach ($sensors as $sensor) {
            // Generate simulated AQI value
            $baseline = $settings->baseline_aqi ?? 50;
            $fluctuation = $settings->fluctuation_range ?? 20;
            $aqi = $baseline + rand(-$fluctuation, $fluctuation);

            // Save AQI reading
            AqiData::create([
                'sensor_id' => $sensor->id,
                'aqi_value' => $aqi,
                'recorded_at' => Carbon::now()
            ]);

            // Trigger alert if needed
            if ($aqi > 100) {
                $alert_level = $aqi > 150 ? 'Unhealthy' : 'Moderate';
                Alert::create([
                    'sensor_id' => $sensor->id,
                    'aqi_value' => $aqi,
                    'alert_level' => $alert_level,
                    'triggered_at' => Carbon::now()
                ]);
            }
        }

        return response()->json([
            'message' => 'Simulation complete for ' . $sensors->count() . ' sensors.'
        ]);
    }
}