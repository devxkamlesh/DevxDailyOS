'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

const MINIMUM_DISPLAY_TIME = 3000 // 1 second minimum display

const slokas = [
  { sanskrit: '॥ योगः कर्मसु कौशलम् ॥', meaning: 'Excellence in action is Yoga' },
  { sanskrit: '॥ कर्मण्येवाधिकारस्ते ॥', meaning: 'You have the right to action alone' },
  { sanskrit: '॥ अभ्यासेन तु कौन्तेय ॥', meaning: 'Through practice, O Arjuna' },
  { sanskrit: '॥ सत्यं शिवं सुन्दरम् ॥', meaning: 'Truth, Auspiciousness, Beauty' },
  { sanskrit: '॥ तमसो मा ज्योतिर्गमय ॥', meaning: 'Lead me from darkness to light' },
  { sanskrit: '॥ ॐ शान्तिः शान्तिः शान्तिः ॥', meaning: 'Om Peace Peace Peace' },
  { sanskrit: '॥ वसुधैव कुटुम्बकम् ॥', meaning: 'The world is one family' },
  { sanskrit: '॥ आत्मनो मोक्षार्थम् ॥', meaning: 'For the liberation of the self' },
  { sanskrit: '॥ धर्मो रक्षति रक्षितः ॥', meaning: 'Dharma protects those who protect it' },
  { sanskrit: '॥ विद्या ददाति विनयम् ॥', meaning: 'Knowledge gives humility' },
]

// Animation styles (excluding Ripple Effect)
const animationStyles = [
  'pulse',      // 1. Minimal Pulse
  'spinner',    // 2. Spinner Ring
  'dots',       // 3. Dots Loading
  'glow',       // 4. Gradient Glow
  'progress',   // 5. Progress Bar
  'float',      // 6. Floating Text (was 7)
  'breathe',    // 7. Breathing Circle (was 8)
  'zen',        // 8. Full Screen Zen (was 10)
]

