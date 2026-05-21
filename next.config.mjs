/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 手机用局域网 IP 访问 dev 时，允许跨源加载 _next 资源（否则会白屏/黑屏）
  allowedDevOrigins: [
    '192.168.5.11',
    ...(process.env.LAN_DEV_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean) ?? []),
  ],
}

export default nextConfig
