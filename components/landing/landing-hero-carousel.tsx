'use client'

import { MessageCircle, Sparkles, Users, Dumbbell } from 'lucide-react'
import CardSwap, { Card } from '@/components/CardSwap/CardSwap'

const LANDING_SWAP_ITEMS = [
  {
    id: 1,
    title: '对语灵息',
    description: '经期、睡眠与情绪的私语，都可以轻轻告诉灵息；她会认真听，温柔回应。',
    icon: MessageCircle,
  },
  {
    id: 2,
    title: '动起成诗',
    description: '短时舒展与恢复同行；动或不动，都由你决定，身体永远值得被善待。',
    icon: Dumbbell,
  },
  {
    id: 3,
    title: '繁花同路',
    description: '社区里同路人的鼓励如春风；彼此倾听、互相看见，不必比较，只要陪伴。',
    icon: Users,
  },
  {
    id: 4,
    title: '镜照生长',
    description: '身体的起伏被温柔记录；每一次变化，都是与自己好好相处的痕迹。',
    icon: Sparkles,
  },
] as const

export function LandingHeroCarousel() {
  return (
    <div className="landing-hero-card-swap pointer-events-auto">
      <CardSwap
        width={330}
        height={196}
        cardDistance={60}
        verticalDistance={70}
        delay={5000}
        pauseOnHover={false}
        className="landing-card-swap"
      >
        {LANDING_SWAP_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.id} customClass="landing-swap-card">
              <div className="landing-swap-card__icon-wrap">
                <Icon className="landing-swap-card__icon" strokeWidth={2} />
              </div>
              <h3 className="landing-swap-card__title">{item.title}</h3>
              <p className="landing-swap-card__description">{item.description}</p>
            </Card>
          )
        })}
      </CardSwap>
    </div>
  )
}
