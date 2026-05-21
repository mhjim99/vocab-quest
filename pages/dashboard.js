import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import { sounds } from '../lib/sound'
import Mascot from '../components/Mascot'
import { Trophy, Flame, Zap, Plus, LogOut, ChevronRight, Sparkles, BookOpen } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({ totalTests: 0, totalPoints: 0, rank: '-', streak: 0 })
  const [batches, setBatches] = useState([])

  useEffect(() => {
    const stored = localStorage.getItem('vq_user')
    if (!stored) { router.push('/'); return }
    const u = JSON.parse(stored)
    setUser(u)
    loadStats(u.id)
    loadBatches()
  }, [])

  async function loadStats(userId) {
    const { data: u } = await supabase.from('users').select('streak, total_points').eq('id', userId).single()
    const { data: sc } = await supabase.from('scores').select('points').eq('user_id', userId)
    const { data: all } = await supabase.rpc('get_leaderboard')
    const idx = all?.findIndex(r => r.user_id === userId) ?? -1
    setStats({
      totalTests: sc?.length || 0,
      totalPoints: u?.total_points || 0,
      streak: u?.streak || 0,
      rank: idx >= 0 ? `#${idx + 1}` : '-'
    })
  }

  async function loadBatches() {
    const { data } = await supabase.from('word_batches').select('id, label, created_at').order('created_at', { ascending: false }).limit(5)
    if (data) setBatches(data)
  }

  function logout() { sounds.click(); localStorage.removeItem('vq_user'); router.push('/') }

  if (!user) return null

  const xpToNext = Math.ceil(stats.totalPoints / 100) * 100 || 100
  const xpProgress = (stats.totalPoints % 100)

  return (
    <>
      <Head><title>Dashboard · VocabQuest</title></Head>
      <div style={s.page}>
        <div className="container">
          <header style={s.header}>
            <div style={s.userBox}>
              <div style={s.avatar}>{user.name.charAt(0).toUpperCase()}</div>
              <div>
                <p style={s.hello}>Hey hero,</p>
                <p style={s.name}>{user.name}</p>
              </div>
            </div>
            <button onClick={logout} style={s.iconBtn}><LogOut size={18} /></button>
          </header>

          {/* XP Bar */}
          <div style={s.xpBox}>
            <div style={s.xpHeader}>
              <span style={s.xpLevel}>Level {Math.floor(stats.totalPoints / 100) + 1}</span>
              <span style={s.xpCount}>{stats.totalPoints} / {xpToNext} XP</span>
            </div>
            <div style={s.xpTrack}>
              <div style={{...s.xpFill, width: `${xpProgress}%`}} />
            </div>
          </div>

          {/* Stat cards */}
          <div style={s.statGrid}>
            <StatCard icon={<Flame size={22} />} value={stats.streak} label="Day streak" color="#FB923C" bg="rgba(251, 146, 60, 0.12)" />
            <StatCard icon={<Trophy size={22} />} value={stats.rank} label="Rank" color="#FCD34D" bg="rgba(252, 211, 77, 0.12)" />
            <StatCard icon={<Zap size={22} />} value={stats.totalTests} label="Quizzes" color="#A78BFA" bg="rgba(167, 139, 250, 0.12)" />
          </div>

          {/* Main quiz CTA */}
          <Link href="/quiz" style={{textDecoration: 'none'}}>
            <div style={s.heroCard}>
              <div style={s.heroLeft}>
                <p style={s.heroEyebrow}>Ready?</p>
                <h2 style={s.heroTitle}>Start a quiz</h2>
                <p style={s.heroDesc}>AI-powered • Earn XP • Climb ranks</p>
              </div>
              <div style={s.heroRight}>
                <Mascot size={80} mood="wink" float={false} />
              </div>
            </div>
          </Link>

          <div style={s.actionRow}>
            <Link href="/leaderboard" style={s.actionBtn}>
              <Trophy size={22} color="#FCD34D" />
              <span style={s.actionText}>Leaderboard</span>
              <ChevronRight size={18} color="var(--text-3)" />
            </Link>
            <Link href="/add-words" style={s.actionBtn}>
              <Plus size={22} color="#A78BFA" />
              <span style={s.actionText}>Add words</span>
              <ChevronRight size={18} color="var(--text-3)" />
            </Link>
          </div>

          {batches.length > 0 && (
            <div style={s.section}>
              <h3 style={s.sectionTitle}>📚 Recent batches</h3>
              <div style={s.batchList}>
                {batches.map(b => (
                  <Link key={b.id} href={`/quiz?batch=${b.id}`} style={s.batchRow}>
                    <div style={s.batchIcon}><BookOpen size={18} /></div>
                    <div style={s.batchInfo}>
                      <p style={s.batchLabel}>{b.label}</p>
                      <p style={s.batchDate}>{new Date(b.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <ChevronRight size={18} color="var(--text-3)" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function StatCard({ icon, value, label, color, bg }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '16px 12px', textAlign: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{label}</div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', paddingBottom: '60px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 24px' },
  userBox: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: 44, height: 44, borderRadius: '14px', background: 'linear-gradient(135deg, #A78BFA, #FCD34D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#0F0E17' },
  hello: { fontSize: 12, color: 'var(--text-3)', fontWeight: 700 },
  name: { fontSize: 17, fontWeight: 800, color: 'var(--text)' },
  iconBtn: { width: 40, height: 40, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  xpBox: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '16px 18px', marginBottom: '14px' },
  xpHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' },
  xpLevel: { fontSize: 14, fontWeight: 800, color: 'var(--yellow)' },
  xpCount: { fontSize: 12, color: 'var(--text-3)', fontWeight: 700, fontFamily: 'DM Mono' },
  xpTrack: { height: 10, background: 'var(--bg)', borderRadius: 5, overflow: 'hidden' },
  xpFill: { height: '100%', background: 'linear-gradient(90deg, #A78BFA, #FCD34D)', borderRadius: 5, transition: 'width 0.5s' },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' },
  heroCard: { background: 'linear-gradient(135deg, #A78BFA, #8B5CF6)', borderRadius: '24px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', boxShadow: '0 6px 0 #6D28D9', cursor: 'pointer' },
  heroLeft: { color: '#fff' },
  heroEyebrow: { fontSize: 12, fontWeight: 800, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 },
  heroTitle: { fontSize: 26, fontWeight: 900, letterSpacing: '-1px', marginBottom: 6 },
  heroDesc: { fontSize: 13, opacity: 0.85, fontWeight: 600 },
  heroRight: { flexShrink: 0 },
  actionRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '32px' },
  actionBtn: { display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '14px 16px', color: 'var(--text)' },
  actionText: { fontSize: 14, fontWeight: 700, flex: 1 },
  section: { marginBottom: '24px' },
  sectionTitle: { fontSize: 14, fontWeight: 800, color: 'var(--text-2)', marginBottom: '12px' },
  batchList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  batchRow: { display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '14px 16px', color: 'var(--text)' },
  batchIcon: { width: 36, height: 36, borderRadius: 10, background: 'var(--purple-bg)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  batchInfo: { flex: 1 },
  batchLabel: { fontSize: 15, fontWeight: 700, marginBottom: 2 },
  batchDate: { fontSize: 12, color: 'var(--text-3)', fontWeight: 600 },
}