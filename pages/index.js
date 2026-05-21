import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { sounds } from '../lib/sound'
import Mascot from '../components/Mascot'
import Head from 'next/head'
import { Sparkles, Trophy, Flame } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin(e) {
    e.preventDefault()
    if (!name.trim()) return
    sounds.click(); setLoading(true); setError('')
    const { data, error: err } = await supabase
      .from('users')
      .upsert({ name: name.trim() }, { onConflict: 'name' })
      .select().single()
    if (err) { setError('Connection failed. Check Supabase.'); setLoading(false); return }
    localStorage.setItem('vq_user', JSON.stringify(data))
    router.push('/dashboard')
  }

  return (
    <>
      <Head><title>VocabQuest</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <div style={s.page}>
        <div className="container" style={{textAlign: 'center'}}>
          <div style={s.mascotWrap}><Mascot size={140} /></div>
          <h1 style={s.title}>Vocab<span style={s.titleAccent}>Quest</span></h1>
          <p style={s.sub}>Master words. Battle friends.<br/>Become a legend.</p>
          <div style={s.featureRow}>
            <Feature icon={<Sparkles size={20} />} text="AI quizzes" color="#A78BFA" />
            <Feature icon={<Flame size={20} />} text="Streaks" color="#FB923C" />
            <Feature icon={<Trophy size={20} />} text="Compete" color="#FCD34D" />
          </div>
          <form onSubmit={handleJoin} style={s.form}>
            <input
              style={s.input}
              type="text"
              placeholder="What's your name, hero?"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={30}
              autoFocus
            />
            <button className="chunk-btn chunk-btn-primary" type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Entering...' : "Let's go →"}
            </button>
          </form>
          {error && <p style={s.error}>{error}</p>}
        </div>
      </div>
    </>
  )
}

function Feature({ icon, text, color }) {
  return <div style={{...s.feature, color}}>{icon}<span style={s.featureText}>{text}</span></div>
}

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' },
  mascotWrap: { marginBottom: 24 },
  title: { fontSize: 46, fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.05 },
  titleAccent: { color: 'var(--yellow)' },
  sub: { color: 'var(--text-2)', fontSize: 16, marginTop: 12, marginBottom: 28, lineHeight: 1.5, fontWeight: 600 },
  featureRow: { display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 32 },
  feature: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  featureText: { fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  input: { background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 16, padding: '18px 20px', color: 'var(--text)', fontSize: 16, fontWeight: 600, width: '100%', textAlign: 'center' },
  error: { color: 'var(--red)', fontSize: 14, marginTop: 16, fontWeight: 700 },
}