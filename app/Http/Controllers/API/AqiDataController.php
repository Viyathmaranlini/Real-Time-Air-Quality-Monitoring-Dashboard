<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AqiData;
use Illuminate\Support\Carbon;

class AqiDataController extends Controller
{
    // GET /api/aqi-data?sensor_id=1&from=2025-04-01&to=2025-04-10
    public function filter(Request $request)
    {
        $request->validate([
            'sensor_id' => 'required|exists:sensors,id',
            'from' => 'required|date',
            'to' => 'required|date|after_or_equal:from',
        ]);

        $data = AqiData::where('sensor_id', $request->sensor_id)
            ->whereBetween('recorded_at', [Carbon::parse($request->from), Carbon::parse($request->to)])
            ->orderBy('recorded_at', 'asc')
            ->get();

        return response()->json($data);
    }

    public function history($id)
    {
        $data = AqiData::where('sensor_id', $id)
            ->orderBy('recorded_at', 'asc')
            ->get(['aqi_value', 'recorded_at as timestamp']);

        return response()->json($data);
    }
}