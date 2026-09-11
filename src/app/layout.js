import './globals.css'

export const viewport = {
  themeColor: '#0b0d14',
}

export const metadata = {
  title: 'AlphaFx — Professional Trading Platform',
  description: 'AlphaFx is a professional trading platform for global markets, fast execution, and disciplined trading.',
  manifest: '/manifest.webmanifest',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
