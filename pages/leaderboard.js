import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { sounds } from '../lib/sound'
import Mascot from '../components/Mascot'
import { ChevronLeft, RotateCw, Flame, Crown, Trophy, Zap, Sparkles } from 'lucide-react'

const AVATAR_COLORS = [
  ['#A78BFA', '#8B5CF6'], ['#FCD34D', '#F59E0B'], ['#34D399', '#10B981'],
  ['#FB7185', '#E11D48'], ['#60A5FA', '#3B82F6'], ['#FB923C', '#EA580C'],
]

function getAvatarColor(name) {
  const idx = (name?.charCodeAt(0) || 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

export default function Leaderboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [board, setBoard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('vq_user')
    if (!stored) { router.push('/'); return }
    setUser(JSON.parse(stored))
    loadLeaderboard()
  }, [])

  async function loadLeaderboard() {
    setLoading(true)
    const { data } = await supabase.rpc('get_leaderboard')
    if (data) setBoard(data)
    setLoading(false)
  }

  const top3 = board.slice(0, 3)
  const rest = board.slice(3)

  return (
    <>
      <Head><title>Leaderboard · VocabQuest</title></Head>
      <div style={s.page}>
        <div className="container">
          <div style={s.header}>
            <Link href="/dashboard" style={s.back}><ChevronLeft size={18} /> Back</Link>
            <button onClick={() => { sounds.click(); loadLeaderboard() }} style={s.refresh}><RotateCw size={16} /></button>
          </div>
          <h1 style={s.h1}><Trophy size={28} color="#FCD34D" /> Leaderboard</h1>

          {loading ? (
            <div style={s.loadBox}>
              <div style={s.spinner} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : board.length === 0 ? (
            <div style={s.empty}>
              <Mascot size={120} mood="sad" />
              <p style={s.emptyText}>No heroes yet — be the first!</p>
              <Link href="/quiz" className="chunk-btn chunk-btn-primary" style={{maxWidth: 240, margin: '0 auto'}}>Take a quiz</Link>
            </div>
          ) : (
            <>
              {/* Podium */}
              {top3.length >= 1 && (
                <div style={s.podium}>
                  {/* 2nd */}
                  {top3[1] && (
                    <PodiumSlot rank={2} player={top3[1]} isMe={user?.id === top3[1].user_id} />
                  )}
                  {/* 1st */}
                  {top3[0] && (
                    <PodiumSlot rank={1} player={top3[0]} isMe={user?.id === top3[0].user_id} />
                  )}
                  {/* 3rd */}
                  {top3[2] && (
                    <PodiumSlot rank={3} player={top3[2]} isMe={user?.id === top3[2].user_id} />
                  )}
                </div>
              )}

              {/* Rest of list */}
              {rest.length > 0 && (
                <div style={s.list}>
                  {rest.map((row, i) => {
                    const rank = i + 4
                    const isMe = user?.id === row.user_id
                    const [c1, c2] = getAvatarColor(row.name)
                    return (
                      <div key={row.user_id} style={{...s.row, ...(isMe ? s.rowMe : {})}}>
                        <span style={s.rankNum}>#{rank}</span>
                        <div style={{...s.avatar, background: `linear-gradient(135deg, ${c1}, ${c2})`}}>
                          {row.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={s.nameCol}>
                          <p style={s.name}>{row.name} {isMe && <span style={s.youTag}>you</span>}</p>
                          <p style={s.subline}><Flame size={12} color="#FB923C" /> {row.streak || 0} • <Zap size={12} color="#A78BFA" /> {row.tests_taken}</p>
                        </div>
                        <span style={s.pts}>{row.total_points}<span style={s.ptsLbl}> xp</span></span>
                      </div>
                    )
                  })}
                </div>
              )}

              <Link href="/quiz" className="chunk-btn chunk-btn-primary" style={{marginTop: 24}}>
                <Sparkles size={18} /> Take a quiz
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}

function PodiumSlot({ rank, player, isMe }) {
  const [c1, c2] = getAvatarColor(player.name)
  const heights = { 1: 130, 2: 100, 3: 80 }
  const bgs = { 1: 'linear-gradient(180deg, #FCD34D, #F59E0B)', 2: 'linear-gradient(180deg, #CBD5E1, #94A3B8)', 3: 'linear-gradient(180deg, #FB923C, #EA580C)' }
  const labels = { 1: '#0F0E17', 2: '#0F0E17', 3: '#fff' }
  const icons = { 1: '👑', 2: '🥈', 3: '🥉' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
      {rank === 1 && <div style={{ fontSize: 28, marginBottom: -8, zIndex: 2 }}>{icons[1]}</div>}
      <div style={{
        width: rank === 1 ? 76 : 62,
        height: rank === 1 ? 76 : 62,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: rank === 1 ? 30 : 24, fontWeight: 900, color: '#0F0E17',
        marginBottom: 8, border: '3px solid var(--bg)',
        boxShadow: isMe ? '0 0 0 3px var(--purple)' : 'none'
      }}>
        {player.name.charAt(0).toUpperCase()}
      </div>
      <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 2, textAlign: 'center', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.name}</p>
      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--yellow)', marginBottom: 8 }}>{player.total_points} XP</p>
      <div style={{
        width: '85%', height: heights[rank], background: bgs[rank], borderRadius: '14px 14px 0 0',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 12,
        fontSize: rank === 1 ? 28 : 22, fontWeight: 900, color: labels[rank]
      }}>
        {rank}
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', paddingBottom: '60px', paddingTop: '20px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
  back: { display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-2)', fontSize: '14px', fontWeight: 700 },
  refresh: { width: 36, height: 36, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  h1: { fontSize: '28px', fontWeight: 900, letterSpacing: '-1px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: 10 },
  loadBox: { padding: '60px 0', display: 'flex', justifyContent: 'center' },
  spinner: { width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--purple)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  empty: { textAlign: 'center', padding: '40px 20px' },
  emptyText: { color: 'var(--text-2)', marginTop: 16, marginBottom: 20, fontSize: 15, fontWeight: 700 },
  podium: { display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '24px', padding: '0 8px' },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  row: { display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '12px 16px' },
  rowMe: { borderColor: 'var(--purple)', background: 'var(--purple-bg)' },
  rankNum: { fontSize: 14, fontWeight: 800, color: 'var(--text-3)', width: 32, fontFamily: 'DM Mono' },
  avatar: { width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#0F0E17', flexShrink: 0 },
  nameCol: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 },
  youTag: { fontSize: 10, fontWeight: 800, color: 'var(--purple)', background: 'var(--purple-bg)', border: '1px solid var(--purple)', borderRadius: 6, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.06em' },
  subline: { fontSize: 12, color: 'var(--text-3)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 },
  pts: { fontSize: 18, fontWeight: 900, color: 'var(--yellow)', letterSpacing: '-0.5px' },
  ptsLbl: { fontSize: 12, color: 'var(--text-3)', fontFamily: 'DM Mono', fontWeight: 500 },
}