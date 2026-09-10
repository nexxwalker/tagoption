'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const DERIV_WS = 'wss://ws.derivws.com/websockets/v3?app_id=1089'
const MARKETS = [
  { sym:'R_10_1S',  label:'Volatility 10 (1s) Index',  short:'Vol 10 (1s)' },
  { sym:'R_10',     label:'Volatility 10 Index',        short:'Vol 10' },
  { sym:'R_15_1S',  label:'Volatility 15 (1s) Index',   short:'Vol 15 (1s)' },
  { sym:'R_25_1S',  label:'Volatility 25 (1s) Index',   short:'Vol 25 (1s)' },
  { sym:'R_25',     label:'Volatility 25 Index',         short:'Vol 25' },
  { sym:'R_50_1S',  label:'Volatility 50 (1s) Index',   short:'Vol 50 (1s)' },
  { sym:'R_50',     label:'Volatility 50 Index',         short:'Vol 50' },
  { sym:'R_75_1S',  label:'Volatility 75 (1s) Index',   short:'Vol 75 (1s)' },
  { sym:'R_75',     label:'Volatility 75 Index',         short:'Vol 75' },
  { sym:'R_100_1S', label:'Volatility 100 (1s) Index',  short:'Vol 100 (1s)' },
  { sym:'R_100',    label:'Volatility 100 Index',        short:'Vol 100' },
]

/* ── WebSocket ── */
function useDerivWS(symbol) {
  const wsRef = useRef(null)
  const [ticks, setTicks] = useState([])
  const [price, setPrice] = useState(null)
  const [connected, setConnected] = useState(false)
  useEffect(() => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
    setTicks([]); setPrice(null); setConnected(false)
    const ws = new WebSocket(DERIV_WS)
    wsRef.current = ws
    ws.onopen  = () => { setConnected(true); ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 })) }
    ws.onmessage = e => {
      const d = JSON.parse(e.data)
      if (d.msg_type === 'tick') {
        const p = d.tick.quote
        setPrice(p)
        setTicks(prev => [...prev, { price: p, time: d.tick.epoch * 1000 }].slice(-300))
      }
    }
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)
    return () => ws.close()
  }, [symbol])
  return { ticks, price, connected }
}

/* ── Chart ── */
function PriceChart({ ticks, mockTicks }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const data = ticks.length >= 2 ? ticks : mockTicks
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length < 2) return
    function draw() {
      const W = canvas.offsetWidth, H = canvas.offsetHeight
      if (!W || !H) { rafRef.current = requestAnimationFrame(draw); return }
      canvas.width = W; canvas.height = H
      const ctx = canvas.getContext('2d')
      const prices = data.map(d => d.price)
      const times  = data.map(d => d.time)
      const mn = Math.min(...prices), mx = Math.max(...prices), range = mx - mn || 1
      const pad = { t: 10, b: 26, l: 6, r: 64 }
      const cW = W - pad.l - pad.r, cH = H - pad.t - pad.b
      const toX = i => pad.l + (i / (prices.length - 1)) * cW
      const toY = v => pad.t + cH - ((v - mn) / range) * cH
      ctx.clearRect(0, 0, W, H)
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1
      for (let i = 0; i <= 5; i++) {
        const y = pad.t + (i / 5) * cH
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + cW, y); ctx.stroke()
        ctx.fillStyle = 'rgba(136,146,164,0.7)'; ctx.font = '9px DM Sans,sans-serif'; ctx.textAlign = 'left'
        ctx.fillText((mx - (i / 5) * range).toFixed(2), pad.l + cW + 3, y + 3)
      }
      const lc = Math.min(5, prices.length)
      ctx.fillStyle = 'rgba(136,146,164,0.6)'; ctx.font = '8px DM Sans,sans-serif'; ctx.textAlign = 'center'
      for (let i = 0; i < lc; i++) {
        const idx = Math.floor((i / (lc - 1)) * (prices.length - 1))
        const t = new Date(times[idx])
        ctx.fillText(`${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}:${String(t.getSeconds()).padStart(2,'0')}`, toX(idx), H - 4)
      }
      ctx.beginPath()
      prices.forEach((p, i) => i === 0 ? ctx.moveTo(toX(i), toY(p)) : ctx.lineTo(toX(i), toY(p)))
      ctx.lineTo(toX(prices.length - 1), pad.t + cH)
      ctx.lineTo(toX(0), pad.t + cH)
      ctx.closePath()
      const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + cH)
      grad.addColorStop(0, 'rgba(255,255,255,0.06)'); grad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = grad; ctx.fill()
      ctx.beginPath()
      prices.forEach((p, i) => i === 0 ? ctx.moveTo(toX(i), toY(p)) : ctx.lineTo(toX(i), toY(p)))
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke()
      const lx = toX(prices.length - 1), ly = toY(prices[prices.length - 1])
      ctx.beginPath(); ctx.arc(lx, ly, 3, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill()
      ctx.fillStyle = '#d99332'
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(lx + 3, ly - 10, 60, 20, 3)
      else ctx.rect(lx + 3, ly - 10, 60, 20)
      ctx.fill()
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px DM Sans,sans-serif'; ctx.textAlign = 'left'
      ctx.fillText(prices[prices.length - 1].toFixed(2), lx + 6, ly + 3)
    }
    draw()
    rafRef.current = requestAnimationFrame(function loop() { draw(); rafRef.current = requestAnimationFrame(loop) })
    return () => cancelAnimationFrame(rafRef.current)
  }, [data])
  return <canvas ref={canvasRef} style={{ display:'block', width:'100%', height:'100%' }} />
}

