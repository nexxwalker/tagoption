'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email:'', password:'' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focus, setFocus] = useState('')

  const handleSubmit = async () => {
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return }
    setError(''); setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    const stored = localStorage.getItem('alphafx_user')
    if (!stored) localStorage.setItem('alphafx_user', JSON.stringify({ name:'Trader', email:form.email }))
    router.push('/dashboard')
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'#090b10', color:'#e2e8f0', fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .log-panel{display:flex;width:44%;flex-shrink:0;flex-direction:column;justify-content:center;
          padding:60px 56px;background:linear-gradient(145deg,#3a2414 0%,#d99332 55%,#5a3216 100%);
          position:relative;overflow:hidden;min-height:100vh}
        @media(max-width:680px){.log-panel{display:none}}
        .log-form-wrap{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
          padding:40px 24px;overflow-y:auto;min-height:100vh}
        .log-input{width:100%;padding:12px 14px 12px 42px;border-radius:12px;background:#141828;
          color:#e2e8f0;font-size:14px;outline:none;transition:border-color 0.2s;font-family:inherit}
        .log-input:focus{border-color:#d99332}
        .log-btn{width:100%;padding:14px;border-radius:12px;background:#d99332;color:#fff;
          font-weight:700;font-size:15px;border:none;cursor:pointer;transition:opacity 0.2s;font-family:inherit}
        .log-btn:disabled{opacity:0.65;cursor:not-allowed}
        .log-btn:hover:not(:disabled){opacity:0.9}
        .log-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#515c72;pointer-events:none;display:flex}
      `}</style>

      {/* LEFT PANEL — desktop only */}
      <div className="log-panel">
        <div style={{ position:'absolute',top:'15%',left:'10%',width:300,height:300,borderRadius:'50%',background:'rgba(255,255,255,0.06)',filter:'blur(60px)',pointerEvents:'none' }}/>
        <div style={{ position:'absolute',bottom:'8%',right:'-8%',width:220,height:220,borderRadius:'50%',background:'rgba(255,255,255,0.04)',filter:'blur(40px)',pointerEvents:'none' }}/>

        <Link href="/" style={{ display:'flex',alignItems:'center',gap:10,textDecoration:'none',marginBottom:64,position:'relative' }}>
          <div style={{ width:36,height:36,borderRadius:10,background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </div>
          <span style={{ fontWeight:700,fontSize:18,color:'#fff' }}>AlphaFx</span>
        </Link>

        <h2 style={{ fontSize:30,fontWeight:700,color:'#fff',marginBottom:14,lineHeight:1.25,position:'relative' }}>Welcome back,<br/>trader</h2>
        <p style={{ fontSize:14,color:'rgba(255,255,255,0.7)',marginBottom:40,lineHeight:1.7,position:'relative' }}>
          Your portfolio is waiting. Log in to check your positions and keep trading.
        </p>

        {['Real-time Deriv market data','Even / Odd, Match / Differ, Over / Under','Auto and manual trading modes','Instant trade execution'].map(item => (
          <div key={item} style={{ display:'flex',alignItems:'center',gap:12,marginBottom:16,position:'relative' }}>
            <div style={{ width:22,height:22,borderRadius:'50%',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span style={{ fontSize:14,color:'rgba(255,255,255,0.8)' }}>{item}</span>
          </div>
        ))}
      </div>

      {/* RIGHT — form */}
      <div className="log-form-wrap">
        {/* Mobile logo */}
        <div style={{ width:'100%',maxWidth:380,marginBottom:28 }}>
          <Link href="/" style={{ display:'inline-flex',alignItems:'center',gap:8,textDecoration:'none',color:'inherit' }}>
            <div style={{ width:30,height:30,borderRadius:8,background:'#d99332',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            </div>
            <span style={{ fontWeight:700,fontSize:16 }}>AlphaFx</span>
          </Link>
        </div>

        <div style={{ width:'100%',maxWidth:380 }}>
          <h1 style={{ fontSize:24,fontWeight:700,marginBottom:6 }}>Welcome back</h1>
          <p style={{ fontSize:14,color:'#8892a4',marginBottom:28 }}>Sign in to your account to continue trading</p>

          {/* Email */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block',fontSize:12,fontWeight:600,color:'#8892a4',marginBottom:6 }}>Email</label>
            <div style={{ position:'relative' }}>
              <span className="log-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={e=>setForm(f=>({...f,email:e.target.value}))}
                onFocus={()=>setFocus('email')} onBlur={()=>setFocus('')}
                className="log-input" style={{ border:`1.5px solid ${focus==='email'?'#d99332':'rgba(255,255,255,0.08)'}` }}/>
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom:24 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}>
              <label style={{ fontSize:12,fontWeight:600,color:'#8892a4' }}>Password</label>
              <a href="#" style={{ fontSize:12,color:'#d99332',textDecoration:'none' }}>Forgot password?</a>
            </div>
            <div style={{ position:'relative' }}>
              <span className="log-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></span>
              <input type={showPass?'text':'password'} placeholder="Your password" value={form.password}
                onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                onFocus={()=>setFocus('password')} onBlur={()=>setFocus('')}
                onKeyDown={e=>e.key==='Enter'&&handleSubmit()}
                className="log-input" style={{ border:`1.5px solid ${focus==='password'?'#d99332':'rgba(255,255,255,0.08)'}`,paddingRight:44 }}/>
              <button onClick={()=>setShowPass(s=>!s)} style={{ position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#515c72',display:'flex',padding:0 }}>
                {showPass
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {error && (
            <div style={{ marginBottom:16,padding:'10px 14px',borderRadius:10,background:'rgba(255,71,87,0.1)',border:'1px solid rgba(255,71,87,0.25)',color:'#ff4757',fontSize:13 }}>{error}</div>
          )}

          <button onClick={handleSubmit} disabled={loading} className="log-btn" style={{ marginBottom:20 }}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>

          <p style={{ textAlign:'center',fontSize:14,color:'#8892a4' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color:'#d99332',fontWeight:600,textDecoration:'none' }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
