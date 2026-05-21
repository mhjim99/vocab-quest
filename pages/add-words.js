import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { sounds } from '../lib/sound'
import Mascot from '../components/Mascot'
import { ChevronLeft, Save, Sparkles, Check, Info } from 'lucide-react'

export default function AddWords() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [label, setLabel] = useState('')
  const [wordsText, setWordsText] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('vq_user')
    if (!stored) { router.push('/'); return }
    setUser(JSON.parse(stored))
  }, [])

  function parseWords(text) {
    return text.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
      // Support both | (new format with synonym/antonym) and : (old format)
      if (l.includes('|')) {
        const parts = l.split('|').map(p => p.trim())
        return {
          word: parts[0] || '',
          synonym: parts[1] || '',
          antonym: parts[2] || '',
          meaning: parts[3] || '',
        }
      } else if (l.includes(':')) {
        const parts = l.split(':')
        return {
          word: parts[0].trim(),
          synonym: '',
          antonym: '',
          meaning: parts.slice(1).join(':').trim(),
        }
      }
      return null
    }).filter(w => w && w.word && w.meaning)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!label.trim() || !wordsText.trim()) return
    sounds.click()
    const words = parseWords(wordsText)
    if (words.length === 0) { setMsg({ type: 'error', text: 'No valid words. Use: word | synonym | antonym | meaning' }); return }
    setSaving(true); setMsg(null)
    const { data: batch, error: bErr } = await supabase.from('word_batches').insert({ label: label.trim(), created_by: user.id }).select().single()
    if (bErr) { setMsg({ type: 'error', text: 'Failed: ' + bErr.message }); setSaving(false); return }
    const { error: wErr } = await supabase.from('words').insert(words.map(w => ({ ...w, batch_id: batch.id })))
    if (wErr) { setMsg({ type: 'error', text: 'Failed: ' + wErr.message }); setSaving(false); return }
    sounds.correct()
    setMsg({ type: 'success', text: `Saved "${label}" with ${words.length} words!` })
    setLabel(''); setWordsText(''); setSaving(false)
  }

  const preview = parseWords(wordsText)

  return (
    <>
      <Head><title>Add words · VocabQuest</title></Head>
      <div style={s.page}>
        <div className="container">
          <Link href="/dashboard" style={s.back}><ChevronLeft size={18} /> Back</Link>
          <div style={s.header}>
            <div>
              <h1 style={s.h1}>Add words</h1>
              <p style={s.sub}>Build a new vocab batch</p>
            </div>
            <Mascot size={70} mood="happy" float={false} />
          </div>

          <form onSubmit={handleSave} style={s.form}>
            <div>
              <label style={s.label}>Batch name</label>
              <input style={s.input} placeholder="e.g. Day 3 — Animals" value={label} onChange={e => setLabel(e.target.value)} />
            </div>

            <div style={s.formatBox}>
              <p style={s.formatTitle}><Info size={14} /> Format guide</p>
              <p style={s.formatLine}><code style={s.code}>word | synonym | antonym | meaning</code></p>
              <p style={s.formatDesc}>Use <strong>|</strong> (pipe) to separate fields. Synonym & antonym are optional — leave blank if you don't have them.</p>
              <div style={s.exampleBox}>
                <p style={s.exampleTitle}>Examples:</p>
                <code style={s.example}>formidable | strong, powerful | weak | impressive and intimidating</code>
                <code style={s.example}>eloquent | articulate | silent | fluent in speech</code>
                <code style={s.example}>fragile | | | easily broken</code>
              </div>
            </div>

            <div>
              <label style={s.label}>Words</label>
              <textarea
                style={s.textarea}
                placeholder={`formidable | strong, powerful | weak | impressive and intimidating\neloquent | articulate | silent | fluent in speech\nresilience | endurance | weakness | ability to recover quickly`}
                value={wordsText}
                onChange={e => setWordsText(e.target.value)}
                rows={10}
              />
            </div>

            {preview.length > 0 && (
              <div style={s.previewBox}>
                <p style={s.previewTitle}><Sparkles size={14} color="#A78BFA" /> {preview.length} word{preview.length !== 1 ? 's' : ''} detected</p>
                <div style={s.previewList}>
                  {preview.map((w, i) => (
                    <div key={i} style={s.previewCard}>
                      <p style={s.previewWord}>{w.word}</p>
                      <p style={s.previewMeaning}>{w.meaning}</p>
                      {(w.synonym || w.antonym) && (
                        <div style={s.previewTags}>
                          {w.synonym && <span style={s.tagSyn}>≈ {w.synonym}</span>}
                          {w.antonym && <span style={s.tagAnt}>✕ {w.antonym}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {msg && (
              <div style={msg.type === 'error' ? s.errBox : s.okBox}>
                {msg.type === 'success' && <Check size={18} />}
                <span>{msg.text}</span>
              </div>
            )}

            <button className="chunk-btn chunk-btn-primary" type="submit" disabled={saving || !label.trim() || preview.length === 0}>
              {saving ? 'Saving...' : <><Save size={18} /> Save batch</>}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

const s = {
  page: { minHeight: '100vh', paddingBottom: 60, paddingTop: 20 },
  back: { display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-2)', fontSize: 14, fontWeight: 700, marginBottom: 16 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  h1: { fontSize: 28, fontWeight: 900, letterSpacing: '-1px' },
  sub: { color: 'var(--text-2)', fontSize: 14, fontWeight: 600, marginTop: 4 },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  label: { fontSize: 12, color: 'var(--text-3)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' },
  formatBox: { background: 'var(--purple-bg)', border: '2px solid var(--purple)', borderRadius: 16, padding: '14px 16px' },
  formatTitle: { display: 'flex', alignItems: 'center', gap: 6, color: 'var(--purple)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 },
  formatLine: { fontSize: 14, color: 'var(--text)', marginBottom: 6 },
  formatDesc: { fontSize: 12, color: 'var(--text-2)', marginBottom: 10, fontWeight: 600, lineHeight: 1.5 },
  exampleBox: { background: 'var(--bg)', borderRadius: 10, padding: 10 },
  exampleTitle: { fontSize: 11, color: 'var(--text-3)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' },
  example: { display: 'block', fontFamily: 'DM Mono', fontSize: 11, color: 'var(--text-2)', padding: '3px 0', lineHeight: 1.5 },
  code: { fontFamily: 'DM Mono', background: 'var(--bg)', padding: '2px 8px', borderRadius: 6, fontSize: 12, color: 'var(--yellow)' },
  input: { background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 14, padding: '14px 16px', color: 'var(--text)', fontSize: 15, fontWeight: 600, width: '100%' },
  textarea: { background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 14, padding: '14px 16px', color: 'var(--text)', fontSize: 13, width: '100%', resize: 'vertical', lineHeight: 1.7, fontFamily: 'DM Mono' },
  previewBox: { background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 16, padding: 14 },
  previewTitle: { fontSize: 12, color: 'var(--purple)', fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.06em' },
  previewList: { display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' },
  previewCard: { background: 'var(--bg)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--border)' },
  previewWord: { fontSize: 15, fontWeight: 800, color: 'var(--yellow)', marginBottom: 2 },
  previewMeaning: { fontSize: 13, color: 'var(--text-2)', fontWeight: 600, lineHeight: 1.4 },
  previewTags: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tagSyn: { fontSize: 11, padding: '2px 8px', background: 'var(--green-bg)', color: 'var(--green)', borderRadius: 6, fontWeight: 700 },
  tagAnt: { fontSize: 11, padding: '2px 8px', background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 6, fontWeight: 700 },
  errBox: { background: 'var(--red-bg)', border: '2px solid var(--red)', color: 'var(--red)', borderRadius: 14, padding: '12px 16px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 },
  okBox: { background: 'var(--green-bg)', border: '2px solid var(--green)', color: 'var(--green)', borderRadius: 14, padding: '12px 16px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 },
}