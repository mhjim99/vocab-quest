import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { sounds } from '../lib/sound'
import Mascot from '../components/Mascot'
import { ChevronLeft, Target, Pencil, BookOpen, Check, X, Trophy, Sparkles, Zap, ArrowLeftRight, Shuffle } from 'lucide-react'

export default function Quiz() {
  const router = useRouter()
  const { batch: batchId } = router.query
  const [user, setUser] = useState(null)
  const [batches, setBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [quizType, setQuizType] = useState('multiple-choice')
  const [stage, setStage] = useState('setup')
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [answers, setAnswers] = useState([])
  const [score, setScore] = useState(0)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('vq_user')
    if (!stored) { router.push('/'); return }
    setUser(JSON.parse(stored))
    loadBatches()
  }, [])

  useEffect(() => {
    if (batchId && batches.length > 0) {
      const b = batches.find(x => x.id === batchId)
      if (b) setSelectedBatch(b)
    }
  }, [batchId, batches])

  async function loadBatches() {
    const { data } = await supabase.from('word_batches').select('id, label').order('created_at', { ascending: false })
    if (data) setBatches(data)
  }

  async function startQuiz() {
    if (!selectedBatch) return
    sounds.click()
    setStage('loading')
    const { data: words } = await supabase.from('words').select('word, meaning, synonym, antonym').eq('batch_id', selectedBatch.id)
    if (!words || words.length === 0) { alert('No words!'); setStage('setup'); return }
    const res = await fetch('/api/generate-quiz', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words, quizType })
    })
    const data = await res.json()
    if (data.error) { alert(data.error); setStage('setup'); return }
    setQuestions(data.questions); setCurrent(0); setAnswers([]); setScore(0); setSelected(null); setRevealed(false); setStage('quiz')
  }

  async function selectAnswer(opt) {
    if (revealed) return
    setSelected(opt)
    setRevealed(true)
    const correct = opt.toLowerCase() === questions[current].answer.toLowerCase()
    if (correct) {
      setScore(s => s + 1)
      sounds.correct()
      const confetti = (await import('canvas-confetti')).default
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 }, colors: ['#A78BFA', '#FCD34D', '#34D399'] })
    } else {
      sounds.wrong()
      setShake(true); setTimeout(() => setShake(false), 500)
    }
    setAnswers(a => [...a, { question: questions[current].question, selected: opt, correct, correctAnswer: questions[current].answer }])
  }

  async function nextQuestion() {
    sounds.click()
    if (current + 1 >= questions.length) {
      await saveScore()
      setStage('result')
      sounds.win()
      const confetti = (await import('canvas-confetti')).default
      const end = Date.now() + 2000
      ;(function frame() {
        confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#A78BFA', '#FCD34D', '#34D399', '#FB7185'] })
        confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#A78BFA', '#FCD34D', '#34D399', '#FB7185'] })
        if (Date.now() < end) requestAnimationFrame(frame)
      })()
    } else {
      setCurrent(c => c + 1); setSelected(null); setRevealed(false)
    }
  }

  async function saveScore() {
    const points = Math.round((score / questions.length) * 100)
    await supabase.from('scores').insert({ user_id: user.id, batch_id: selectedBatch.id, points, correct: score, total: questions.length })
    await supabase.rpc('increment_user_points', { uid: user.id, pts: points })
    await supabase.rpc('update_streak', { uid: user.id })
  }

  const QUIZ_TYPES = [
    { id: 'multiple-choice', icon: <Target size={22} />, name: 'Multiple choice', desc: 'Pick from 4 options', color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.15)' },
    { id: 'fill-in-gap', icon: <Pencil size={22} />, name: 'Fill in the gap', desc: 'Complete the sentence', color: '#FCD34D', bg: 'rgba(252, 211, 77, 0.15)' },
    { id: 'synonym', icon: <Shuffle size={22} />, name: 'Synonym match', desc: 'Find similar words', color: '#34D399', bg: 'rgba(52, 211, 153, 0.15)' },
    { id: 'antonym', icon: <ArrowLeftRight size={22} />, name: 'Antonym match', desc: 'Find opposites', color: '#FB7185', bg: 'rgba(251, 113, 133, 0.15)' },
  ]

  if (stage === 'setup') return (
    <>
      <Head><title>New Quiz · VocabQuest</title></Head>
      <div style={s.page}>
        <div className="container">
          <Link href="/dashboard" style={s.back}><ChevronLeft size={18} /> Back</Link>
          <h1 style={s.h1}>New quiz</h1>

          <p style={s.label}>Quiz type</p>
          <div style={s.typeGrid}>
            {QUIZ_TYPES.map(t => (
              <button key={t.id} style={{...s.typeCard, ...(quizType === t.id ? s.typeCardActive : {})}} onClick={() => { sounds.click(); setQuizType(t.id) }}>
                <div style={{...s.typeIcon, background: t.bg, color: t.color}}>{t.icon}</div>
                <p style={s.typeName}>{t.name}</p>
                <p style={s.typeDesc}>{t.desc}</p>
              </button>
            ))}
          </div>

          <p style={s.label}>Pick a batch</p>
          {batches.length === 0 ? (
            <div style={s.empty}>
              <Mascot size={100} mood="sad" />
              <p style={s.emptyText}>No batches yet</p>
              <Link href="/add-words" className="chunk-btn chunk-btn-primary" style={{maxWidth: 200, margin: '0 auto'}}>Add words</Link>
            </div>
          ) : (
            <div style={s.batchList}>
              {batches.map(b => (
                <button key={b.id} style={{...s.batchRow, ...(selectedBatch?.id === b.id ? s.batchRowActive : {})}} onClick={() => { sounds.click(); setSelectedBatch(b) }}>
                  <div style={{...s.batchIcon, ...(selectedBatch?.id === b.id ? {background: 'var(--purple)', color: '#fff'} : {})}}><BookOpen size={18} /></div>
                  <span style={s.batchName}>{b.label}</span>
                  <div style={{...s.radio, ...(selectedBatch?.id === b.id ? s.radioActive : {})}}>
                    {selectedBatch?.id === b.id && <Check size={14} />}
                  </div>
                </button>
              ))}
            </div>
          )}
          {selectedBatch && (
            <button className="chunk-btn chunk-btn-primary" onClick={startQuiz} style={{marginTop: 12}}>
              <Sparkles size={18} /> Start quiz
            </button>
          )}
        </div>
      </div>
    </>
  )

  if (stage === 'loading') return (
    <div style={s.loadPage}>
      <Mascot size={120} mood="happy" />
      <div style={s.spinner} />
      <p style={s.loadText}>AI is crafting your quiz...</p>
    </div>
  )

  if (stage === 'quiz') {
    const q = questions[current]
    const progress = (current / questions.length) * 100
    const isGap = quizType === 'fill-in-gap'

    const renderQuestion = () => {
      if (isGap) {
        const parts = q.question.split(/_+/)
        return (<p style={s.questionText}>{parts[0]}<span style={s.blank}>{selected || '____'}</span>{parts[1]}</p>)
      }
      return <p style={s.questionText}>{q.question}</p>
    }
    const options = isGap ? q.wordBank : q.options

    return (
      <>
        <Head><title>Quiz · VocabQuest</title></Head>
        <div style={s.page}>
          <div className="container">
            <div style={s.qTop}>
              <button onClick={() => { if (confirm('Exit quiz?')) router.push('/dashboard') }} style={s.qClose}><X size={20} /></button>
              <div style={s.progressTrack}><div style={{...s.progressFill, width: progress + '%'}} /></div>
              <span style={s.qScore}><Zap size={14} /> {score}</span>
            </div>
            <p style={s.qLabel}>Question {current + 1} of {questions.length}</p>

            <div style={s.questionBox} className={shake ? 'shake' : ''}>
              {isGap && <p style={s.gapBadge}>Fill the blank</p>}
              {renderQuestion()}
            </div>

            {isGap ? (
              <div style={s.bankGrid}>
                {options.map((opt, i) => {
                  let style = {...s.wordChip}
                  if (revealed) {
                    if (opt.toLowerCase() === q.answer.toLowerCase()) style = {...style, ...s.wordChipCorrect}
                    else if (opt === selected) style = {...style, ...s.wordChipWrong}
                    else style = {...style, opacity: 0.4}
                  } else if (opt === selected) style = {...style, ...s.wordChipSelected}
                  return <button key={i} style={style} onClick={() => selectAnswer(opt)}>{opt}</button>
                })}
              </div>
            ) : (
              <div style={s.options}>
                {options.map((opt, i) => {
                  let style = {...s.option}; let letterStyle = {...s.optionLetter}
                  if (revealed) {
                    if (opt === q.answer) { style = {...style, ...s.optionCorrect}; letterStyle = {...letterStyle, background: '#34D399', color: '#04231A', borderColor: '#34D399'} }
                    else if (opt === selected) { style = {...style, ...s.optionWrong}; letterStyle = {...letterStyle, background: '#FB7185', color: '#fff', borderColor: '#FB7185'} }
                    else style = {...style, opacity: 0.4}
                  } else if (opt === selected) { style = {...style, ...s.optionSelected}; letterStyle = {...letterStyle, background: '#A78BFA', color: '#fff', borderColor: '#A78BFA'} }
                  return (
                    <button key={i} style={style} onClick={() => selectAnswer(opt)}>
                      <span style={letterStyle}>{String.fromCharCode(65 + i)}</span>
                      <span style={s.optionText}>{opt}</span>
                      {revealed && opt === q.answer && <Check size={20} color="#34D399" />}
                      {revealed && opt === selected && opt !== q.answer && <X size={20} color="#FB7185" />}
                    </button>
                  )
                })}
              </div>
            )}

            {revealed && (
              <div style={s.feedbackBar}>
                <div style={selected?.toLowerCase() === q.answer.toLowerCase() ? s.feedbackOk : s.feedbackBad}>
                  {selected?.toLowerCase() === q.answer.toLowerCase() ? (<><Check size={20} /> Nice one!</>) : (<><X size={20} /> Answer: <strong>{q.answer}</strong></>)}
                </div>
                <button className="chunk-btn chunk-btn-primary" onClick={nextQuestion}>
                  {current + 1 >= questions.length ? 'Finish' : 'Continue'} →
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  if (stage === 'result') {
    const pct = Math.round((score / questions.length) * 100)
    const emoji = pct === 100 ? '🏆' : pct >= 80 ? '🌟' : pct >= 50 ? '👍' : '📚'
    const message = pct === 100 ? 'PERFECT!' : pct >= 80 ? 'AMAZING!' : pct >= 50 ? 'GOOD JOB!' : 'KEEP LEARNING'

    return (
      <>
        <Head><title>Results · VocabQuest</title></Head>
        <div style={s.page}>
          <div className="container">
            <div style={s.resultTop} className="bounce-in">
              <div style={s.trophy}>{emoji}</div>
              <p style={s.resultLabel}>{message}</p>
              <div style={s.resultScore}>{score}<span style={s.resultScoreTotal}>/{questions.length}</span></div>
              <p style={s.resultPct}>{pct}% correct</p>
              <div style={s.xpEarned}><Zap size={16} color="#FCD34D" /><span>+{pct} XP earned</span></div>
            </div>
            <div style={s.reviewSection}>
              <p style={s.reviewTitle}>📋 Review</p>
              {answers.map((a, i) => (
                <div key={i} style={s.reviewRow}>
                  <div style={{...s.reviewIcon, background: a.correct ? '#34D399' : '#FB7185'}}>
                    {a.correct ? <Check size={14} color="#04231A" /> : <X size={14} color="#fff" />}
                  </div>
                  <div style={{flex: 1}}>
                    <p style={s.reviewQ}>{a.question.length > 60 ? a.question.slice(0, 60) + '...' : a.question}</p>
                    {!a.correct && <p style={s.reviewAns}>Answer: <strong>{a.correctAnswer}</strong></p>}
                  </div>
                </div>
              ))}
            </div>
            <Link href="/leaderboard" className="chunk-btn chunk-btn-yellow" style={{textDecoration: 'none', marginBottom: 10}}>
              <Trophy size={18} /> See leaderboard
            </Link>
            <button className="chunk-btn chunk-btn-ghost" onClick={() => { sounds.click(); setStage('setup'); setSelectedBatch(null) }}>Try another batch</button>
          </div>
        </div>
      </>
    )
  }
}

const s = {
  page: { minHeight: '100vh', paddingBottom: 60, paddingTop: 20 },
  back: { display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-2)', fontSize: 14, fontWeight: 700, marginBottom: 16 },
  h1: { fontSize: 32, fontWeight: 900, letterSpacing: '-1px', marginBottom: 28 },
  label: { fontSize: 12, color: 'var(--text-3)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, marginTop: 8 },
  typeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 },
  typeCard: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 18, padding: 16, color: 'var(--text)', textAlign: 'left' },
  typeCardActive: { borderColor: 'var(--purple)', background: 'var(--purple-bg)' },
  typeIcon: { width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  typeName: { fontSize: 14, fontWeight: 800 },
  typeDesc: { fontSize: 12, color: 'var(--text-3)', fontWeight: 600 },
  empty: { textAlign: 'center', padding: '40px 20px' },
  emptyText: { color: 'var(--text-2)', marginTop: 16, marginBottom: 20, fontSize: 15, fontWeight: 700 },
  batchList: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 },
  batchRow: { display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 16, padding: '14px 16px', width: '100%', textAlign: 'left', color: 'var(--text)', fontSize: 15, fontWeight: 700 },
  batchRowActive: { borderColor: 'var(--purple)', background: 'var(--purple-bg)' },
  batchIcon: { width: 36, height: 36, borderRadius: 10, background: 'var(--surface2)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  batchName: { flex: 1 },
  radio: { width: 22, height: 22, borderRadius: '50%', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  radioActive: { background: 'var(--purple)', borderColor: 'var(--purple)', color: '#fff' },
  loadPage: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 },
  spinner: { width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--purple)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadText: { color: 'var(--text-2)', fontSize: 15, fontWeight: 700 },
  qTop: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 },
  qClose: { width: 32, height: 32, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  progressTrack: { flex: 1, height: 12, background: 'var(--surface)', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #A78BFA, #FCD34D)', borderRadius: 6, transition: 'width 0.4s ease' },
  qScore: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 800, color: 'var(--yellow)', background: 'var(--yellow-bg)', padding: '6px 12px', borderRadius: 20, flexShrink: 0 },
  qLabel: { fontSize: 12, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 },
  questionBox: { background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 20, padding: '28px 24px', marginBottom: 20 },
  gapBadge: { display: 'inline-block', background: 'var(--purple-bg)', color: 'var(--purple)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 10px', borderRadius: 8, marginBottom: 14 },
  questionText: { fontSize: 22, fontWeight: 800, lineHeight: 1.4, letterSpacing: '-0.3px', color: 'var(--text)' },
  blank: { display: 'inline-block', minWidth: 100, padding: '2px 14px', margin: '0 4px', borderBottom: '3px solid var(--yellow)', color: 'var(--yellow)', fontWeight: 900, textAlign: 'center' },
  bankGrid: { display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  wordChip: { background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 14, padding: '12px 20px', color: 'var(--text)', fontSize: 15, fontWeight: 700, boxShadow: '0 3px 0 var(--border)' },
  wordChipSelected: { borderColor: 'var(--purple)', background: 'var(--purple-bg)', color: 'var(--purple)', boxShadow: '0 3px 0 var(--purple-dark)' },
  wordChipCorrect: { borderColor: 'var(--green)', background: 'var(--green-bg)', color: 'var(--green)', boxShadow: '0 3px 0 var(--green-dark)' },
  wordChipWrong: { borderColor: 'var(--red)', background: 'var(--red-bg)', color: 'var(--red)', boxShadow: '0 3px 0 var(--red-dark)' },
  options: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 },
  option: { display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 16, padding: '14px 16px', width: '100%', textAlign: 'left', color: 'var(--text)', fontSize: 15, fontWeight: 700, boxShadow: '0 3px 0 var(--border)' },
  optionSelected: { borderColor: 'var(--purple)', background: 'var(--purple-bg)', boxShadow: '0 3px 0 var(--purple-dark)' },
  optionCorrect: { borderColor: 'var(--green)', background: 'var(--green-bg)', boxShadow: '0 3px 0 var(--green-dark)' },
  optionWrong: { borderColor: 'var(--red)', background: 'var(--red-bg)', boxShadow: '0 3px 0 var(--red-dark)' },
  optionLetter: { width: 32, height: 32, background: 'var(--surface2)', border: '2px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, flexShrink: 0, color: 'var(--text)' },
  optionText: { flex: 1 },
  feedbackBar: { background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 18, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 },
  feedbackOk: { display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)', fontSize: 15, fontWeight: 800 },
  feedbackBad: { display: 'flex', alignItems: 'center', gap: 8, color: 'var(--red)', fontSize: 15, fontWeight: 700 },
  resultTop: { textAlign: 'center', padding: '36px 20px 24px' },
  trophy: { fontSize: 80, marginBottom: 12 },
  resultLabel: { color: 'var(--yellow)', fontSize: 16, fontWeight: 900, letterSpacing: '0.15em', marginBottom: 12 },
  resultScore: { fontSize: 80, fontWeight: 900, letterSpacing: '-3px', lineHeight: 1 },
  resultScoreTotal: { color: 'var(--text-3)', fontSize: 44 },
  resultPct: { color: 'var(--text-2)', fontSize: 15, marginTop: 8, marginBottom: 16, fontWeight: 700 },
  xpEarned: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--yellow-bg)', border: '2px solid var(--yellow)', color: 'var(--yellow)', borderRadius: 20, padding: '8px 18px', fontSize: 14, fontWeight: 800 },
  reviewSection: { marginTop: 24, marginBottom: 20 },
  reviewTitle: { fontSize: 14, fontWeight: 800, color: 'var(--text-2)', marginBottom: 10 },
  reviewRow: { display: 'flex', gap: 10, padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 6, alignItems: 'center' },
  reviewIcon: { width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  reviewQ: { fontSize: 13, color: 'var(--text)', fontWeight: 600 },
  reviewAns: { fontSize: 12, color: 'var(--green)', marginTop: 2, fontWeight: 600 },
}