"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  ArrowRight,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react"
import Image from "next/image"
import { useMemo, useState } from "react"
import { Navigation } from "@/components/shared/navigation"
import { BackgroundEffects } from "@/components/shared/effects"
import { AppPageHeader } from "@/components/shared/app-page-header"
import { TAP_SPRING } from "@/lib/motion-presets"

type Category = "all" | "cycle" | "sleep" | "movement" | "daily"

type Product = {
  id: string
  name: string
  note: string
  category: Exclude<Category, "all">
  price: number
  tag: string
  image: string
}

const categories: Array<{ id: Category; label: string }> = [
  { id: "all", label: "全部好物" },
  { id: "cycle", label: "经期照护" },
  { id: "sleep", label: "睡眠修复" },
  { id: "movement", label: "自在运动" },
  { id: "daily", label: "日常养护" },
]

const products: Product[] = [
  {
    id: "warm-belt",
    name: "云朵热敷带",
    note: "三档温度 · 轻柔包裹腰腹",
    category: "cycle",
    price: 269,
    tag: "经期常备",
    image: "/shop/warm-belt.png",
  },
  {
    id: "sleep-mist",
    name: "晚风枕边雾",
    note: "白茶与鸢尾 · 30ml",
    category: "sleep",
    price: 128,
    tag: "睡前仪式",
    image: "/shop/sleep-mist.png",
  },
  {
    id: "ribbon-band",
    name: "流云弹力带",
    note: "三段阻力 · 亲肤不卷边",
    category: "movement",
    price: 89,
    tag: "新手友好",
    image: "/shop/ribbon-band.png",
  },
  {
    id: "rose-tea",
    name: "玫瑰舒缓饮",
    note: "重瓣玫瑰与陈皮 · 10袋",
    category: "daily",
    price: 79,
    tag: "无额外糖",
    image: "/shop/rose-tea.png",
  },
  {
    id: "massage-pair",
    name: "月相按摩球",
    note: "一软一韧 · 肩颈足底适用",
    category: "movement",
    price: 69,
    tag: "随身放松",
    image: "/shop/massage-pair.png",
  },
  {
    id: "herbal-patch",
    name: "草本暖意贴",
    note: "持续温热 · 5片装",
    category: "cycle",
    price: 49,
    tag: "便携装",
    image: "/shop/herbal-patch.png",
  },
]

function ProductVisual({ product }: { product: Product }) {
  return (
    <div className="relative aspect-[5/4] overflow-hidden bg-muted">
      <Image
        src={product.image}
        alt={product.name}
        fill
        sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/24 via-transparent to-black/5" aria-hidden />
      <div className="absolute left-5 top-5 rounded-full border border-white/30 bg-black/15 px-3 py-1 text-[10px] tracking-[0.22em] text-white/90 shadow-sm backdrop-blur-md">
        SHEALTH SELECT
      </div>
      <p className="absolute bottom-4 right-5 font-serif text-xs tracking-[0.22em] text-white/85 drop-shadow-sm [writing-mode:vertical-rl]">
        身体自有节律
      </p>
    </div>
  )
}

function ProductCard({
  product,
  quantity,
  onAdd,
}: {
  product: Product
  quantity: number
  onAdd: () => void
}) {
  return (
    <motion.article
      layout
      className="group overflow-hidden rounded-[1.75rem] border border-white/12 bg-card/78 shadow-[0_16px_40px_rgba(30,12,25,0.14)] backdrop-blur-xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35 }}
    >
      <ProductVisual product={product} />
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[10px] tracking-[0.2em] text-primary/85">{product.tag}</span>
          <span className="text-sm font-medium text-foreground">¥{product.price}</span>
        </div>
        <h2 className="font-serif text-lg text-foreground">{product.name}</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{product.note}</p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-primary/10 text-sm text-foreground transition-colors hover:bg-primary/18"
          aria-label={`将${product.name}加入选品袋`}
        >
          {quantity > 0 ? <span>已选 {quantity} 件</span> : <span>加入选品袋</span>}
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </motion.article>
  )
}

