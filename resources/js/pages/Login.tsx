"use client";

import { Head, useForm, usePage } from '@inertiajs/react';
import { User, Lock, Eye, EyeOff, LogIn, TrendingUp, AlertTriangle, Activity, FileText, CheckCircle2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { routes } from '@/routes';

interface LoginProps {
  errors?: Record<string, string>;
  logo_url?: string | null;
}

interface LoginFormData {
  username: string;
  password: string;
  remember: boolean;
}

export default function Login({ errors: serverErrors, logo_url: propLogoUrl }: LoginProps) {
  const { props } = usePage<{ app?: { name?: string; logo_url?: string | null } }>();
  const logo_url = propLogoUrl ?? props.app?.logo_url ?? null;
  const appName = props.app?.name ?? "EAJ Multi-POS";
  const [showPassword, setShowPassword] = useState(false);
  const { setTheme } = useTheme();

  const { data, setData, post, processing, reset } = useForm<LoginFormData>({
    username: '',
    password: '',
    remember: false,
  });

  useEffect(() => {
    setTheme('light');
    return () => reset('password');
  }, [setTheme, reset]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    post(routes.loginPost());
  };

  return (
    <>
      <Head title={`${appName} || Login`} />

      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background">
        
        {/* Left Column: Login Form */}
        <div className="col-span-1 lg:col-span-5 xl:col-span-4 flex flex-col justify-between p-8 sm:p-12 md:p-16 min-h-screen bg-card border-r border-border/40 relative z-20">
          
          {/* Decorative Background Elements on the Left */}
          {/* Dot Grid Pattern in Lower Left */}
          <div className="absolute bottom-12 left-12 opacity-25 select-none pointer-events-none z-0">
            <svg width="100" height="100" fill="none" viewBox="0 0 100 100" className="text-primary">
              <pattern id="leftDotGrid" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="currentColor" />
              </pattern>
              <rect width="100" height="100" fill="url(#leftDotGrid)" />
            </svg>
          </div>

          {/* Subtle Curved Lines on the Left */}
          <div className="absolute inset-0 pointer-events-none select-none z-0">
            <svg className="w-full h-full stroke-primary/10" fill="none" viewBox="0 0 400 800" preserveAspectRatio="none">
              <path
                d="M -100 200 Q 150 400 -100 600"
                strokeWidth="1"
              />
            </svg>
          </div>

          {/* Logo Header */}
          <div className="flex items-center gap-3 relative z-10">
            <img 
              src={logo_url ?? "/img/logo/eajicon.png"} 
              alt="Logo" 
              className="h-10 w-auto object-contain" 
            />
            <span className="text-xl font-bold tracking-tight text-foreground">EAJ Multi-POS</span>
          </div>

          {/* Login Form Card */}
          <div className="my-auto py-12 max-w-sm w-full mx-auto space-y-8 relative z-10">
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Sign In</h1>
              <p className="text-muted-foreground text-sm">
                Enter your credentials to access the POS management dashboard.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground font-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={data.username}
                    onChange={(e) => setData('username', e.target.value)}
                    className={cn(
                      'pl-10 h-12 rounded-xl focus-visible:ring-primary bg-background border-input',
                      serverErrors?.username && 'border-destructive focus-visible:ring-destructive'
                    )}
                    autoFocus
                    disabled={processing}
                  />
                </div>
                {serverErrors?.username && (
                  <p className="text-sm text-destructive">{serverErrors.username}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    className={cn(
                      'pl-10 pr-12 h-12 rounded-xl focus-visible:ring-primary bg-background border-input',
                      serverErrors?.password && 'border-destructive focus-visible:ring-destructive'
                    )}
                    disabled={processing}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-primary/10"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={processing}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-primary" />
                    ) : (
                      <Eye className="h-4 w-4 text-primary" />
                    )}
                  </Button>
                </div>
                {serverErrors?.password && (
                  <p className="text-sm text-destructive">{serverErrors.password}</p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  id="remember"
                  type="checkbox"
                  checked={data.remember}
                  onChange={(e) => setData('remember', e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary accent-primary cursor-pointer"
                  disabled={processing}
                />
                <Label htmlFor="remember" className="text-sm font-medium text-muted-foreground cursor-pointer select-none">
                  Remember me
                </Label>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                className="w-full h-12 font-semibold text-base shadow-none transition-all duration-200 rounded-xl flex items-center justify-center gap-2 mt-2"
                disabled={processing}
              >
                {processing ? (
                  'Signing in...'
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Footer Copyright */}
          <div className="text-muted-foreground text-xs mt-4 relative z-10">
            &copy; {new Date().getFullYear()} EAJ Multi-Store POS. All rights reserved.
          </div>
        </div>

        {/* Right Column: Visual Mockup */}
        <div className="col-span-1 lg:col-span-7 xl:col-span-8 relative hidden lg:flex flex-col items-center justify-center p-16 overflow-hidden bg-gradient-to-tr from-accent/40 via-primary/5 to-white z-10">
          
          {/* Blurred Background Accent Blobs */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse duration-[8000ms]" />
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-accent/30 rounded-full blur-3xl animate-pulse duration-[6000ms]" />
          
          {/* Decorative Background Elements */}
          {/* Dot Grid Pattern in Upper Right */}
          <div className="absolute top-12 right-12 opacity-35 select-none pointer-events-none">
            <svg width="120" height="120" fill="none" viewBox="0 0 120 120" className="text-primary">
              <pattern id="dotGrid" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="currentColor" />
              </pattern>
              <rect width="120" height="120" fill="url(#dotGrid)" />
            </svg>
          </div>

          {/* Minimalist Curved Lines on the Right */}
          <div className="absolute inset-0 pointer-events-none select-none">
            <svg className="w-full h-full stroke-primary/15" fill="none" viewBox="0 0 800 800" preserveAspectRatio="none">
              <path
                d="M 800 100 Q 550 400 800 700"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <path
                d="M 900 200 C 600 350, 600 550, 900 700"
                strokeWidth="1"
              />
            </svg>
          </div>
          
          {/* Marketing Content */}
          <div className="relative flex flex-col items-center max-w-2xl text-center space-y-12 z-10">
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                Securely manage and monitor your{' '}
                <span className="text-primary font-black relative inline-block">
                  Store Operations
                  <span className="absolute bottom-1 left-0 w-full h-1.5 bg-primary/20 rounded-full" />
                </span>{' '}
                in real time!
              </h2>
              <p className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed">
                Manage inventory, process sales, monitor stocks, track cash sessions, and view daily summaries — all in one centralized platform.
              </p>
            </div>

            {/* Dashboard Mockup Panel */}
            <div className="relative w-full max-w-xl aspect-[16/10] bg-white/70 backdrop-blur-md border border-white/40 shadow-2xl rounded-3xl p-6 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300">
              
              {/* Mockup Header */}
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-400/80" />
                  <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
                  <span className="w-3 h-3 rounded-full bg-green-400/80" />
                  <span className="text-xs text-muted-foreground ml-2 font-mono">/dashboard</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold tracking-wider uppercase">Live Preview</span>
              </div>

              {/* Mockup Grid */}
              <div className="grid grid-cols-12 gap-4 mt-4 flex-1">
                
                {/* Sales Chart Card */}
                <div className="col-span-8 bg-card border border-border/50 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <span className="text-xs text-muted-foreground font-medium">Weekly Sales Summary</span>
                      <h4 className="text-lg font-bold text-foreground mt-0.5">₱184,200.50</h4>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">
                      <TrendingUp className="h-3 w-3" /> +12.4%
                    </span>
                  </div>
                  
                  {/* SVG Wave Line Chart */}
                  <div className="h-24 w-full mt-4">
                    <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,25 C10,20 15,28 25,22 C35,16 40,10 50,15 C60,20 65,8 75,12 C85,16 90,5 100,8 L100,30 L0,30 Z"
                        fill="url(#chartGrad)"
                      />
                      <path
                        d="M0,25 C10,20 15,28 25,22 C35,16 40,10 50,15 C60,20 65,8 75,12 C85,16 90,5 100,8"
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <circle cx="50" cy="15" r="2" fill="var(--primary)" stroke="white" strokeWidth="0.5" className="animate-pulse" />
                      <circle cx="100" cy="8" r="2.5" fill="var(--primary)" stroke="white" strokeWidth="0.75" />
                    </svg>
                  </div>
                </div>

                {/* Quick Metrics */}
                <div className="col-span-4 flex flex-col gap-4">
                  {/* Cash Session Status */}
                  <div className="bg-card border border-border/50 rounded-2xl p-4 flex-1 flex flex-col justify-between text-left">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Cash Drawer</span>
                    <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-xl w-max mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" /> Active
                    </div>
                    <div className="mt-2">
                      <span className="text-[10px] text-muted-foreground block">Session Open</span>
                      <span className="text-sm font-bold text-foreground">₱15,000.00</span>
                    </div>
                  </div>

                  {/* Low Stock Alerts Count */}
                  <div className="bg-card border border-border/50 rounded-2xl p-4 flex-1 flex flex-col justify-between text-left">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Alerts</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-black text-foreground">4 Items</span>
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <span className="text-[10px] text-destructive bg-destructive/10 px-2 py-0.5 rounded-full font-medium w-max">
                      Low Stock
                    </span>
                  </div>
                </div>

                {/* Low Stock Item Alert card */}
                <div className="col-span-12 bg-card border border-border/50 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <h5 className="text-xs font-bold text-foreground">Organic Coffee Beans (1kg)</h5>
                      <span className="text-[10px] text-muted-foreground">Main Campus Cafe &bull; Category: Food & Beverage</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-foreground">12 left</span>
                    <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-semibold">Low Stock</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </>
  );
}
