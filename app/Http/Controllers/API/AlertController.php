<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Alert;

class AlertController extends Controller
{
    // POST /api/admin/alerts
    public function store(Request $request)
    {
        $request->validate([
            'sensor_id' => 'required|exists:sensors,id',
            'aqi_value' => 'required|integer',
            'alert_level' => 'required|in:Good,Moderate,Unhealthy',
        ]);

        return Alert::create($request->all());
    }
}