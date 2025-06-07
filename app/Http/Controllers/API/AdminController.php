<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Sensor;
use App\Models\Alert;
use App\Models\AqiData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Log;

class AdminController extends Controller
{
    // ===========================
    // USER MANAGEMENT
    // ===========================

    // GET /api/admin/users
    public function users()
    {
        return response()->json(User::all());
    }

    // POST /api/admin/users
    public function storeUser(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'role' => 'required|in:user,admin'
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role
        ]);

        return response()->json(['message' => 'User created']);
    }

    // PUT /api/admin/users/{id}
    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email,' . $id,
            'role' => 'required|in:user,admin'
        ]);

        $user->name = $request->name;
        $user->email = $request->email;
        if ($request->password) {
            $user->password = Hash::make($request->password);
        }
        $user->role = $request->role;
        $user->save();

        return response()->json(['message' => 'User updated']);
    }

    // DELETE /api/admin/users/{id}
    public function deleteUser($id)
    {
        User::findOrFail($id)->delete();
        return response()->json(['message' => 'User deleted']);
    }

    // GET /api/admin/users/count
    public function userCount()
    {
        return response()->json(['total' => User::count()]);
    }

    // ===========================
    // SENSOR MANAGEMENT
    // ===========================

    // GET /api/admin/sensors
    public function allSensors()
    {
        $sensors = Sensor::all()->map(function ($sensor) {
            // Get latest AQI value (optional)
            $latestAqi = \App\Models\AqiData::where('sensor_id', $sensor->id)
                ->orderByDesc('recorded_at')
                ->value('aqi_value');

            return [
                'id' => $sensor->id,
                'name' => $sensor->name,
                'location_description' => $sensor->location_description,
                'latitude' => $sensor->latitude,
                'longitude' => $sensor->longitude,
                'status' => $sensor->status, // e.g., 'active' or 'inactive'
                'latest_aqi' => $latestAqi,
            ];
        });

        return response()->json($sensors);
    }

    // GET /api/admin/sensors/{id}
    public function showSensor($id)
    {
        $sensor = Sensor::findOrFail($id);
        return response()->json($sensor);
    }

    // POST /api/admin/sensors
    public function storeSensor(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location_description' => 'nullable|string|max:255',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'status' => 'nullable|in:active,inactive' // Add this
        ]);

        // Default to 'inactive' if not provided
        $validated['status'] = $validated['status'] ?? 'inactive';

        $sensor = Sensor::create($validated);
        return response()->json($sensor);
    }

    // PUT /api/admin/sensors/{id}
    public function updateSensor(Request $request, $id)
    {
        $sensor = Sensor::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location_description' => 'nullable|string|max:255',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'status' => 'nullable|in:active,inactive' // Add this
        ]);

        $validated['status'] = $validated['status'] ?? 'inactive';

        $sensor->update($validated);
        return response()->json($sensor);
    }

    // DELETE /api/admin/sensors/{id}
    public function deleteSensor($id)
    {
        Sensor::destroy($id);
        return response()->json(['message' => 'Sensor deleted']);
    }

    // GET /api/admin/sensors/count
    public function sensorCount()
    {
        return response()->json(['total' => Sensor::count()]);
    }

    // ===========================
    // AQI & ALERT STATS
    // ===========================

    // GET /api/admin/alerts/count
    public function alertCount()
    {
        return response()->json(['total' => Alert::count()]);
    }

    // GET /api/admin/aqi/high-events
    public function highAqiCount()
    {
        return response()->json(['total' => AqiData::where('aqi_value', '>', 100)->count()]);
    }

    // GET /api/admin/aqi/trends
    public function aqiTrends()
    {
        $trends = AqiData::selectRaw('DATE(recorded_at) as date, ROUND(AVG(aqi_value)) as avg_aqi')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json($trends);
    }

    public function logs()
    {
        return response()->json(Log::orderByDesc('created_at')->take(100)->get());
    }

    public function getLogs(Request $request)
    {
        $query = Log::query();

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('date')) {
            $query->whereDate('created_at', $request->date);
        }

        return response()->json($query->orderByDesc('id')->limit(100)->get());
    }
}