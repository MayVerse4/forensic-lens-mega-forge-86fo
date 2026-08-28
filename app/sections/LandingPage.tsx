'use client'

import React, { useState, useEffect, useRef } from 'react'
import NextImage from 'next/image'
import { ArrowRight, Play, Shield, Image, Zap, Cpu, ChevronDown, UploadCloud, Search, CheckCircle, Fingerprint, ScanLine } from 'lucide-react'

interface LandingPageProps {
  onNavigateToAuth: (mode: 'login' | 'register') => void
}

const STATS = [
  { icon: Shield, value: '99.7%', label: 'Detection Accuracy' },
  { icon: Image, value: '3K+', label: 'Media Analyzed' },
  { icon: Zap, value: '<1 min', label: 'Avg Analysis Speed' },
  { icon: Cpu, value: '10+', label: 'AI Models Used' },
]

function Navbar({ onNavigateToAuth }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${scrolled ? 'backdrop-blur-2xl' : 'bg-transparent'}`} style={scrolled ? { backgroundColor: 'rgba(5,5,5,0.75)', borderBottom: '1px solid rgba(255,255,255,0.06)' } : {}}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <NextImage src="https://asset.lyzr.app/7xg5Ay1Z" alt="VerifAI" width={32} height={32} className="object-contain" />
          <span className="text-xl font-bold tracking-tight text-white">VERIF<span style={{ color: '#FF2B2B' }}>AI</span></span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigateToAuth('login')} className="text-[#9A9AA0] hover:text-[#F5F5F5] text-sm font-medium px-5 py-2.5 transition-all duration-300 rounded-xl hover:bg-white/[0.04]">
            Login
          </button>
          <button onClick={() => onNavigateToAuth('register')} className="text-[#F5F5F5] text-sm font-semibold px-6 py-2.5 rounded-xl transition-all duration-500" style={{ background: 'linear-gradient(135deg, #FF2B2B, #B11226)', boxShadow: '0 0 20px rgba(255,43,43,0.25), 0 4px 12px rgba(0,0,0,0.4)', border: '1px solid rgba(255,43,43,0.3)' }}>
            Get Started
          </button>
        </div>
      </div>
    </nav>
  )
}

function ScanVisualization() {
  const [scanY, setScanY] = useState(0)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    let frame: number
    let start: number | null = null
    const duration = 3000

    const animate = (timestamp: number) => {
      if (!start) start = timestamp
      const elapsed = timestamp - start
      const progress = (elapsed % duration) / duration
      setScanY(progress * 100)

      if (elapsed > 1800 && !showResults) {
        setShowResults(true)
      }

      frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [showResults])

  return (
    <div className="relative w-full max-w-md mx-auto lg:mx-0">
      <div className="absolute -inset-8 rounded-[40px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(255,43,43,0.12), transparent 70%)' }} />
      <div className="relative overflow-hidden" style={{ borderRadius: '22px', boxShadow: '0 0 80px rgba(255,43,43,0.15), 0 0 160px rgba(177,18,38,0.08), 0 25px 60px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="relative aspect-[3/4]" style={{ backgroundColor: '#0D0D0F' }}>
          <img src="https://asset.lyzr.app/Jup3RCJG" alt="Face scan analysis" className="w-full h-full object-cover" style={{ filter: 'brightness(0.85) contrast(1.15) saturate(1.1)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,5,5,0.15) 0%, transparent 30%, transparent 70%, rgba(5,5,5,0.25) 100%)' }} />
          <div className="absolute inset-0 z-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,43,43,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,43,43,0.04) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="absolute left-0 right-0 h-[2px] z-20 pointer-events-none" style={{ top: `${scanY}%`, background: 'linear-gradient(90deg, transparent 5%, rgba(255,43,43,0.6), #FF2B2B, rgba(255,43,43,0.6), transparent 95%)', boxShadow: '0 0 30px rgba(255,43,43,0.5), 0 0 80px rgba(255,43,43,0.2)' }} />
          <div className="absolute left-0 right-0 h-20 z-10 pointer-events-none transition-opacity duration-300" style={{ top: `${Math.max(0, scanY - 5)}%`, background: 'linear-gradient(180deg, transparent, rgba(255,43,43,0.04), transparent)' }} />
          <div className="absolute top-5 left-5 w-9 h-9 z-20" style={{ borderTop: '2px solid rgba(255,43,43,0.4)', borderLeft: '2px solid rgba(255,43,43,0.4)', borderRadius: '4px 0 0 0' }} />
          <div className="absolute top-5 right-5 w-9 h-9 z-20" style={{ borderTop: '2px solid rgba(255,43,43,0.4)', borderRight: '2px solid rgba(255,43,43,0.4)', borderRadius: '0 4px 0 0' }} />
          <div className="absolute bottom-5 left-5 w-9 h-9 z-20" style={{ borderBottom: '2px solid rgba(255,43,43,0.4)', borderLeft: '2px solid rgba(255,43,43,0.4)', borderRadius: '0 0 0 4px' }} />
          <div className="absolute bottom-5 right-5 w-9 h-9 z-20" style={{ borderBottom: '2px solid rgba(255,43,43,0.4)', borderRight: '2px solid rgba(255,43,43,0.4)', borderRadius: '0 0 4px 0' }} />
          <div className={`absolute top-7 right-7 z-30 transition-all duration-700 ${showResults ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <div className="backdrop-blur-xl px-5 py-3.5 text-center" style={{ backgroundColor: 'rgba(5,5,5,0.8)', border: '1px solid rgba(255,43,43,0.25)', borderRadius: '16px', boxShadow: '0 0 30px rgba(255,43,43,0.15), 0 8px 24px rgba(0,0,0,0.4)' }}>
              <div className="text-[9px] uppercase tracking-[0.2em] mb-1.5" style={{ color: 'rgba(255,43,43,0.7)' }}>Confidence</div>
              <div className="text-2xl font-bold text-[#F5F5F5] tabular-nums">97.4%</div>
            </div>
          </div>
          <div className={`absolute bottom-7 left-7 z-30 transition-all duration-700 delay-200 ${showResults ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="backdrop-blur-xl flex items-center gap-2.5 px-5 py-3" style={{ backgroundColor: 'rgba(5,5,5,0.8)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '14px', boxShadow: '0 0 25px rgba(16,185,129,0.1), 0 8px 20px rgba(0,0,0,0.3)' }}>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-[0.15em]">Likely Real</span>
            </div>
          </div>
          <div className={`absolute bottom-7 right-7 z-30 transition-all duration-700 delay-300 ${showResults ? 'opacity-100' : 'opacity-0'}`}>
            <div className="backdrop-blur-xl flex items-center gap-2 px-3.5 py-2.5" style={{ backgroundColor: 'rgba(5,5,5,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#FF2B2B' }} />
              <span className="text-[10px] uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.4)' }}>Scanning</span>
            </div>
          </div>
          <div className="absolute left-0 right-0 top-[30%] h-px z-10" style={{ backgroundColor: 'rgba(255,43,43,0.06)' }} />
          <div className="absolute left-0 right-0 top-[50%] h-px z-10" style={{ backgroundColor: 'rgba(255,43,43,0.06)' }} />
          <div className="absolute left-0 right-0 top-[70%] h-px z-10" style={{ backgroundColor: 'rgba(255,43,43,0.06)' }} />
        </div>
      </div>
    </div>
  )
}

function HeroSection({ onNavigateToAuth }: LandingPageProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const timer = setTimeout(() => setMounted(true), 100); return () => clearTimeout(timer) }, [])

  return (
    <section className="relative min-h-screen flex items-center px-6 lg:px-8 pt-16 overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 20% 30%, rgba(255,43,43,0.07), transparent), radial-gradient(ellipse 60% 50% at 80% 70%, rgba(177,18,38,0.05), transparent)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, transparent 60%, rgba(5,5,5,0.8) 100%)' }} />
      <div className="absolute top-[20%] left-[10%] w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,43,43,0.04), transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-[15%] right-[5%] w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(177,18,38,0.03), transparent 70%)', filter: 'blur(60px)' }} />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center relative z-10">
        <div className={`lg:col-span-3 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2.5 backdrop-blur-xl px-5 py-2 mb-10" style={{ backgroundColor: 'rgba(255,43,43,0.08)', border: '1px solid rgba(255,43,43,0.15)', borderRadius: '20px' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#FF2B2B', boxShadow: '0 0 8px rgba(255,43,43,0.6)' }} />
            <span className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: '#FF2B2B' }}>AI-Powered Detection</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.08] mb-7 tracking-tight" style={{ color: '#F5F5F5' }}>
            Detect Deepfakes{' '}<br className="hidden sm:block" />with{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #FF2B2B, #FF6B6B, #B11226)' }}>Confidence</span>
          </h1>
          <p className="text-base sm:text-lg max-w-xl mb-12 leading-relaxed" style={{ color: '#9A9AA0' }}>
            Advanced AI forensic analysis that detects manipulated media in milliseconds. Protect yourself from deepfakes with military-grade detection technology.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <button onClick={() => onNavigateToAuth('register')} className="group flex items-center gap-2.5 text-white font-semibold px-8 py-4 transition-all duration-500" style={{ background: 'linear-gradient(135deg, #FF2B2B, #B11226)', borderRadius: '16px', boxShadow: '0 0 40px rgba(255,43,43,0.3), 0 4px 16px rgba(0,0,0,0.4)', border: '1px solid rgba(255,43,43,0.3)' }}>
              Get Started
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="group flex items-center gap-3 font-medium px-6 py-4 transition-all duration-300" style={{ color: '#9A9AA0' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300" style={{ border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <Play className="w-3.5 h-3.5 ml-0.5 text-[#F5F5F5]" />
              </div>
              <span className="group-hover:text-[#F5F5F5] transition-colors duration-300">See How It Works</span>
            </button>
          </div>
        </div>
        <div className={`lg:col-span-2 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <ScanVisualization />
        </div>
      </div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.15)' }} />
      </div>
    </section>
  )
}

function StatsBar() {
  const [visible, setVisible] = useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true) }, { threshold: 0.2 })
    obs.observe(el); return () => obs.disconnect()
  }, [])

  return (
    <section ref={ref} className="relative py-24 px-6 lg:px-8">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,43,43,0.2), transparent)' }} />
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5">
        {STATS.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className={`relative text-center p-7 backdrop-blur-xl transition-all duration-700 group cursor-default ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${i * 120}ms`, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ borderRadius: '20px', background: 'radial-gradient(ellipse at center, rgba(255,43,43,0.05), transparent 70%)' }} />
              <div className="relative w-12 h-12 mx-auto mb-5 flex items-center justify-center" style={{ backgroundColor: 'rgba(255,43,43,0.08)', borderRadius: '14px', border: '1px solid rgba(255,43,43,0.12)' }}>
                <Icon className="w-5 h-5" style={{ color: '#FF2B2B' }} />
              </div>
              <div className="text-2xl sm:text-3xl font-bold mb-1.5" style={{ color: '#F5F5F5' }}>{stat.value}</div>
              <div className="text-sm" style={{ color: '#9A9AA0' }}>{stat.label}</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

const STEPS = [
  { icon: UploadCloud, number: '01', title: 'Upload Your Media', description: 'Drag and drop any image or video file into VerifAI. We support all common formats including JPEG, PNG, MP4, and WebM.' },
  { icon: Search, number: '02', title: 'AI Forensic Analysis', description: 'Our ensemble of 10+ AI models scans your media for manipulation signatures, pixel-level inconsistencies, and generative artifacts in under a minute.' },
  { icon: Cpu, number: '03', title: 'Deep Pattern Detection', description: 'Advanced neural networks cross-reference facial geometry, lighting patterns, compression artifacts, and metadata to build a comprehensive authenticity profile.' },
  { icon: CheckCircle, number: '04', title: 'Get Your Verdict', description: 'Receive a detailed report with a confidence score, highlighted regions of concern, and a clear verdict on whether your media is authentic or manipulated.' },
]

function HowItWorks() {
  const [visible, setVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sectionRef.current; if (!el) return
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true) }, { threshold: 0.15 })
    obs.observe(el); return () => obs.disconnect()
  }, [])

  return (
    <section id="how-it-works" ref={sectionRef} className="relative py-28 px-6 lg:px-8">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,43,43,0.2), transparent)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(255,43,43,0.03), transparent)' }} />

      <div className={`max-w-3xl mx-auto text-center mb-20 transition-all duration-700 relative z-10 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="inline-flex items-center gap-2.5 backdrop-blur-xl px-5 py-2 mb-8" style={{ backgroundColor: 'rgba(255,43,43,0.08)', border: '1px solid rgba(255,43,43,0.15)', borderRadius: '20px' }}>
          <Fingerprint className="w-3.5 h-3.5" style={{ color: '#FF2B2B' }} />
          <span className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: '#FF2B2B' }}>How It Works</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 tracking-tight" style={{ color: '#F5F5F5' }}>
          Four Steps to{' '}
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #FF2B2B, #FF6B6B, #B11226)' }}>Authenticity</span>
        </h2>
        <p className="text-base sm:text-lg max-w-xl mx-auto leading-relaxed" style={{ color: '#9A9AA0' }}>
          From upload to verdict, our system analyzes your media with military-grade precision.
        </p>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="hidden md:block absolute top-[52px] left-[calc(12.5%+28px)] right-[calc(12.5%+28px)] h-px" style={{ background: 'linear-gradient(90deg, rgba(255,43,43,0.15), rgba(255,43,43,0.08), rgba(255,43,43,0.15))' }} />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-5">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={i} className={`relative text-center group transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${i * 150 + 200}ms` }}>
                <div className="relative mx-auto w-[68px] h-[68px] mb-7">
                  <div className="absolute inset-0 transition-all duration-500 rotate-45" style={{ borderRadius: '18px', backgroundColor: 'rgba(255,43,43,0.06)', border: '1px solid rgba(255,43,43,0.12)' }} />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 rotate-45" style={{ borderRadius: '18px', backgroundColor: 'rgba(255,43,43,0.1)', border: '1px solid rgba(255,43,43,0.25)', boxShadow: '0 0 30px rgba(255,43,43,0.1)' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="w-6 h-6 transition-colors duration-300" style={{ color: '#FF2B2B' }} />
                  </div>
                  <div className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: '#050505', border: '1px solid rgba(255,43,43,0.25)', boxShadow: '0 0 12px rgba(255,43,43,0.1)' }}>
                    <span className="text-[10px] font-bold" style={{ color: '#FF2B2B' }}>{step.number}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-base mb-2.5" style={{ color: '#F5F5F5' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>{step.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="relative py-10 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,43,43,0.02), transparent 60%)' }} />
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-2 opacity-30">
          <NextImage src="https://asset.lyzr.app/7xg5Ay1Z" alt="VerifAI" width={22} height={22} className="object-contain" />
          <span className="text-sm font-bold tracking-tight text-white">VERIF<span style={{ color: '#FF2B2B' }}>AI</span></span>
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>2024 Verif<span style={{ color: 'rgba(255,43,43,0.3)' }}>AI</span>. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default function LandingPage({ onNavigateToAuth }: LandingPageProps) {
  return (
    <div className="text-white font-sans min-h-screen scroll-smooth relative" style={{ backgroundColor: '#050505' }}>
      <div className="fixed inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 0%, rgba(13,13,15,1), rgba(5,5,5,1))' }} />
      <div className="fixed inset-0 pointer-events-none z-0" style={{ boxShadow: 'inset 0 0 200px 60px rgba(0,0,0,0.5)' }} />
      <div className="relative z-10">
        <Navbar onNavigateToAuth={onNavigateToAuth} />
        <HeroSection onNavigateToAuth={onNavigateToAuth} />
        <StatsBar />
        <HowItWorks />
        <Footer />
      </div>
    </div>
  )
}