/* ── Digit Circle (with arc) ── */
function DigitCircle({ digit, pct, isActive, size = 46 }) {
  const r = (size / 2) - 4
  const cx = size / 2, cy = size / 2
  const circ = 2 * Math.PI * r
  const filled = (parseFloat(pct) / 100) * circ
  const arcColor = digit === 5 ? '#ff4757' : (parseFloat(pct) > 11 ? '#00c97b' : '#d99332')
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0, position:'relative', flexShrink:0 }}>
      <div style={{ position:'relative', width:size, height:size }}>
        <svg width={size} height={size} style={{ position:'absolute', top:0, left:0 }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5"/>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={arcColor} strokeWidth="2.5"
            strokeDasharray={`${filled} ${circ - filled}`}
            strokeDashoffset={circ * 0.25} strokeLinecap="round"
            style={{ transition:'stroke-dasharray 0.4s ease' }}/>
        </svg>
        <div style={{
          position:'absolute', inset:0, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', borderRadius:'50%',
          background: isActive ? 'rgba(217,147,50,0.22)' : 'transparent'
        }}>
          <span style={{ fontSize:size*0.3, fontWeight:700, color:isActive?'#fff':'rgba(226,232,240,0.75)', lineHeight:1 }}>{digit}</span>
          <span style={{ fontSize:size*0.19, color:'rgba(136,146,164,0.9)', lineHeight:1.1 }}>{pct}%</span>
        </div>
      </div>
      {isActive && (
        <div style={{ width:0, height:0, borderLeft:'4px solid transparent', borderRight:'4px solid transparent', borderTop:'5px solid #d99332', marginTop:2 }}/>
      )}
    </div>
  )
}

/* ── Digit Row ── */
function DigitRow({ ticks, mockTicks, size }) {
  const src = ticks.length >= 10 ? ticks : mockTicks
  const counts = Array(10).fill(0)
  const sample = src.slice(-100)
  sample.forEach(t => { const s = t.price.toFixed(2).replace('.',''); counts[parseInt(s[s.length-1])]++ })
  const tot = sample.length || 1
  const pcts = counts.map(c => ((c / tot) * 100).toFixed(1))
  const lastDigit = src.at(-1) ? parseInt(src.at(-1).price.toFixed(2).replace('.','').slice(-1)) : -1
  return (
    <div style={{
      display:'flex', alignItems:'flex-start', justifyContent:'space-around',
      padding:'5px 4px 3px', background:'#0b0d14',
      borderTop:'1px solid rgba(255,255,255,0.06)', flexShrink:0
    }}>
      {Array.from({ length:10 }, (_, d) => (
        <DigitCircle key={d} digit={d} pct={pcts[d]} isActive={d===lastDigit} size={size||46}/>
      ))}
    </div>
  )
}

/* ─������� Market Dropdown ── */
function MktDropdown({ markets, market, setMarket, setShowMarketDrop }) {
  return (
    <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, minWidth:220, background:'#151a22', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.8)', zIndex:600, maxHeight:260, overflowY:'auto' }}>
      {markets.map(m => (
        <button key={m.sym} onClick={() => { setMarket(m); setShowMarketDrop(false) }}
          style={{ width:'100%', padding:'9px 14px', border:'none', background:market.sym===m.sym?'rgba(217,147,50,0.15)':'transparent', color:market.sym===m.sym?'#d99332':'#f3f4f6', fontSize:12, textAlign:'left', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.04)', display:'flex', alignItems:'center', gap:8 }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/></svg>
          {m.label}
          {market.sym===m.sym&&<span style={{ marginLeft:'auto', width:5, height:5, borderRadius:'50%', background:'#00c97b', display:'inline-block'}}/>}
        </button>
      ))}
    </div>
  )
}

