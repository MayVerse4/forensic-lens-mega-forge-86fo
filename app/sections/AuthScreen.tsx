'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Fingerprint,
  Eye,
  Lock,
  Globe,
  Search,
  Image,
  Film,
  Database,
  Cpu,
  QrCode,
  Satellite,
  FileText,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';

interface FloatingIcon {
  id: number;
  Icon: React.ElementType;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

const ICON_POOL = [
  Shield,
  Fingerprint,
  Eye,
  Lock,
  Globe,
  Search,
  Image,
  Film,
  Database,
  Cpu,
  QrCode,
  Satellite,
  FileText,
  AlertTriangle,
];

function generateIcons(): FloatingIcon[] {
  const icons: FloatingIcon[] = [];
  for (let i = 0; i < 18; i++) {
    icons.push({
      id: i,
      Icon: ICON_POOL[i % ICON_POOL.length],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 18 + Math.random() * 20,
      duration: 15 + Math.random() * 25,
      delay: Math.random() * -20,
      opacity: 0.03 + Math.random() * 0.04,
    });
  }
  return icons;
}

function FloatingBackground() {
  const [icons, setIcons] = useState<FloatingIcon[]>([]);

  useEffect(() => {
    setIcons(generateIcons());
  }, []);

  if (icons.length === 0) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Ambient red glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #FF2B2B 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, #B11226 0%, transparent 70%)' }} />

      {icons.map((icon) => {
        const { Icon } = icon;
        return (
          <div
            key={icon.id}
            className="absolute animate-float"
            style={{
              left: `${icon.x}%`,
              top: `${icon.y}%`,
              animationDuration: `${icon.duration}s`,
              animationDelay: `${icon.delay}s`,
            }}
          >
            <Icon
              size={icon.size}
              style={{ opacity: icon.opacity }}
              className="text-white/60"
            />
          </div>
        );
      })}
    </div>
  );
}

interface AuthScreenProps {
  initialMode?: 'login' | 'register';
  onBackToLanding?: () => void;
}

export default function AuthScreen({ initialMode = 'login', onBackToLanding }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body: Record<string, string> = { email, password };
      if (mode === 'register' && name) {
        body.name = name;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || data?.message || `${mode === 'login' ? 'Login' : 'Registration'} failed`);
        setLoading(false);
        return;
      }

      window.location.reload();
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ background: '#050505' }}>
      <FloatingBackground />

      {/* Card */}
      <div
        className="w-full max-w-[420px] p-8 relative z-10 rounded-3xl"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 0 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 43, 43, 0.05)',
        }}
      >
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-1.5 text-white/30 hover:text-white/70 text-xs font-sans uppercase tracking-widest mb-6 transition-all duration-300"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src="https://asset.lyzr.app/7xg5Ay1Z" alt="VerifAI" width={38} height={38} className="object-contain" />
            <h1 className="text-2xl font-bold font-sans text-white tracking-tight">VERIF<span style={{ color: '#FF2B2B' }}>AI</span></h1>
          </div>
          <p className="text-[11px] text-white/35 font-sans uppercase tracking-[0.2em]">
            Deepfake Detection Platform
          </p>
        </div>

        {/* Mode Toggle */}
        <div
          className="flex mb-7 rounded-2xl p-1"
          style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
        >
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2.5 text-xs font-sans font-medium uppercase tracking-widest rounded-xl transition-all duration-300 ${mode === 'login' ? 'text-white' : 'text-white/35 hover:text-white/60'}`}
            style={mode === 'login' ? {
              background: 'rgba(255, 43, 43, 0.15)',
              border: '1px solid rgba(255, 43, 43, 0.2)',
              boxShadow: '0 0 15px rgba(255, 43, 43, 0.1)',
            } : { border: '1px solid transparent' }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2.5 text-xs font-sans font-medium uppercase tracking-widest rounded-xl transition-all duration-300 ${mode === 'register' ? 'text-white' : 'text-white/35 hover:text-white/60'}`}
            style={mode === 'register' ? {
              background: 'rgba(255, 43, 43, 0.15)',
              border: '1px solid rgba(255, 43, 43, 0.2)',
              boxShadow: '0 0 15px rgba(255, 43, 43, 0.1)',
            } : { border: '1px solid transparent' }}
          >
            Sign Up
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-5 p-3.5 rounded-xl text-[#FF6B6B] text-xs font-sans"
            style={{
              background: 'rgba(255, 43, 43, 0.08)',
              border: '1px solid rgba(255, 43, 43, 0.15)',
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-[10px] text-white/35 font-sans uppercase tracking-widest mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-xl text-white text-sm font-sans placeholder:text-white/20 focus:outline-none transition-all duration-300"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 43, 43, 0.3)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 43, 43, 0.08)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] text-white/35 font-sans uppercase tracking-widest mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full px-4 py-3 rounded-xl text-white text-sm font-sans placeholder:text-white/20 focus:outline-none transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 43, 43, 0.3)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 43, 43, 0.08)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-[10px] text-white/35 font-sans uppercase tracking-widest mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full px-4 py-3 rounded-xl text-white text-sm font-sans placeholder:text-white/20 focus:outline-none transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 43, 43, 0.3)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 43, 43, 0.08)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 font-bold text-xs font-sans uppercase tracking-widest text-white rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #FF2B2B 0%, #B11226 100%)',
              boxShadow: '0 0 25px rgba(255, 43, 43, 0.2), 0 4px 15px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 43, 43, 0.3)',
            }}
          >
            {loading
              ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
              : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p className="mt-7 text-center text-[10px] text-white/20 font-sans">
          By continuing, you agree to VerifAI Terms of Service
        </p>

        {/* Bottom accent */}
        <div className="mt-6 h-[1px] mx-4 rounded-full" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255, 43, 43, 0.2) 50%, transparent 100%)' }} />
      </div>
    </div>
  );
}
