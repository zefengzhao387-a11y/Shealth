"use client"

import { motion } from "framer-motion"
import Link from "next/link"

export function Footer({ showCTA = true }: { showCTA?: boolean }) {
  return (
    <footer className="relative py-12 px-6 border-t border-border/50">
      {showCTA && (
        <div className="max-w-6xl mx-auto text-center mb-12">
          <motion.h3
            className="text-xl md:text-2xl font-medium text-foreground mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            准备好和灵息见一面了吗？
          </motion.h3>
          <Link href="/home">
            <motion.button
              className="px-8 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              和灵息对话
            </motion.button>
          </Link>
        </div>
      )}
      
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-brand bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-wider">
            她健康
          </span>
          <span className="text-xs md:text-sm font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Shealth</span>
          <span className="text-sm text-muted-foreground ml-2">
            © 2024 保留所有权利
          </span>
        </div>
        
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <a id="privacy-policy-link" href="#" className="hover:text-foreground transition-colors">隐私政策</a>
          <a href="#" className="hover:text-foreground transition-colors">用户协议</a>
          <a href="#" className="hover:text-foreground transition-colors">联系我们</a>
        </div>
      </div>
    </footer>
  )
}
