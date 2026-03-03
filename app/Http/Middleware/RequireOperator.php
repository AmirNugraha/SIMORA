<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireOperator
{
    /**
     * Ensure the authenticated user has operator or admin role.
     * Returns 403 if the user is not authenticated or lacks write access.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->canWrite()) {
            return response()->json(
                ['message' => 'Aksi ini memerlukan hak akses operator atau admin.'],
                403
            );
        }

        return $next($request);
    }
}
