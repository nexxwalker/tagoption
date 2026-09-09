'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const TICKER_ASSETS = [
  { sym:'BTC', price:'43,256', change:'+2.34%', up:true,  bg:'#f7931a' },
  { sym:'ETH', price:'2,284',  change:'+1.87%', up:true,  bg:'#627eea' },
  { sym:'AAPL',price:'178.32', change:'-0.45%', up:false, bg:'#888' },
  { sym:'XAU', price:'2,024',  change:'+0.89%', up:true,  bg:'#ffd700' },
  { sym:'TSLA',price:'248.90', change:'+3.21%', up:true,  bg:'#cc2200' },
  { sym:'EUR', price:'1.0892', change:'+0.12%', up:true,  bg:'#4a90d9' },
  { sym:'SOL', price:'98.42',  change:'+5.67%', up:true,  bg:'#9945ff' },
  { sym:'GBP', price:'1.2654', change:'-0.08%', up:false, bg:'#012169' },
]

function Ticker() {
  const set = [...TICKER_ASSETS, ...TICKER_ASSETS, ...TICKER_ASSETS]
  return (
    <div style={{ overflow:'hidden', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', background:'var(--bg-secondary)' }}>
      <div className="ticker-track" style={{ display:'flex', gap:32, padding:'10px 0', width:'max-content', alignItems:'center' }}>
        {set.map((a,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap', padding:'0 4px' }}>
            <span style={{ width:28, height:28, borderRadius:'50%', background:a.bg, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{a.sym[0]}</span>
            <span style={{ fontSize:13, fontWeight:600 }}>{a.sym}</span>
            <span style={{ fontSize:13, color:'var(--text-secondary)' }}>${a.price}</span>
            <span style={{ fontSize:12, fontWeight:700, color:a.up?'var(--green)':'var(--red)' }}>{a.change}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const LIVE_TRADE_NAMES = ['Tom','Mike','Rachel','Lisa','Julia','Nina','Sarah','Alex','David','Maria','James','Emma']

function HeroChart() {
  const canvasRef = useRef(null)
  const pts = useRef([])
  const animRef = useRef(null)
  const [price, setPrice] = useState(43450.28)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let base = 43243
    for (let i = 0; i < 80; i++) { base += (Math.random()-0.47)*120; pts.current.push(base) }
    function draw() {
      const W = canvas.offsetWidth || canvas.width
      const H = canvas.offsetHeight || canvas.height
      canvas.width = W; canvas.height = H
      ctx.clearRect(0,0,W,H)
      const data = pts.current.slice(-80)
      const mn = Math.min(...data), mx = Math.max(...data), range = mx-mn||1
      const pad = { t:12, b:12, l:8, r:8 }
      const cW = W-pad.l-pad.r, cH = H-pad.t-pad.b
      const toX = i => pad.l+(i/(data.length-1))*cW
      const toY = v => pad.t+cH-((v-mn)/range)*cH
      ctx.beginPath()
      data.forEach((p,i) => i===0 ? ctx.moveTo(toX(i),toY(p)) : ctx.lineTo(toX(i),toY(p)))
      ctx.lineTo(toX(data.length-1), pad.t+cH); ctx.lineTo(toX(0), pad.t+cH); ctx.closePath()
      const grad = ctx.createLinearGradient(0,pad.t,0,pad.t+cH)
      grad.addColorStop(0,'rgba(0,201,123,0.22)'); grad.addColorStop(1,'rgba(0,201,123,0)')
      ctx.fillStyle = grad; ctx.fill()
      ctx.beginPath()
      data.forEach((p,i) => i===0 ? ctx.moveTo(toX(i),toY(p)) : ctx.lineTo(toX(i),toY(p)))
      ctx.strokeStyle = '#00c97b'; ctx.lineWidth = 2; ctx.stroke()
      const lx = toX(data.length-1), ly = toY(data[data.length-1])
      ctx.beginPath(); ctx.arc(lx,ly,3.5,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill()
      const label = '$'+data[data.length-1].toFixed(2)
      ctx.fillStyle='rgba(30,34,53,0.88)'
      ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(lx-44,ly-12,90,20,3); else ctx.rect(lx-44,ly-12,90,20); ctx.fill()
      ctx.fillStyle='#cdd5e0'; ctx.font='bold 10px DM Sans,sans-serif'; ctx.textAlign='center'
      ctx.fillText(label, lx, ly+4)
      base += (Math.random()-0.47)*120; pts.current.push(base)
      if (pts.current.length>300) pts.current.shift()
      setPrice(base)
      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <div style={{ borderRadius:16, overflow:'hidden', background:'var(--bg-card)', border:'1px solid var(--border)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ width:34, height:34, borderRadius:10, background:'#f7931a22', color:'#f7931a', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14 }}>B</span>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontWeight:600, fontSize:13 }}>BTC/USD</span>
              <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, padding:'2px 8px', borderRadius:999, background:'rgba(0,201,123,0.13)', color:'var(--green)' }}>
                <span className="pulse-dot" style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', display:'inline-block' }}></span>LIVE
              </span>
            </div>
            <div style={{ fontSize:11, color:'var(--text-secondary)' }}>Bitcoin / US Dollar</div>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:18, fontWeight:700, color:'var(--green)' }}>${price.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
          <div style={{ fontSize:11, color:'var(--green)' }}>+0.45%</div>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display:'block', width:'100%', height:180 }}/>
    </div>
  )
}

function LiveTrades() {
  const [trades, setTrades] = useState([
    {name:'Tom',dir:'Lower',amt:'$50'},{name:'Mike',dir:'Lower',amt:'$200'},
    {name:'Rachel',dir:'Lower',amt:'$10'},{name:'Lisa',dir:'Lower',amt:'$200'},
    {name:'Julia',dir:'Lower',amt:'$25'},{name:'Nina',dir:'Higher',amt:'$20'},
  ])
  useEffect(() => {
    const interval = setInterval(() => {
      const name = LIVE_TRADE_NAMES[Math.floor(Math.random()*LIVE_TRADE_NAMES.length)]
      const up = Math.random()>0.45
      const amounts = ['$10','$25','$50','$100','$200']
      const amt = amounts[Math.floor(Math.random()*amounts.length)]
      setTrades(prev => [{ name, dir:up?'Higher':'Lower', amt }, ...prev.slice(0,5)])
    }, 2200)
    return () => clearInterval(interval)
  }, [])
  return (
    <div style={{ borderRadius:16, overflow:'hidden', background:'var(--bg-card)', border:'1px solid var(--border)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderBottom:'1px solid var(--border)' }}>
        <span style={{ fontSize:11, fontWeight:700, color:'var(--text-secondary)', letterSpacing:0.5 }}>LIVE TRADES</span>
        <span className="pulse-dot" style={{ width:7, height:7, borderRadius:'50%', background:'var(--green)', display:'inline-block' }}></span>
      </div>
      {trades.map((t,i) => {
        const up = t.dir==='Higher'
        return (
          <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)', opacity:Math.max(0.3,1-i*0.13) }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:up?'rgba(0,201,123,0.15)':'rgba(255,71,87,0.15)', color:up?'var(--green)':'var(--red)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{t.name[0]}</div>
              <div>
                <div style={{ fontSize:12, fontWeight:600 }}>{t.name}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>just now</div>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:12, fontWeight:700 }}>{t.amt}</div>
              <div style={{ fontSize:10, color:up?'var(--green)':'var(--red)' }}>{up?'↑':'↓'} {t.dir}</div>
            </div>
          </div>
        )
      })}
      <Link href="/register" style={{ display:'block', textAlign:'center', padding:'12px', fontSize:13, fontWeight:600, color:'var(--blue)', borderTop:'1px solid var(--border)', textDecoration:'none' }}>
        Start Trading →
      </Link>
    </div>
  )
}

const FEATURES = [
  { title:'Blazing Fast',    desc:'Trades execute in under 1 second. Zero lag, zero requotes.',              svg:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { title:'Fully Secured',   desc:'256-bit SSL encryption and segregated client accounts.',                   svg:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { title:'100+ Markets',    desc:'Forex, crypto, stocks, indices, commodities — all in one place.',          svg:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { title:'No Hidden Fees',  desc:'Zero fees on deposits and withdrawals. What you see is what you get.',     svg:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8"/><line x1="12" y1="6" x2="12" y2="18"/></svg> },
  { title:'Trade Anywhere',  desc:'Responsive web app works perfectly on any device, any screen.',            svg:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg> },
  { title:'24/7 Support',    desc:'Real human support around the clock via live chat and email.',              svg:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
]

const REVIEWS = [
  { name:'Alex M.',  initials:'AM', loc:'USA',     text:"Switched from three other platforms. AlphaFx is the fastest and most reliable by far." },
  { name:'Sarah K.', initials:'SK', loc:'UK',      text:"From crypto to forex, everything in one place. The interface is buttery smooth." },
  { name:'James W.', initials:'JW', loc:'Germany', text:"10 years of trading experience and this is the best platform I've ever used." },
  { name:'Maria G.', initials:'MG', loc:'Brazil',  text:"Started with demo and now trade real money. Withdrawals are super fast!" },
  { name:'David H.', initials:'DH', loc:'Japan',   text:"Sub-second execution. Perfect for my scalping strategy. Highly recommended." },
  { name:'Lisa T.',  initials:'LT', loc:'France',  text:"I trade part-time and the mobile experience is flawless. Love the simplicity." },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div style={{ background:'var(--bg-primary)', color:'var(--text-primary)', minHeight:'100vh', overflowX:'hidden' }}>
      <style>{`
        *{box-sizing:border-box}
        /* ticker animation */
        @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-33.333%)}}
        .ticker-track{animation:ticker 28s linear infinite}
        /* pulse */
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .pulse-dot{animation:pulse 2s ease-in-out infinite}

        /* ── responsive grid helpers ── */
        .hero-grid{display:grid;grid-template-columns:1fr 220px;gap:16px;align-items:stretch}
        .feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr)}
        .review-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        .badge-row{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap}
        .btn-row{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;margin-bottom:28px}
        .nav-links{display:flex;align-items:center;gap:28px}
        .nav-right{display:flex;align-items:center;gap:10px}
        .mobile-menu{display:none}
        .footer-app{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:28px 32px;border-radius:16px;background:var(--bg-card);border:1px solid var(--border);flex-wrap:wrap}
        .footer-bottom{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
        .steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:40px;position:relative}

        @media(max-width:700px){
          .hero-grid{grid-template-columns:1fr}
          .feat-grid{grid-template-columns:1fr}
          .stats-grid{grid-template-columns:repeat(2,1fr);gap:0}
          .review-grid{grid-template-columns:1fr}
          .nav-links{display:none}
          .nav-right{display:none}
          .mobile-menu{display:flex;align-items:center;gap:8px}
          .steps-grid{grid-template-columns:1fr;gap:28px}
          .badge-row{gap:6px}
          .footer-app{flex-direction:column;align-items:flex-start;padding:20px}
          .footer-bottom{flex-direction:column;align-items:center;text-align:center;gap:10px}
          .steps-connector{display:none}
        }
        @media(min-width:701px) and (max-width:959px){
          .hero-grid{grid-template-columns:1fr}
          .feat-grid{grid-template-columns:repeat(2,1fr)}
          .review-grid{grid-template-columns:repeat(2,1fr)}
          .stats-grid{grid-template-columns:repeat(4,1fr)}
          .steps-grid{grid-template-columns:repeat(3,1fr)}
        }
      `}</style>

      {/* ══ NAV ══ */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', position:'sticky', top:0, zIndex:50, background:'rgba(9,11,16,0.96)', backdropFilter:'blur(16px)', borderBottom:'1px solid var(--border)' }}>
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', color:'inherit', flexShrink:0 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:'var(--blue)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </div>
          <span style={{ fontWeight:700, fontSize:17 }}>AlphaFx</span>
        </Link>

        {/* Desktop nav links */}
        <div className="nav-links">
          {[['How It Works','#steps']].map(([label,href]) => (
            <a key={label} href={href} style={{ fontSize:14, color:'var(--text-secondary)', textDecoration:'none' }}>{label}</a>
          ))}
        </div>

        {/* Desktop right */}
        <div className="nav-right">
          <Link href="/login" style={{ fontSize:14, fontWeight:500, color:'var(--text-secondary)', textDecoration:'none', padding:'8px 14px' }}>Log in</Link>
          <Link href="/register" style={{ fontSize:13, fontWeight:600, color:'#fff', background:'var(--blue)', textDecoration:'none', padding:'9px 20px', borderRadius:10, whiteSpace:'nowrap' }}>Get Started</Link>
        </div>

        {/* Mobile nav */}
        <div className="mobile-menu">
          <Link href="/login" style={{ fontSize:13, fontWeight:500, color:'var(--text-secondary)', textDecoration:'none', padding:'7px 12px', borderRadius:8, border:'1px solid var(--border)' }}>Log in</Link>
          <Link href="/register" style={{ fontSize:13, fontWeight:600, color:'#fff', background:'var(--blue)', textDecoration:'none', padding:'8px 16px', borderRadius:9, whiteSpace:'nowrap' }}>Get Started</Link>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section style={{ textAlign:'center', padding:'60px 20px 36px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(217,119,36,0.12), transparent)' }}/>
        <div style={{ position:'relative', maxWidth:700, margin:'0 auto' }}>
          {/* Badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'7px 16px', borderRadius:999, fontSize:13, marginBottom:24, background:'rgba(217,147,50,0.1)', border:'1px solid rgba(217,147,50,0.25)', color:'var(--blue)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Over 1 million traders and counting
          </div>
          <h1 style={{ fontSize:'clamp(34px, 6vw, 62px)', fontWeight:800, lineHeight:1.1, marginBottom:18, letterSpacing:-1 }}>
            Trading Made Easy,{' '}
            <span style={{ background:'linear-gradient(135deg, #d99332, #e6ad4c)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Trade Smart</span>
          </h1>
          <p style={{ fontSize:'clamp(14px, 2.5vw, 17px)', color:'var(--text-secondary)', lineHeight:1.65, maxWidth:480, margin:'0 auto 28px' }}>
            Trade 100+ assets worldwide with lightning execution and up to 95% returns. Start with as little as $10.
          </p>

        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="steps" style={{ padding:'72px 20px' }}>
        <div style={{ maxWidth:800, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:8 }}>
            <span style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:'var(--blue)' }}>Three steps to your first trade</span>
          </div>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <h2 style={{ fontSize:'clamp(24px, 4vw, 38px)', fontWeight:700 }}>Start trading in minutes</h2>
          </div>
          <div className="steps-grid">
            <div className="steps-connector" style={{ position:'absolute', top:30, left:'20%', right:'20%', height:1, background:'var(--border)' }}/>
            {[
              { n:'1', title:'Sign Up',      desc:'Create your free account in 30 seconds. No documents needed to start.' },
              { n:'2', title:'Deposit',      desc:'Fund with M-Pesa, crypto, or cards. Start from just $10.' },
              { n:'3', title:'Trade & Earn', desc:'Choose an asset, predict the direction, and earn up to 95% profit.' },
            ].map(s => (
              <div key={s.n} style={{ textAlign:'center', position:'relative' }}>
                <div style={{ width:60, height:60, borderRadius:'50%', border:'2px solid var(--blue)', background:'var(--bg-primary)', color:'var(--blue)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, margin:'0 auto 18px', position:'relative', zIndex:2 }}>{s.n}</div>
                <div style={{ fontWeight:600, fontSize:16, marginBottom:8 }}>{s.title}</div>
                <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══ CTA ══ */}
      <section style={{ background:'var(--bg-secondary)', borderTop:'1px solid var(--border)', padding:'72px 20px', textAlign:'center' }}>
        <div style={{ maxWidth:600, margin:'0 auto' }}>
          <h2 style={{ fontSize:'clamp(24px, 4vw, 42px)', fontWeight:700, marginBottom:14 }}>Ready to start earning?</h2>
          <p style={{ fontSize:16, color:'var(--text-secondary)', marginBottom:36, lineHeight:1.65 }}>Join a million traders worldwide. Create your free account in under 60 seconds.</p>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
            <Link href="/register" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'14px 28px', borderRadius:12, fontWeight:600, fontSize:15, background:'var(--blue)', color:'#fff', textDecoration:'none', whiteSpace:'nowrap' }}>
              Create Free Account →
            </Link>
            <Link href="/dashboard" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'14px 22px', borderRadius:12, fontWeight:600, fontSize:15, border:'1px solid var(--border)', color:'var(--text-primary)', textDecoration:'none', whiteSpace:'nowrap' }}>
              Try Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ background:'var(--bg-primary)', borderTop:'1px solid var(--border)' }}>
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'36px 20px' }}>
          <div className="footer-app">
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'var(--blue)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:16 }}>AlphaFx</div>
                <div style={{ fontSize:12, color:'var(--blue)', fontWeight:500 }}>Mobile trading available</div>
              </div>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:600, fontSize:15, marginBottom:4 }}>Trade on the go</div>
              <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.5 }}>Download the AlphaFx app and get a better trading experience on mobile.</div>
            </div>
            <div style={{ flexShrink:0 }}>
              <Link href="#" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, fontWeight:600, fontSize:13, background:'var(--blue)', color:'#fff', textDecoration:'none' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.34l1.595 2.762a.5.5 0 01-.866.5l-1.613-2.795A9.97 9.97 0 0112 17a9.97 9.97 0 01-4.64-1.193L5.748 18.6a.5.5 0 01-.866-.5l1.595-2.762A9.972 9.972 0 012 8h20a9.972 9.972 0 01-4.477 7.34z"/></svg>
                Download App
              </Link>
              <div style={{ fontSize:11, color:'var(--text-muted)', textAlign:'center', marginTop:6 }}>Secure · Lightweight · Push Alerts</div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'16px 20px 28px', borderTop:'1px solid var(--border)' }}>
          <div className="footer-bottom">
            <Link href="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', color:'inherit' }}>
              <div style={{ width:26, height:26, borderRadius:7, background:'var(--blue)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
              </div>
              <span style={{ fontWeight:700 }}>AlphaFx</span>
            </Link>
            <div style={{ display:'flex', gap:20, flexWrap:'wrap', justifyContent:'center' }}>
              {['Privacy','Terms','Support'].map(l => (
                <a key={l} href="#" style={{ fontSize:13, color:'var(--text-secondary)', textDecoration:'none' }}>{l}</a>
              ))}
            </div>
            <div style={{ fontSize:13, color:'var(--text-muted)' }}>© 2026 AlphaFx</div>
          </div>
        </div>
      </footer>

    </div>
  )
}