/* ── Right Trade Panel ── */
function TradePanel({ tradeType, setTradeType, autoMode, setAutoMode, stake, setStake, payout, placeTrade }) {
  return (
    <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
      {/* TRADING MODE */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:9, fontWeight:700, letterSpacing:1, color:'#9ca3af' }}>TRADING MODE</span>
        <span style={{ fontSize:9, color:'#515c72' }}>Execution preferences</span>
      </div>
      {/* AUTO / MANUAL */}
      <div style={{ display:'flex', borderRadius:8, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)' }}>
        {['AUTO','MANUAL'].map(m => (
          <button key={m} onClick={() => setAutoMode(m==='AUTO')}
            style={{ flex:1, padding:'8px 0', border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
              background:autoMode===(m==='AUTO')?'#d99332':'#141828',
              color:autoMode===(m==='AUTO')?'#fff':'#9ca3af' }}>{m}</button>
        ))}
      </div>
      {/* Type tabs */}
      <div style={{ display:'flex', borderRadius:8, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)' }}>
        {[['Even / Odd','even-odd'],['Match / Differ','match-differ'],['Over / Under','over-under']].map(([label,val]) => (
          <button key={val} onClick={() => setTradeType(val)}
            style={{ flex:1, padding:'7px 4px', border:'none', cursor:'pointer', fontSize:10, fontWeight:600,
              background:tradeType===val?'rgba(217,147,50,0.18)':'#141828',
              color:tradeType===val?'#d99332':'#9ca3af',
              borderBottom:tradeType===val?'2px solid #d99332':'2px solid transparent',
              whiteSpace:'nowrap' }}>{label}</button>
        ))}
      </div>
      {/* STAKE AMOUNT */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <span style={{ fontSize:9, fontWeight:700, letterSpacing:1, color:'#9ca3af' }}>STAKE AMOUNT</span>
          <div style={{ display:'flex', gap:3 }}>
            <span style={{ fontSize:9, padding:'2px 8px', borderRadius:4, background:'#d99332', color:'#fff', fontWeight:700 }}>Stake</span>
            <span style={{ fontSize:9, padding:'2px 8px', borderRadius:4, color:'#9ca3af', fontWeight:600 }}>Payout</span>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'#151a22', padding:'6px 10px', marginBottom:6 }}>
          <button onClick={() => setStake(s=>Math.max(1,s-1))}
            style={{ width:30, height:30, borderRadius:8, border:'none', cursor:'pointer', background:'rgba(255,255,255,0.08)', color:'#f3f4f6', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>−</button>
          <div style={{ flex:1, textAlign:'center' }}>
            <span style={{ fontSize:12, color:'#9ca3af', marginRight:2 }}>$</span>
            <span style={{ fontSize:26, fontWeight:700 }}>{stake}</span>
          </div>
          <button onClick={() => setStake(s=>s+1)}
            style={{ width:30, height:30, borderRadius:8, border:'none', cursor:'pointer', background:'rgba(255,255,255,0.08)', color:'#f3f4f6', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>+</button>
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {[1,5,10,25,50,100].map(v => (
            <button key={v} onClick={() => setStake(v)}
              style={{ flex:1, padding:'5px 0', borderRadius:6,
                border:`1px solid ${stake===v?'#d99332':'rgba(255,255,255,0.07)'}`,
                cursor:'pointer',
                background:stake===v?'rgba(217,147,50,0.2)':'#141828',
                color:stake===v?'#d99332':'#9ca3af', fontSize:10, fontWeight:600 }}>${v}</button>
          ))}
        </div>
      </div>
      {/* Payout row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0' }}>
        <span style={{ fontSize:12, color:'#9ca3af' }}>Payout</span>
        <span style={{ fontSize:14, fontWeight:700 }}>{payout} <span style={{ fontSize:10, color:'#515c72' }}>USD</span></span>
      </div>
      {/* Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
        {[
          { label:'● TARGET PROFIT', val:'200', sym:'$', color:'#00c97b', border:'rgba(0,201,123,0.25)' },
          { label:'⚠ STOP LOSS',     val:'999', sym:'$', color:'#ff4757', border:'rgba(255,71,87,0.25)' },
          { label:'× MULTIPLIER',    val:'2',   sym:'x', color:'#9ca3af', border:'rgba(255,255,255,0.08)' },
        ].map(({ label, val, sym, color, border }) => (
          <div key={label} style={{ padding:'7px 8px', borderRadius:8, background:'#151a22', border:`1px solid ${border}` }}>
            <div style={{ fontSize:7, fontWeight:700, color, marginBottom:3, lineHeight:1.2 }}>{label}</div>
            <div style={{ fontSize:9, color:'#9ca3af', marginBottom:1 }}>{sym}</div>
            <div style={{ fontSize:15, fontWeight:700 }}>{val}</div>
          </div>
        ))}
      </div>
      {/* Trade buttons */}
      {(tradeType==='even-odd'||!tradeType) && (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {[['even','Even','#00c97b','▶'],['odd','Odd','#ff4757','⚠']].map(([type,label,color,icon]) => (
            <button key={type} onClick={() => placeTrade(type)}
              style={{ padding:'9px 12px', borderRadius:9, border:'none', cursor:'pointer', background:color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:13 }}>{icon}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:800 }}>{label}</div>
                  <div style={{ fontSize:9, opacity:0.9 }}>95.22%</div>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:12, fontWeight:800 }}>{payout} USD</div>
                <div style={{ fontSize:9, opacity:0.9 }}>95.22%</div>
              </div>
            </button>
          ))}
        </div>
      )}
      {tradeType==='over-under' && (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {[['over','Over 4','#00c97b'],['under','Under 5','#ff4757']].map(([type,label,color]) => (
            <button key={type} onClick={() => placeTrade(type)}
              style={{ padding:'9px 12px', borderRadius:9, border:'none', cursor:'pointer', background:color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div><div style={{ fontSize:12, fontWeight:800 }}>{label}</div><div style={{ fontSize:9, opacity:0.9 }}>95.22%</div></div>
              <div style={{ textAlign:'right' }}><div style={{ fontSize:12, fontWeight:800 }}>{payout} USD</div></div>
            </button>
          ))}
        </div>
      )}
      {tradeType==='match-differ' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
          {[0,1,2,3,4,5,6,7,8,9].map(d => (
            <button key={d} onClick={() => placeTrade(`match-${d}`)}
              style={{ padding:'8px 10px', borderRadius:8, border:'1px solid rgba(217,147,50,0.25)', background:'rgba(217,147,50,0.08)', color:'#d99332', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', justifyContent:'space-between' }}>
              <span>Match {d}</span><span style={{ fontSize:10, opacity:0.7 }}>${payout}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Positions list ── */
function PositionsList({ openPos, closedPos, tab, setTab }) {
  const list = tab==='open' ? openPos : tab==='closed' ? closedPos : []
  return (
    <>
      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
        {[['open',`Open (${openPos.length})`],['closed',`Closed (${closedPos.length})`],['txns','Transactions']].map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ flex:1, padding:'10px 0', border:'none', cursor:'pointer', background:'transparent', fontSize:11, fontWeight:600,
              color:tab===key?'#d99332':'#9ca3af', borderBottom:tab===key?'2px solid #d99332':'2px solid transparent' }}>{label}</button>
        ))}
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:10 }} className="ns">
        {list.length===0&&tab!=='txns' && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:120, gap:8, textAlign:'center' }}>
            <div style={{ width:36, height:36, borderRadius:'50%', border:'1.5px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'#515c72' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <p style={{ fontSize:12, fontWeight:600 }}>No {tab} positions</p>
              <p style={{ fontSize:11, color:'#515c72', marginTop:2 }}>Your active trades appear here</p>
            </div>
          </div>
        )}
        {tab==='txns' && <div style={{ textAlign:'center', color:'#515c72', fontSize:12, paddingTop:40 }}>No transactions yet</div>}
        {list.map(p => (
          <div key={p.id} style={{ marginBottom:7, padding:9, borderRadius:8, background:'#151a22', border:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
              <span style={{ fontSize:11, fontWeight:700, textTransform:'capitalize',
                color:p.status==='open'?'#d99332':p.status==='won'?'#00c97b':'#ff4757' }}>
                {p.type} {p.status!=='open'&&`— ${p.status}`}
              </span>
              <span style={{ fontSize:10, color:'#515c72' }}>{p.time}</span>
            </div>
            {p.status==='open'
              ? <div style={{ fontSize:11, color:'#9ca3af' }}>Stake ${p.stake} → ${p.payout} <span style={{ color:'#fbbf24' }}>Pending…</span></div>
              : <div style={{ fontSize:13, fontWeight:700, color:p.profit>0?'#00c97b':'#ff4757' }}>{p.profit>0?'+':''}{p.profit?.toFixed(2)} USD</div>
            }
          </div>
        ))}
      </div>
      <div style={{ padding:'6px 10px', borderTop:'1px solid rgba(255,255,255,0.07)', fontSize:11, color:'#515c72', flexShrink:0 }}>
        {openPos.length} open positions
      </div>
    </>
  )
}

function TraderHub({ activeTab, setActiveTab, onClose }) {
  const [amount, setAmount] = useState('10')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [transactions, setTransactions] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const authHeaders = () => {
    const token = localStorage.getItem('alphafx_access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  useEffect(() => {
    if (activeTab !== 'history') return
    fetch('/api/payments', { headers: authHeaders() })
      .then(res => res.json())
      .then(data => setTransactions(data.transactions || []))
      .catch(() => setMessage('Transaction history is temporarily unavailable.'))
      .finally(() => setLoading(false))
  }, [activeTab])

  const submitPayment = async type => {
    setMessage('')
    const minimum = type === 'deposit' ? 10 : 5
    if (Number(amount) < minimum) {
      setMessage(`Minimum ${type} is $${minimum}.`)
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ type, amount, phoneNumber }),
      })
      const data = await response.json()
      setMessage(data.message || data.error || 'Payment request submitted.')
      if (response.ok) setActiveTab('history')
    } catch {
      setMessage('Payment request could not be completed.')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [['deposit','Deposit'],['withdrawal','Withdraw'],['history','History'],['chat','Chat']]
  return (
    <div role="dialog" aria-modal="true" aria-label="Trader Hub" className="hub-panel">
      <div className="hub-header">
        <div><div className="hub-kicker">AlphaFx platform</div><h2>Trader&apos;s Hub</h2></div>
        <button className="hub-close" onClick={onClose} aria-label="Close Trader Hub">×</button>
      </div>
      <div className="hub-tabs">
        {tabs.map(([value, label]) => <button key={value} className={activeTab === value ? 'hub-tab active' : 'hub-tab'} onClick={() => { setActiveTab(value); setMessage('') }}>{label}</button>)}
      </div>
      <div className="hub-content">
        {(activeTab === 'deposit' || activeTab === 'withdrawal') && (
          <div className="hub-form">
            <div className="hub-form-title">{activeTab === 'deposit' ? 'Fund your trading account' : 'Withdraw trading funds'}</div>
            <div className="hub-note">{activeTab === 'deposit' ? 'Minimum deposit $10' : 'Minimum withdrawal $5'} · M-Pesa secured by Daraja</div>
            <label>Amount (USD)<input type="number" min={activeTab === 'deposit' ? 10 : 5} value={amount} onChange={e => setAmount(e.target.value)} /></label>
            <label>M-Pesa phone number<input type="tel" placeholder="+254712345678" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} /></label>
            <button className="hub-primary" disabled={loading} onClick={() => submitPayment(activeTab)}>{loading ? 'Submitting…' : activeTab === 'deposit' ? 'Request deposit' : 'Request withdrawal'}</button>
            {message && <div className="hub-message">{message}</div>}
          </div>
        )}
        {activeTab === 'history' && <div className="hub-history"><div className="hub-form-title">Transaction ledger</div>{loading ? <div className="hub-empty">Loading history…</div> : transactions.length ? transactions.map(item => <div className="hub-row" key={item.id}><div><strong>{item.type}</strong><span>{new Date(item.created_at).toLocaleString()}</span></div><div><strong>${Number(item.amount).toFixed(2)}</strong><span className={`hub-status ${item.status}`}>{item.status}</span></div></div>) : <div className="hub-empty">No transactions recorded yet.</div>}{message && <div className="hub-message">{message}</div>}</div>}
        {activeTab === 'chat' && <div className="hub-empty hub-chat"><div className="hub-form-title">Trader support</div><p>Support chat is available from the AlphaFx operations desk.</p><button className="hub-primary" onClick={() => setMessage('Support chat will be available shortly.')}>Start chat</button>{message && <div className="hub-message">{message}</div>}</div>}
      </div>
    </div>
  )
}

/* ── Main ── */
export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [market, setMarket] = useState(MARKETS[0])
  const [showMarketDrop, setShowMarketDrop] = useState(false)
  const [tradeType, setTradeType] = useState('even-odd')
  const [mobileTradeType, setMobileTradeType] = useState('Even/Odd')
  const [autoMode, setAutoMode] = useState(true)
  const [stake, setStake] = useState(10)
  const [positions, setPositions] = useState([])
  const [balance, setBalance] = useState(0)
  const [bottomTab, setBottomTab] = useState('trade')
  const [desktopPosTab, setDesktopPosTab] = useState('open')
  const [showTraderHub, setShowTraderHub] = useState(false)
  const [hubTab, setHubTab] = useState('deposit')
  const [showBanner, setShowBanner] = useState(true)
  const [muted, setMuted] = useState(false)
  const mockRef = useRef([])
  const [mockTicks, setMockTicks] = useState([])
  const marketDropRef = useRef(null)
  const mobileMarketDropRef = useRef(null)

  useEffect(() => {
    let base = 9500
    const arr = []
    for (let i = 0; i < 150; i++) { base += (Math.random()-0.48)*2.5; arr.push({ price:base, time:Date.now()-(150-i)*1000 }) }
    mockRef.current = arr; setMockTicks([...arr])
    const t = setInterval(() => {
      base += (Math.random()-0.48)*2.5
      mockRef.current = [...mockRef.current, { price:base, time:Date.now() }].slice(-300)
      setMockTicks([...mockRef.current])
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const { ticks, price, connected } = useDerivWS(market.sym)

  useEffect(() => {
    const s = localStorage.getItem('alphafx_user')
    if (!s) { router.push('/login'); return }
    setUser(JSON.parse(s))
  }, [router])

  useEffect(() => {
    const h = e => {
      if (marketDropRef.current && !marketDropRef.current.contains(e.target)) setShowMarketDrop(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const displayPrice = price ?? mockTicks.at(-1)?.price ?? 9500
  const payout = (stake * 1.9522).toFixed(2)
  const openPos = positions.filter(p => p.status==='open')
  const closedPos = positions.filter(p => p.status!=='open')
  const priceChange = ticks.length>=2
    ? ((ticks.at(-1).price - ticks[0].price) / ticks[0].price * 100).toFixed(2)
    : '0.02'
  const priceChangePos = parseFloat(priceChange) >= 0

  const placeTrade = type => {
    const id = Date.now(), entry = price || mockTicks.at(-1)?.price || 9500
    setPositions(prev => [{ id, type, stake, entry, time:new Date().toLocaleTimeString(), status:'open', payout:parseFloat(payout) }, ...prev])
    setTimeout(() => {
      setPositions(prev => prev.map(t => {
        if (t.id!==id) return t
        const cur = price || mockTicks.at(-1)?.price || entry
        const ld = Math.floor(cur*100)%10
        let win = false
        if (type==='even')  win = ld%2===0
        if (type==='odd')   win = ld%2!==0
        if (type==='over')  win = ld>4
        if (type==='under') win = ld<5
        const profit = win ? +(t.payout - t.stake).toFixed(2) : -t.stake
        setBalance(b => +(b+profit).toFixed(2))
        return { ...t, status:win?'won':'lost', profit }
      }))
    }, 5000)
  }

  if (!user) return <div style={{ background:'#0b0d14', minHeight:'100vh' }}/>

  const SoundIcon = () => muted
    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;overflow:hidden}
        .ns::-webkit-scrollbar{display:none}.ns{-ms-overflow-style:none;scrollbar-width:none}
        /* mobile defaults */
        .d-nav{display:none!important}
        .m-nav{display:flex!important}
        .m-tabs{display:flex!important}
        .m-layout{display:flex!important}
        .m-bnav{display:flex!important}
        .desk-shell{display:none!important}
        /* desktop overrides */
        @media(min-width:768px){
          .d-nav{display:flex!important}
          .m-nav{display:none!important}
          .m-tabs{display:none!important}
          .m-layout{display:none!important}
          .m-bnav{display:none!important}
          .desk-shell{display:flex!important}
        }
        .bnav-btn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:8px 0;border:none;background:transparent;cursor:pointer;color:#9ca3af;font-size:10px;font-weight:500}
        .bnav-btn.act{color:#d99332}
        .tab-btn{flex-shrink:0;padding:9px 14px;font-size:12px;font-weight:600;color:#9ca3af;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent;display:flex;align-items:center;gap:5px;white-space:nowrap}
        .tab-btn.act{color:#d99332;border-bottom-color:#d99332}
        .navlink{display:flex;align-items:center;gap:5px;padding:5px 9px;border-radius:7px;color:#9ca3af;font-size:12px;font-weight:500;background:transparent;border:none;cursor:pointer;white-space:nowrap}
        .navlink:hover{color:#f3f4f6;background:rgba(255,255,255,0.05)}
        .icobtn{width:30px;height:30px;border-radius:7px;border:none;cursor:pointer;background:transparent;color:#9ca3af;display:flex;align-items:center;justify-content:center}
        .icobtn:hover{background:rgba(255,255,255,0.06);color:#f3f4f6}
        .hub-overlay{position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.62);display:flex;justify-content:flex-end}
        .hub-panel{width:min(430px,100%);height:100%;background:#0e1118;border-left:1px solid rgba(255,255,255,.1);box-shadow:-18px 0 50px rgba(0,0,0,.35);display:flex;flex-direction:column;color:#f3f4f6}
        .hub-header{display:flex;justify-content:space-between;align-items:flex-start;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.08)}
        .hub-kicker{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#d99332;font-weight:700;margin-bottom:5px}.hub-header h2{font-size:21px;letter-spacing:-.03em}
        .hub-close{border:0;background:transparent;color:#9ca3af;font-size:25px;line-height:1;cursor:pointer;padding:0 2px}.hub-close:hover{color:#f3f4f6}
        .hub-tabs{display:flex;padding:0 14px;border-bottom:1px solid rgba(255,255,255,.08)}.hub-tab{padding:11px 10px;border:0;border-bottom:2px solid transparent;background:transparent;color:#9ca3af;font-size:12px;font-weight:600;cursor:pointer}.hub-tab.active{color:#d99332;border-bottom-color:#d99332}
        .hub-content{padding:18px 20px;overflow:auto}.hub-form-title{font-size:15px;font-weight:700;margin-bottom:5px}.hub-note{font-size:11px;color:#9ca3af;margin-bottom:18px}.hub-form label{display:flex;flex-direction:column;gap:6px;color:#9ca3af;font-size:11px;margin-bottom:12px}.hub-form input{height:38px;border:1px solid rgba(255,255,255,.12);border-radius:6px;background:#151a22;color:#f3f4f6;padding:0 10px;font:inherit;font-size:13px;outline:none}.hub-form input:focus{border-color:#d99332}.hub-primary{width:100%;height:38px;border:0;border-radius:6px;background:#d99332;color:#fff;font-size:12px;font-weight:700;cursor:pointer}.hub-primary:disabled{opacity:.55;cursor:wait}.hub-message{margin-top:12px;padding:9px 10px;border-radius:5px;background:rgba(217,147,50,.1);color:#e6ad4c;font-size:11px}.hub-row{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.07)}.hub-row div:last-child{text-align:right}.hub-row strong{display:block;font-size:12px;text-transform:capitalize}.hub-row span{display:block;color:#9ca3af;font-size:10px;margin-top:3px}.hub-status{color:#d99332!important}.hub-status.completed{color:#2fb879!important}.hub-status.failed{color:#d95c5c!important}.hub-empty{padding:28px 0;color:#9ca3af;font-size:12px;text-align:center}.hub-chat{padding-top:40px}
      `}</style>

      {showTraderHub && <div className="hub-overlay" onMouseDown={e => e.target === e.currentTarget && setShowTraderHub(false)}><TraderHub activeTab={hubTab} setActiveTab={setHubTab} onClose={() => setShowTraderHub(false)}/></div>}

      <div style={{ display:'flex', flexDirection:'column', height:'100dvh', background:'#0b0d14', color:'#f3f4f6', fontFamily:"'DM Sans',sans-serif", overflow:'hidden' }}>

        {/* ══ BANNER ══ */}
        {showBanner && (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 14px', background:'#1a1f35', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:'#d99332', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:700 }}>Get the AlphaFx App</div>
              <div style={{ fontSize:10, color:'#9ca3af' }}>Get a better trading experience</div>
            </div>
            <button style={{ padding:'4px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.2)', background:'transparent', color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer' }}>Download</button>
            <button onClick={() => setShowBanner(false)} style={{ width:20, height:20, borderRadius:4, border:'none', background:'rgba(255,255,255,0.08)', color:'#9ca3af', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}

        {/* ══ DESKTOP NAV ══ */}
        <div className="d-nav" style={{ alignItems:'center', gap:2, padding:'0 14px', height:50, background:'#0e1118', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
          {/* Logo */}
          <div style={{ width:34, height:34, borderRadius:9, background:'#d99332', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginRight:6 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </div>
          {/* Nav links */}
          {[
            [<svg key="h" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>,"Trader's Hub"],
            [<svg key="d" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,"Deposit"],
            [<svg key="w" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 11 12 6 7 11"/><line x1="12" y1="18" x2="12" y2="6"/></svg>,"Withdraw"],
            [<svg key="hi" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,"History"],
            [<svg key="c" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,"Chat"],
          ].map(([icon, label]) => (
            <button key={label} className="navlink" onClick={() => label === "Trader's Hub" && setShowTraderHub(true)}>{icon}{label}</button>
          ))}
          {/* TO trader badge */}
          <button style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:8, background:'#d99332', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', border:'none', flexShrink:0, marginLeft:4 }}>
            <span style={{ width:18, height:18, borderRadius:4, background:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:800 }}>TO</span>
            AlphaFx Trader
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div style={{ flex:1 }}/>
          {/* Right controls */}
          <button className="icobtn" onClick={() => setMuted(m=>!m)}><SoundIcon/></button>
          <button className="icobtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg></button>
          {/* Balance */}
          <div style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.08)', color:'#9ca3af', fontSize:12, margin:'0 6px', cursor:'pointer' }}>
            <span style={{ width:17, height:17, borderRadius:4, background:'#ff4757', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, flexShrink:0 }}>R</span>
            <span style={{ fontWeight:700, color:'#f3f4f6', fontSize:13 }}>$ {balance.toFixed(2)}</span>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <button style={{ padding:'6px 16px', borderRadius:8, border:'none', cursor:'pointer', background:'#d99332', color:'#fff', fontSize:13, fontWeight:700 }}>Deposit</button>
          <button style={{ background:'transparent', border:'none', cursor:'pointer', color:'#9ca3af', padding:'0 6px', position:'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            <span style={{ position:'absolute', top:-3, right:2, width:14, height:14, borderRadius:'50%', background:'#ff4757', color:'#fff', fontSize:8, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>2</span>
          </button>
          <div style={{ width:30, height:30, borderRadius:'50%', background:'#d99332', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, cursor:'pointer', marginLeft:4 }}>
            {user?.name?.[0]?.toUpperCase()||'T'}
          </div>
        </div>

        {/* ══ MOBILE NAV ══ */}
        <div className="m-nav" style={{ alignItems:'center', gap:6, padding:'0 10px', height:44, background:'#0e1118', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
          <button style={{ background:'transparent', border:'none', cursor:'pointer', color:'#9ca3af', padding:3 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div style={{ width:27, height:27, borderRadius:'50%', background:'#d99332', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>
            {user?.name?.[0]?.toUpperCase()||'T'}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 7px', borderRadius:7, border:'1px solid rgba(255,255,255,0.1)', background:'#151a22' }}>
            <span style={{ width:16, height:16, borderRadius:4, background:'#ff4757', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, flexShrink:0 }}>R</span>
            <span style={{ fontSize:12, fontWeight:700 }}>$ {balance.toFixed(2)}</span>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div style={{ flex:1 }}/>
          <button onClick={() => setMuted(m=>!m)} className="icobtn"><SoundIcon/></button>
          <button style={{ padding:'5px 12px', borderRadius:7, border:'none', background:'#d99332', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>Deposit</button>
          <button style={{ background:'transparent', border:'none', cursor:'pointer', color:'#9ca3af', padding:3 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
          </button>
        </div>

        {/* ══ MOBILE TRADE TABS ══ */}
        <div className="m-tabs" style={{ overflow:'hidden', background:'#0b0d14', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
          {[['Matches/Differs','match-differ'],['Even/Odd','even-odd'],['Over/Under','over-under']].map(([label,val]) => (
            <button key={val} className={`tab-btn ${mobileTradeType===label?'act':''}`} onClick={() => { setMobileTradeType(label); setTradeType(val) }}>
              {val==='match-differ'&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>}
              {val==='even-odd'&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>}
              {val==='over-under'&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg>}
              {label}
            </button>
          ))}
        </div>

        {/* ══ MOBILE LAYOUT ══ */}
        <div className="m-layout" style={{ flex:1, flexDirection:'column', overflow:'hidden', minHeight:0, width:'100%' }}>
          {/* chart toolbar */}
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'0 6px', height:34, background:'#0b0d14', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
            <div style={{ position:'relative', flexShrink:0 }} ref={mobileMarketDropRef}>
              <button onClick={() => setShowMarketDrop(d=>!d)} style={{ display:'flex', alignItems:'center', gap:4, border:'none', background:'transparent', cursor:'pointer', color:'#f3f4f6' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/></svg>
                <span style={{ fontSize:12, fontWeight:700 }}>{market.short}</span>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {showMarketDrop && <MktDropdown markets={MARKETS} market={market} setMarket={setMarket} setShowMarketDrop={setShowMarketDrop}/>}
            </div>
            <span style={{ fontSize:12, fontWeight:700 }}>{displayPrice.toFixed(2)}</span>
            <span style={{ fontSize:10, fontWeight:600, color:priceChangePos?'#00c97b':'#ff4757' }}>{priceChangePos?'+':''}{priceChange}%</span>
            <span style={{ width:6, height:6, borderRadius:'50%', background:connected?'#00c97b':'#fbbf24', display:'inline-block', flexShrink:0 }}/>
            <div style={{ flex:1 }}/>
            <span style={{ padding:'2px 7px', borderRadius:4, background:'#151a22', color:'#9ca3af', fontSize:10, fontWeight:600 }}>100%</span>
          </div>
          {/* canvas */}
          <div style={{ flex:1, position:'relative', overflow:'hidden', minHeight:0, width:'100%' }}>
            <div style={{ position:'absolute', left:6, bottom:8, display:'flex', flexDirection:'column', gap:3, zIndex:10 }}>
              {['+','−'].map(s => <button key={s} style={{ width:22, height:22, borderRadius:5, border:'1px solid rgba(255,255,255,0.1)', background:'#151a22', color:'#f3f4f6', fontSize:15, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>{s}</button>)}
            </div>
            <PriceChart ticks={ticks} mockTicks={mockTicks}/>
          </div>
          <DigitRow ticks={ticks} mockTicks={mockTicks} size={30}/>
        </div>

        {/* ══ MOBILE BOTTOM ══ */}
        <div className="m-bnav" style={{ flexDirection:'column' }}>
          {bottomTab==='trade' && (
            <div className="ns" style={{ background:'#0e1118', overflowY:'auto', maxHeight:'46vh', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
              <TradePanel tradeType={tradeType} setTradeType={setTradeType} autoMode={autoMode} setAutoMode={setAutoMode} stake={stake} setStake={setStake} payout={payout} placeTrade={placeTrade}/>
            </div>
          )}
          {bottomTab==='positions' && (
            <div className="ns" style={{ background:'#0e1118', overflowY:'auto', maxHeight:'46vh', borderTop:'1px solid rgba(255,255,255,0.07)', padding:10 }}>
              {openPos.length===0&&closedPos.length===0
                ? <div style={{ textAlign:'center', color:'#515c72', fontSize:12, padding:'24px 0' }}>No positions yet.</div>
                : [...openPos,...closedPos].map(p => (
                    <div key={p.id} style={{ marginBottom:6, padding:10, borderRadius:8, background:'#151a22', border:'1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                        <span style={{ fontSize:12, fontWeight:700, textTransform:'capitalize', color:p.status==='open'?'#d99332':p.status==='won'?'#00c97b':'#ff4757' }}>{p.type} {p.status!=='open'&&`— ${p.status}`}</span>
                        <span style={{ fontSize:10, color:'#515c72' }}>{p.time}</span>
                      </div>
                      {p.status==='open'
                        ? <div style={{ fontSize:11, color:'#9ca3af' }}>Stake ${p.stake} → ${p.payout} <span style={{ color:'#fbbf24' }}>Pending…</span></div>
                        : <div style={{ fontSize:13, fontWeight:700, color:p.profit>0?'#00c97b':'#ff4757' }}>{p.profit>0?'+':''}{p.profit?.toFixed(2)} USD</div>
                      }
                    </div>
                  ))
              }
            </div>
          )}
          {/* Bottom nav bar */}
          <div style={{ display:'flex', background:'#0e1118', borderTop:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
            {[['trade','Trade',<svg key="t" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/></svg>],
              ['positions','Positions',<svg key="p" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>]
            ].map(([key,label,icon]) => (
              <button key={key} className={`bnav-btn ${bottomTab===key?'act':''}`} onClick={() => setBottomTab(key)}>{icon}{label}</button>
            ))}
          </div>
        </div>

        {/* ══ DESKTOP 3-COLUMN SHELL ══ */}
        <div className="desk-shell" style={{ flex:1, overflow:'hidden', minHeight:0 }}>

          {/* LEFT: icon strip + positions sidebar */}
          <div style={{ width:256, flexShrink:0, display:'flex', background:'#0e1118', borderRight:'1px solid rgba(255,255,255,0.07)', overflow:'hidden' }}>
            {/* Icon strip */}
            <div style={{ width:38, flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', paddingTop:10, gap:5, borderRight:'1px solid rgba(255,255,255,0.07)', background:'#0b0d14' }}>
              <div style={{ width:24, height:24, borderRadius:6, background:'#151a22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:'#9ca3af', marginBottom:8 }}>1T</div>
              {[
                <svg key="a" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/></svg>,
                <svg key="b" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="18" y="12" width="4" height="9"/></svg>,
                <svg key="c" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
                <svg key="d" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
              ].map((icon,i) => <button key={i} className="icobtn">{icon}</button>)}
            </div>
            {/* Positions panel */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <PositionsList openPos={openPos} closedPos={closedPos} tab={desktopPosTab} setTab={setDesktopPosTab}/>
            </div>
          </div>

          {/* CENTER: chart */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0, background:'#0b0d14' }}>
            {/* Toolbar */}
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 12px', height:48, background:'#0b0d14', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
              <div style={{ position:'relative', flexShrink:0 }} ref={marketDropRef}>
                <button onClick={() => setShowMarketDrop(d=>!d)} style={{ display:'flex', alignItems:'center', gap:8, border:'none', background:'transparent', cursor:'pointer', color:'#f3f4f6' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/></svg>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700 }}>{market.label}</div>
                    <div style={{ fontSize:10, color:priceChangePos?'#00c97b':'#ff4757', display:'flex', alignItems:'center', gap:4 }}>
                      {displayPrice.toFixed(2)} &nbsp;{priceChangePos?'+':''}{priceChange}%
                      <span style={{ width:5, height:5, borderRadius:'50%', background:connected?'#00c97b':'#fbbf24', display:'inline-block' }}/>
                      {connected ? '↗' : ''}
                    </div>
                  </div>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {showMarketDrop && <MktDropdown markets={MARKETS} market={market} setMarket={setMarket} setShowMarketDrop={setShowMarketDrop}/>}
              </div>
              <div style={{ flex:1 }}/>
              <span style={{ padding:'3px 9px', borderRadius:5, background:'#151a22', color:'#9ca3af', fontSize:11, fontWeight:600 }}>100%</span>
            </div>
            {/* Canvas */}
            <div style={{ flex:1, position:'relative', overflow:'hidden', minHeight:0 }}>
              <div style={{ position:'absolute', left:10, bottom:14, display:'flex', flexDirection:'column', gap:4, zIndex:10 }}>
                {['+','−'].map(s => <button key={s} style={{ width:26, height:26, borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', background:'#151a22', color:'#f3f4f6', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>{s}</button>)}
              </div>
              <PriceChart ticks={ticks} mockTicks={mockTicks}/>
            </div>
            <DigitRow ticks={ticks} mockTicks={mockTicks} size={50}/>
          </div>

          {/* RIGHT: trade panel */}
          <div className="ns" style={{ width:268, flexShrink:0, overflowY:'auto', background:'#0e1118', borderLeft:'1px solid rgba(255,255,255,0.07)' }}>
            <TradePanel tradeType={tradeType} setTradeType={setTradeType} autoMode={autoMode} setAutoMode={setAutoMode} stake={stake} setStake={setStake} payout={payout} placeTrade={placeTrade}/>
          </div>

        </div>

      </div>
    </>
  )
}
