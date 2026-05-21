/** 移动端触控 Spring 回弹（awesome-cursorrules 规范） */
export const TAP_SPRING = {
  scale: 0.96,
  transition: { type: "spring" as const, stiffness: 400, damping: 15 },
}

export const TAP_SPRING_LIGHT = {
  scale: 0.98,
  transition: { type: "spring" as const, stiffness: 400, damping: 18 },
}
