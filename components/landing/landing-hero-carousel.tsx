'use client'

import { MessageCircle, Sparkles, Users, Dumbbell } from 'lucide-react'
import CardSwap, { Card } from '@/components/CardSwap/CardSwap'

const LANDING_SWAP_ITEMS = [
  {
    id: 1,
    title: '对语灵息',
    description: '运动、睡眠、经期的私语，轻轻诉与灵息；一问一答，如与知己对坐，温暖如灯。',
    icon: MessageCircle,
  },
  {
    id: 2,
    title: '动起成诗',
    description: '短时动作与恢复同行；哪怕只动十分钟，也是写给身体的一行字。',
    icon: Dumbbell,
  },
  {
    id: 3,
    title: '繁花同路',
    description: '社区里同路人的鼓励如春风；彼此见证生长，每一步都有了回响。',
    icon: Users,
  },
  {
    id: 4,
    title: '镜照生长',
    description: '身形的起伏，悄悄落入镜心；曲线如河，星点如成就，皆与你有关。',
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
