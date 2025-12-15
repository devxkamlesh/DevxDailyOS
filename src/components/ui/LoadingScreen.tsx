'use client'

import { useEffect, useState } from 'react'

const MINIMUM_DISPLAY_TIME = 1800

const slokas = [
  { sanskrit: '॥ योगः कर्मसु कौशलम् ॥', meaning: 'Excellence in action is Yoga' },
  { sanskrit: '॥ कर्मण्येवाधिकारस्ते ॥', meaning: 'You have the right to action alone' },
  { sanskrit: '॥ अभ्यासेन तु कौन्तेय ॥', meaning: 'Through practice, O Arjuna' },
  { sanskrit: '॥ सत्यं शिवं सुन्दरम् ॥', meaning: 'Truth, Auspiciousness, Beauty' },
  { sanskrit: '॥ तमसो मा ज्योतिर्गमय ॥', meaning: 'Lead me from darkness to light' },
  { sanskrit: '॥ ॐ शान्तिः शान्तिः शान्तिः ॥', meaning: 'Om Peace Peace Peace' },
  { sanskrit: '॥ वसुधैव कुटुम्बकम् ॥', meaning: 'The world is one family' },
  { sanskrit: '॥ धर्मो रक्षति रक्षितः ॥', meaning: 'Dharma protects those who protect it' },
  { sanskrit: '॥ विद्या ददाति विनयम् ॥', meaning: 'Knowledge gives humility' },
]

export default function LoadingScreen() {
  const [mounted, setMounted] = useState(false)
  const [sloka, setSloka] = useState({ sanskrit: '', meaning: '' })
  const [isVisible, setIsVisible] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const randomSloka = slokas[Math.floor(Math.random() * slokas.length)]
    setSloka(randomSloka)
    setMounted(true)

    const timer = setTimeout(() => {
      setFadeOut(true)
      setTimeout(() => setIsVisible(false), 400)
    }, MINIMUM_DISPLAY_TIME)

    return () => clearTimeout(timer)
  }, [])

  if (!mounted || !isVisible) return null

  return (
    <div className={`fixed inset-0 z-[100] bg-[#0a0a0b] flex items-center justify-center transition-all duration-400 ${fadeOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-[var(--accent-primary)]/8 via-transparent to-transparent rounded-full blur-3xl" />
      
      <div className="relative flex flex-col items-center">
        {/* Logo Mark */}
        <div className="relative mb-10">
          {/* Outer rotating ring */}
          <svg className="w-24 h-24 animate-spin-slow" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="1"
              strokeDasharray="8 12"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#a855f7" stopOpacity="0.5" />
                <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-3xl font-bold text-[var(--accent-primary)]">स</div>
          </div>
        </div>

        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light tracking-[0.2em] text-white/90">
            SADHANA
          </h1>
          <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent mx-auto mt-3" />
        </div>

        {/* Sanskrit Sloka */}
        <div className="text-center max-w-md px-6">
          <p className="text-orange-400/90 text-xl font-medium tracking-wide">
            {sloka.sanskrit}
          </p>
          <p className="text-white/40 text-sm mt-3 font-light">
            {sloka.meaning}
          </p>
        </div>

        {/* Minimal loading bar */}
        <div className="mt-12 w-32 h-[2px] bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-purple-500 rounded-full animate-loading-bar" />
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        @keyframes loading-bar {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
