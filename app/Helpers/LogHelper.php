// app/Helpers/LogHelper.php

namespace App\Helpers;

use App\Models\Log;

class LogHelper
{
    public static function write($type, $description)
    {
        Log::create([
            'type' => $type,
            'description' => $description
        ]);
    }
}