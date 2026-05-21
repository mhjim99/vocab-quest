export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { words, quizType = 'multiple-choice' } = req.body
  if (!words || words.length === 0) return res.status(400).json({ error: 'No words provided' })
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' })

  // Build word list with optional synonym/antonym
  const wordList = words.map(w => {
    let line = `- ${w.word}: ${w.meaning}`
    if (w.synonym) line += ` | synonym: ${w.synonym}`
    if (w.antonym) line += ` | antonym: ${w.antonym}`
    return line
  }).join('\n')

  let prompt

  if (quizType === 'synonym') {
    const wordsWithSyn = words.filter(w => w.synonym && w.synonym.trim())
    if (wordsWithSyn.length === 0) return res.status(400).json({ error: 'No words with synonyms in this batch. Add synonyms first!' })
    prompt = `Generate exactly ${wordsWithSyn.length} synonym-matching multiple-choice questions. Return ONLY valid JSON, no markdown.

Words with synonyms:
${wordsWithSyn.map(w => `- ${w.word} | synonym: ${w.synonym}`).join('\n')}

For each question, ask "Which word is closest in meaning to X?" where X is the synonym, and the correct answer is the word itself. Wrong options come from other words in the list.

Format:
{"questions":[{"question":"Which word is closest in meaning to 'strong, powerful'?","options":["formidable","fragile","silent","weak"],"answer":"formidable","word":"formidable"}]}`
  } else if (quizType === 'antonym') {
    const wordsWithAnt = words.filter(w => w.antonym && w.antonym.trim())
    if (wordsWithAnt.length === 0) return res.status(400).json({ error: 'No words with antonyms in this batch. Add antonyms first!' })
    prompt = `Generate exactly ${wordsWithAnt.length} antonym-matching multiple-choice questions. Return ONLY valid JSON, no markdown.

Words with antonyms:
${wordsWithAnt.map(w => `- ${w.word} | antonym: ${w.antonym}`).join('\n')}

For each question, ask "Which is the opposite of X?" where X is the word, and the correct answer is the antonym. Wrong options come from other antonyms or made-up plausible distractors.

Format:
{"questions":[{"question":"Which is the opposite of 'formidable'?","options":["weak","strong","intimidating","mighty"],"answer":"weak","word":"formidable"}]}`
  } else if (quizType === 'fill-in-gap') {
    prompt = `Create exactly ${words.length} fill-in-the-gap sentence questions from these words. Return ONLY valid JSON, no markdown.

Words:
${wordList}

Each question is a sentence with ONE word replaced by "______". Include a wordBank of 4 options.

Format:
{"questions":[{"question":"The lawyer gave such a ______ argument that the jury changed their opinion.","answer":"compelling","word":"compelling","wordBank":["compelling","fragile","substantial","meticulous"]}]}`
  } else {
    prompt = `Generate ${words.length} multiple-choice quiz questions. Return ONLY valid JSON, no markdown.

Words:
${wordList}

Mix meaning->word and word->meaning. Use other words from list as wrong options.

Format:
{"questions":[{"question":"Which word means X?","options":["a","b","c","d"],"answer":"a","word":"a"}]}`
  }

  const models = ['gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest', 'gemini-2.5-flash']

  for (const model of models) {
    try {
      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8000, responseMimeType: 'application/json' },
      }
      if (model.includes('2.5')) body.generationConfig.thinkingConfig = { thinkingBudget: 0 }
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (data.error) { console.log(`${model}:`, data.error.message); continue }
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!raw) continue
      const clean = raw.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      return res.status(200).json(parsed)
    } catch (err) {
      console.error(`Failed with ${model}:`, err.message)
      continue
    }
  }
  return res.status(500).json({ error: 'All models failed. Wait a minute and retry.' })
}