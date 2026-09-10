# TagOption — Trading Platform

A full-featured binary options trading platform built with Next.js, Tailwind CSS, and the Deriv WebSocket API.

## Setup

```bash
npm install
npm run dev
```

## Deriv API Integration

1. Get your API token from [app.deriv.com/account/api-token](https://app.deriv.com/account/api-token)
2. Copy `.env.example` to `.env.local`
3. Set `NEXT_PUBLIC_DERIV_TOKEN=your_token_here`

Without a token, the dashboard runs in demo mode with simulated price data.

## Deploy on Vercel

1. Push to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Add `NEXT_PUBLIC_DERIV_TOKEN` in Vercel Environment Variables
https://tagoption-tan.vercel.app
