/** 移动端触控 Spring 回弹（awesome-cursorrules 规范） */
export const TAP_SPRING = {
  scale: 0.96,
  transition: { type: "spring" as const, stiffness: 400, damping: 15 },
}

export const TAP_SPRING_LIGHT = {
  scale: 0.98,
  transition: { type: "spring" as const, stiffness: 400, damping: 18 },
}

/** 全站页面切换 */
export const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 14, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -10, filter: "blur(4px)" },
  transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
}

export const PAGE_TRANSITION_REDUCED = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
}
