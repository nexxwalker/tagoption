import './globals.css'

export const metadata = {
  title: 'AlphaFx — Professional Trading Platform',
  description: 'AlphaFx is a professional trading platform for global markets, fast execution, and disciplined trading.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
