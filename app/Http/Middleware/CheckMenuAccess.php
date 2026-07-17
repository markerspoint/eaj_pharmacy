<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckMenuAccess
{
    public function handle(Request $request, Closure $next, string $menuId): Response
    {
        $user = Auth::user();

        if (!$user) {
            // Not logged in → redirect to login
            return redirect()->route('login');
        }

        if (!$user->hasAccess($menuId)) {
            if ($user->hasAccess(2)) {
                return redirect()->route('pos.index')->with('error', 'You do not have access to that page.');
            }
            abort(403, 'You do not have access to this page.');
        }

        return $next($request);
    }
}