'use client';

import React from 'react';
import Image from 'next/image';
import { Search, Clock, Newspaper, Cpu } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  agents: { id: string; name: string; purpose: string }[];
  activeAgentId: string | null;
}

const NAV_ITEMS = [
  { key: 'analysis', label: 'Analysis', icon: Search },
  { key: 'trending', label: 'Trending News', icon: Newspaper },
  { key: 'history', label: 'History', icon: Clock },
];

export default function Sidebar({ activePage, onNavigate, agents, activeAgentId }: SidebarProps) {
  return (
    <div
      className="w-[260px] h-screen fixed left-0 top-0 flex flex-col z-40"
      style={{
        background: 'linear-gradient(180deg, rgba(13,13,15,0.98) 0%, rgba(5,5,5,0.99) 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Image src="https://asset.lyzr.app/7xg5Ay1Z" alt="VerifAI" width={36} height={36} className="object-contain" priority />
        <span className="text-xl font-bold tracking-tight text-white">VERIF<span style={{ color: '#FF2B2B' }}>AI</span></span>
      </div>

      {/* Navigation */}
      <nav className="px-3 pt-5 pb-2">
        <p className="px-3 mb-2 text-[10px] font-medium uppercase tracking-[0.15em] text-white/30">Navigation</p>
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.key;
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <button
                  onClick={() => onNavigate(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-300 ${isActive ? 'text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/[0.03]'}`}
                  style={isActive ? {
                    background: 'rgba(255, 43, 43, 0.1)',
                    border: '1px solid rgba(255, 43, 43, 0.2)',
                    boxShadow: '0 0 20px rgba(255, 43, 43, 0.1), inset 0 0 20px rgba(255, 43, 43, 0.05)',
                  } : {
                    border: '1px solid transparent',
                  }}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isActive ? 'bg-[#FF2B2B]/20' : 'bg-white/[0.04]'}`}>
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#FF2B2B]' : 'text-white/40'}`} />
                  </div>
                  <span className="font-sans">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF2B2B]" style={{ boxShadow: '0 0 8px rgba(255, 43, 43, 0.6)' }} />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Agents Section */}
      <div className="flex-1 min-h-0 px-3 pt-3 pb-4 flex flex-col" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '8px' }}>
        <div className="px-3 mb-3 flex items-center gap-2">
          <Cpu className="w-3 h-3 text-[#FF2B2B]/60" />
          <span className="text-[10px] font-medium font-sans text-white/30 uppercase tracking-[0.15em]">AI Agents</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-2 px-1">
            {(Array.isArray(agents) ? agents : []).map((agent) => {
              const isRunning = activeAgentId === agent.id;
              return (
                <div
                  key={agent.id}
                  className="px-3 py-2.5 rounded-xl transition-all duration-300"
                  style={{
                    background: isRunning ? 'rgba(255, 43, 43, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                    border: isRunning ? '1px solid rgba(255, 43, 43, 0.15)' : '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: isRunning ? '0 0 15px rgba(255, 43, 43, 0.08)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-[#FF2B2B]' : 'bg-white/20'}`} style={isRunning ? { boxShadow: '0 0 8px rgba(255, 43, 43, 0.5)' } : {}} />
                      {isRunning && (
                        <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#FF2B2B]/40 animate-ping" />
                      )}
                    </div>
                    <span className={`text-xs font-medium font-sans truncate ${isRunning ? 'text-white/95' : 'text-white/60'}`}>{agent.name}</span>
                  </div>
                  <p className="text-[11px] text-white/30 mt-1.5 leading-relaxed font-sans pl-[18px]">{agent.purpose}</p>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Bottom accent line */}
      <div className="h-[2px] mx-6 mb-4 rounded-full" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255, 43, 43, 0.3) 50%, transparent 100%)' }} />
    </div>
  );
}