export default function ShopPage() {
  const shouldReduceMotion = useReducedMotion()
  const [activeCategory, setActiveCategory] = useState<Category>("all")
  const [query, setQuery] = useState("")
  const [cart, setCart] = useState<Record<string, number>>({})
  const [cartOpen, setCartOpen] = useState(false)

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return products.filter((product) => {
      const matchesCategory = activeCategory === "all" || product.category === activeCategory
      const matchesQuery = !normalizedQuery || `${product.name}${product.note}${product.tag}`.toLowerCase().includes(normalizedQuery)
      return matchesCategory && matchesQuery
    })
  }, [activeCategory, query])

  const cartItems = useMemo(
    () => products.flatMap((product) => cart[product.id] ? [{ product, quantity: cart[product.id] }] : []),
    [cart],
  )
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  const changeQuantity = (productId: string, delta: number) => {
    setCart((current) => {
      const nextQuantity = Math.max(0, (current[productId] ?? 0) + delta)
      if (nextQuantity === 0) {
        const nextCart = { ...current }
        delete nextCart[productId]
        return nextCart
      }
      return { ...current, [productId]: nextQuantity }
    })
  }

  return (
    <main className="app-shell relative min-h-screen pb-[calc(env(safe-area-inset-bottom,0px)+8rem)] md:pb-24">
      <div className="app-shell__ambient fixed inset-0 -z-10 pointer-events-none" aria-hidden />
      <BackgroundEffects density="light" />
      <Navigation />

      <div className="mobile-shell relative z-10 pt-24 md:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-start justify-between gap-4">
            <AppPageHeader
              kicker="Shealth Select"
              title="花集 · 身体补给所"
              subtitle="按今天的身体感受，选一件真正需要的好物"
            />
            <motion.button
              type="button"
              onClick={() => setCartOpen(true)}
              className="app-chip relative mt-1 flex min-h-12 min-w-12 items-center justify-center px-3 text-foreground"
              whileTap={TAP_SPRING}
              aria-label={`打开选品袋，共${cartCount}件商品`}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {cartCount}
                </span>
              ) : null}
            </motion.button>
          </div>

          <section className="relative mb-7 overflow-hidden rounded-[2rem] border border-white/15 bg-[linear-gradient(118deg,rgba(119,73,92,0.92),rgba(76,69,101,0.86))] px-5 py-7 shadow-[0_24px_60px_rgba(25,10,24,0.22)] sm:px-8 sm:py-9">
            <div className="absolute -right-8 -top-16 h-64 w-64 rounded-full border border-white/10" aria-hidden />
            <div className="absolute right-12 top-8 h-24 w-24 rounded-full bg-primary/15 blur-2xl" aria-hidden />
            <div className="relative max-w-xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-[11px] tracking-[0.16em] text-white/75">
                <Sparkles className="h-3.5 w-3.5" />
                今日身体处方笺
              </div>
              <h2 className="max-w-lg font-serif text-2xl leading-tight text-white sm:text-4xl">
                不为改变身体，<br />只为让它舒服一点。
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/65">
                从经期热敷到睡前香气，每件好物都围绕真实使用场景挑选。少一点催促，多一点照顾。
              </p>
              <button
                type="button"
                onClick={() => document.getElementById("shop-products")?.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth" })}
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-[#543747] transition-transform hover:translate-x-0.5"
              >
                浏览今日精选 <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="absolute bottom-6 right-7 hidden text-right sm:block">
              <p className="font-brand text-6xl text-white/12">照顾</p>
              <p className="mt-1 text-[10px] tracking-[0.3em] text-white/35">CARE, NOT CORRECTION</p>
            </div>
          </section>

          <section id="shop-products" aria-label="商城商品">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {categories.map((category) => {
                  const active = category.id === activeCategory
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setActiveCategory(category.id)}
                      className={`min-h-11 shrink-0 rounded-full px-4 text-sm transition-colors ${active ? "bg-primary text-primary-foreground" : "app-chip text-muted-foreground hover:text-foreground"}`}
                      aria-pressed={active}
                    >
                      {category.label}
                    </button>
                  )
                })}
              </div>
              <label className="app-chip flex min-h-11 items-center gap-2 px-4 md:w-64">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">搜索好物</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索好物"
                  className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </label>
            </div>

            <AnimatePresence mode="popLayout">
              {filteredProducts.length > 0 ? (
                <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      quantity={cart[product.id] ?? 0}
                      onAdd={() => changeQuantity(product.id, 1)}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-[1.75rem] border border-dashed border-border/60 py-16 text-center"
                >
                  <p className="font-serif text-lg text-foreground">还没有找到这件好物</p>
                  <p className="mt-2 text-sm text-muted-foreground">换个关键词，或看看其他身体场景</p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {cartOpen ? (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-[70] cursor-default bg-black/45 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              aria-label="关闭选品袋"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-md flex-col border-l border-white/12 bg-[oklch(0.3_0.034_346)] p-5 shadow-2xl"
              aria-label="选品袋"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-[10px] tracking-[0.24em] text-primary">YOUR SELECTION</p>
                  <h2 className="mt-1 font-serif text-2xl">选品袋</h2>
                </div>
                <button type="button" onClick={() => setCartOpen(false)} className="app-chip flex h-11 w-11 items-center justify-center" aria-label="关闭">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto py-5">
                {cartItems.length ? cartItems.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                      <Image src={product.image} alt="" fill sizes="56px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">¥{product.price}</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/10 p-1">
                      <button type="button" onClick={() => changeQuantity(product.id, -1)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10" aria-label={`减少${product.name}`}><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-4 text-center text-xs">{quantity}</span>
                      <button type="button" onClick={() => changeQuantity(product.id, 1)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10" aria-label={`增加${product.name}`}><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                )) : (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <ShoppingBag className="h-10 w-10 text-primary/55" strokeWidth={1.3} />
                    <p className="mt-4 font-serif text-lg">选品袋还是空的</p>
                    <p className="mt-1 text-sm text-muted-foreground">先去挑一件让身体舒服的好物</p>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="mb-4 flex items-end justify-between">
                  <span className="text-sm text-muted-foreground">合计</span>
                  <span className="font-serif text-2xl">¥{cartTotal}</span>
                </div>
                <button
                  type="button"
                  disabled={!cartItems.length}
                  className="min-h-12 w-full rounded-2xl bg-primary text-sm font-medium text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {cartItems.length ? "确认选品 · 结算即将开放" : "先挑选一件好物"}
                </button>
                <p className="mt-3 text-center text-[11px] text-muted-foreground">当前为商品体验页，暂不会产生真实订单</p>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </main>
  )
}
