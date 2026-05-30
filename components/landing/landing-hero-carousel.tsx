'use client'

import { MessageCircle, Sparkles, Users, Dumbbell } from 'lucide-react'
import Carousel from '@/components/Carousel/Carousel'

const LANDING_CAROUSEL_ITEMS = [
  {
    id: 1,
    title: '面对面聊',
    description: '运动、睡眠、经期——像和朋友一样，随时问灵息。',
    icon: <MessageCircle className="carousel-icon" strokeWidth={2} />,
  },
  {
    id: 2,
    title: '跟着练',
    description: '短时动作与恢复建议，动十分钟，也算数。',
    icon: <Dumbbell className="carousel-icon" strokeWidth={2} />,
  },
  {
    id: 3,
    title: '有人陪',
    description: '繁花社区里，与同路人互相鼓励、一起成长。',
    icon: <Users className="carousel-icon" strokeWidth={2} />,
  },
  {
    id: 4,
    title: '看见变化',
    description: '镜心记录身体维度，趋势与成就一目了然。',
    icon: <Sparkles className="carousel-icon" strokeWidth={2} />,
  },
]

export function LandingHeroCarousel() {
  return (
    <div className="landing-hero-carousel pointer-events-auto">
      <Carousel
        items={LANDING_CAROUSEL_ITEMS}
        baseWidth={330}
        autoplay
        autoplayDelay={2000}
        pauseOnHover={false}
        loop={true}
        round={false}
        hideIndicators
        className="landing-carousel"
      />
    </div>
  )
}
