<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="{{ ($appearance ?? 'system') === 'dark' ? 'dark' : '' }}" data-theme="{{ \App\Models\SystemSetting::get('general.color_theme', null, 'ea') }}">
    <head>
        <meta charset="utf-8">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'FND') }}</title>

        @php
            $appIconBranchId = auth()->user()?->branch_id;
            $branchAppIcon = $appIconBranchId
                ? \App\Models\SystemSetting::where('branch_id', $appIconBranchId)
                    ->where('key', 'general.app_icon')
                    ->first(['value', 'updated_at'])
                : null;
            $globalAppIcon = \App\Models\SystemSetting::whereNull('branch_id')
                ->where('key', 'general.app_icon')
                ->first(['value', 'updated_at']);
            $appIcon = $branchAppIcon && (string) ($branchAppIcon->value ?? '') !== ''
                ? $branchAppIcon
                : $globalAppIcon;
            $appIconRouteBranchId = $appIcon === $branchAppIcon ? $appIconBranchId : null;
            $appIconPath = ltrim(str_replace('\\', '/', (string) ($appIcon?->value ?? '')), '/');
            $appIconVersion = null;
            if ($appIconPath !== '' && \Illuminate\Support\Facades\Storage::disk('public')->exists($appIconPath)) {
                $appIconVersion = implode('-', array_filter([
                    $appIcon?->updated_at?->timestamp,
                    \Illuminate\Support\Facades\Storage::disk('public')->lastModified($appIconPath),
                    sprintf('%u', crc32($appIconPath)),
                ]));
            }
            $appIconRouteParams = array_filter([
                'branchId' => $appIconRouteBranchId,
                'v' => $appIconVersion,
            ], fn ($value) => $value !== null && $value !== '');
            $appIconUrl = (string) ($appIcon?->value ?? '') !== ''
                ? route('brand.icon', $appIconRouteParams)
                : asset('img/logo/eajicon.png');
        @endphp

        <!-- Icons -->
        <link rel="icon" href="{{ $appIconUrl }}" sizes="any">
        <link rel="apple-touch-icon" href="{{ $appIconUrl }}">

        <!-- Preconnect to Bunny Fonts (faster loading) -->
        <link rel="preconnect" href="https://fonts.bunny.net" crossorigin>
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet">

        <!-- Ziggy routes (important for route() in JS) -->
        @routes

        <!-- Vite + React Refresh + entry points -->
        @viteReactRefresh
        @vite([
            'resources/css/app.css',
            'resources/js/app.tsx',
        ])

        <!-- Inertia head (title, meta, links, scripts) -->
        @inertiaHead
    </head>

    <body class="font-sans antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
        @inertia
    </body>
</html>