export default function LoadingScreen() {
  const [style, setStyle] = useState<string>('pulse')
  const [sloka, setSloka] = useState(slokas[0])
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Random style and sloka on mount
    const randomStyle = animationStyles[Math.floor(Math.random() * animationStyles.length)]
    const randomSloka = slokas[Math.floor(Math.random() * slokas.length)]
    setStyle(randomStyle)
    setSloka(randomSloka)

    // Ensure minimum display time of 1 second
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, MINIMUM_DISPLAY_TIME)

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center">
      {/* Style 1: Minimal Pulse */}
      {style === 'pulse' && (
        <div className="flex flex-col items-center gap-8">
          <Image src="/Logo/logo.svg" alt="Sadhana" width={80} height={80} className="animate-pulse" />
          <div className="text-center">
            <p className="text-orange-400 text-xl">{sloka.sanskrit}</p>
            <p className="text-foreground-muted text-sm mt-2">{sloka.meaning}</p>
          </div>
        </div>
      )}

      {/* Style 2: Spinner Ring */}
      {style === 'spinner' && (
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <div className="absolute -inset-5 border-2 border-transparent border-t-orange-500 rounded-full animate-spin" />
            <Image src="/Logo/logo.svg" alt="Sadhana" width={80} height={80} />
          </div>
          <div className="text-center">
            <p className="text-orange-400 text-xl">{sloka.sanskrit}</p>
            <p className="text-foreground-muted text-sm mt-2">{sloka.meaning}</p>
          </div>
        </div>
      )}

      {/* Style 3: Dots Loading */}
      {style === 'dots' && (
        <div className="flex flex-col items-center gap-6">
          <Image src="/Logo/logo.svg" alt="Sadhana" width={80} height={80} />
          <div className="flex gap-2">
            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce [animation-delay:0ms]" />
            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce [animation-delay:150ms]" />
            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
          <div className="text-center">
            <p className="text-orange-400 text-xl">{sloka.sanskrit}</p>
            <p className="text-foreground-muted text-sm mt-2">{sloka.meaning}</p>
          </div>
        </div>
      )}

      {/* Style 4: Gradient Glow */}
      {style === 'glow' && (
        <div className="flex flex-col items-center gap-8 relative">
          <div className="absolute inset-0 -m-20 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="relative">
            <div className="absolute -inset-8 bg-orange-500/20 rounded-full blur-xl animate-pulse" />
            <Image src="/Logo/logo.svg" alt="Sadhana" width={80} height={80} className="relative z-10" />
          </div>
          <div className="text-center relative z-10">
            <p className="text-orange-400 text-xl">{sloka.sanskrit}</p>
            <p className="text-foreground-muted text-sm mt-2">{sloka.meaning}</p>
          </div>
        </div>
      )}

      {/* Style 5: Progress Bar */}
      {style === 'progress' && (
        <div className="flex flex-col items-center gap-6">
          <Image src="/Logo/logo.svg" alt="Sadhana" width={80} height={80} />
          <div className="w-56 h-1.5 bg-surface rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-500 to-purple-500 rounded-full animate-[progress_2s_ease-in-out_infinite]" />
          </div>
          <div className="text-center">
            <p className="text-orange-400 text-xl">{sloka.sanskrit}</p>
            <p className="text-foreground-muted text-sm mt-2">{sloka.meaning}</p>
          </div>
        </div>
      )}

      {/* Style 6: Floating Text */}
      {style === 'float' && (
        <div className="animate-[float_3s_ease-in-out_infinite] flex flex-col items-center gap-6">
          <Image src="/Logo/logo.svg" alt="Sadhana" width={80} height={80} />
          <div className="text-3xl font-bold">Sadhana</div>
          <div className="text-center">
            <p className="text-orange-400">{sloka.sanskrit}</p>
            <p className="text-foreground-muted text-sm mt-1">{sloka.meaning}</p>
          </div>
        </div>
      )}

      {/* Style 7: Breathing Circle */}
      {style === 'breathe' && (
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute -inset-10 border-2 border-orange-500/30 rounded-full animate-[breatheCircle_4s_ease-in-out_infinite]" />
            <div className="absolute -inset-5 bg-orange-500/10 rounded-full animate-[breatheCircle_4s_ease-in-out_infinite]" />
            <Image src="/Logo/logo.svg" alt="Sadhana" width={80} height={80} className="relative z-10" />
          </div>
          <div className="text-center mt-8">
            <p className="text-foreground-muted text-xs uppercase tracking-[0.3em] mb-3">Breathe</p>
            <p className="text-orange-400 text-xl">{sloka.sanskrit}</p>
            <p className="text-foreground-muted text-sm mt-2">{sloka.meaning}</p>
          </div>
        </div>
      )}

      {/* Style 8: Full Screen Zen */}
      {style === 'zen' && (
        <div className="flex flex-col items-center justify-center gap-8 relative w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-orange-950/20" />
          <div className="absolute top-8 left-0 right-0 text-center">
            <span className="text-foreground-muted text-xs tracking-[0.4em] uppercase">साधना</span>
          </div>
          <div className="relative z-10">
            <div className="absolute -inset-16 bg-gradient-to-r from-orange-500/20 via-purple-500/20 to-orange-500/20 rounded-full blur-3xl animate-pulse" />
            <Image src="/Logo/logo.svg" alt="Sadhana" width={100} height={100} className="relative z-10 animate-[breathe_3s_ease-in-out_infinite]" />
          </div>
          <div className="text-center z-10">
            <p className="text-orange-400 text-2xl font-medium">{sloka.sanskrit}</p>
            <p className="text-foreground-muted mt-3">{sloka.meaning}</p>
          </div>
          <div className="absolute bottom-8 flex gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 bg-orange-500/50 rounded-full animate-pulse" style={{animationDelay: `${i * 200}ms`}} />
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 100%; }
          100% { width: 0%; }
        }
        @keyframes breatheCircle {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.6; }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  )
}
