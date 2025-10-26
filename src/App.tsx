import { useEffect, useState, useCallback } from 'react'
import './App.css'
import Questions from './components/Questions'
import Helpers from './components/Helpers'

type Question = {
  pregunta: string
  opciones?: string[]
  tipo?: string
  respuesta?: string | number | boolean
}

function shuffle<T>(arr: T[]) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function App() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)

  // configuracion previa a iniciar
  const [randomize, setRandomize] = useState(true)
  // número de usos permitidos para cada ayuda (-1 = infinito, 0 = desactivada)
  const [uses5050, setUses5050] = useState(1)
  const [usesCall, setUsesCall] = useState(1)
  const [usesPublic, setUsesPublic] = useState(1)
  // contadores de usos restantes
  const [remaining5050, setRemaining5050] = useState(uses5050)
  const [remainingCall, setRemainingCall] = useState(usesCall)
  const [remainingPublic, setRemainingPublic] = useState(usesPublic)
  // temporizador
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState<number>(30)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  // estado de la partida
  const [started, setStarted] = useState(false)
  // in abrecajas mode we let user pick questions by index
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null)
  const [answeredStatus, setAnsweredStatus] = useState<{ answered: boolean, correct: boolean, userAnswer?: string }[]>([])
  // const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  // feedback de respuesta (se usan ahora por pregunta individual en Questions)

  // ayudas usadas (solo se pueden usar una vez)
  const [used5050, setUsed5050] = useState(false)
  const [usedCall, setUsedCall] = useState(false)
  const [usedPublic, setUsedPublic] = useState(false)

  // efectos temporales de ayudas
  const [hiddenBy5050, setHiddenBy5050] = useState<number[] | null>(null)
  const [friendSuggestion, setFriendSuggestion] = useState<number | null>(null)
  const [publicPercentages, setPublicPercentages] = useState<number[] | null>(null)

  // cargar preguntas (pre-carga, antes de iniciar) para mostrar opciones
  useEffect(() => {
    setLoading(true)
    fetch('questions.json')
      .then((res) => res.json())
      .then((data: Question[]) => {
        setQuestions(data)
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  function startGame() {
    if (questions.length === 0) return
    const list = randomize ? shuffle(questions) : [...questions]
    setQuestions(list)
    setStarted(true)
    // sequential index not used in abrecajas mode
    setSelectedQuestionIndex(null)
    // initialize answered status
    setAnsweredStatus(list.map(() => ({ answered: false, correct: false })))
    setScore(0)
    setGameOver(false)
    setUsed5050(false)
    setUsedCall(false)
    setUsedPublic(false)
    setHiddenBy5050(null)
    setFriendSuggestion(null)
    setPublicPercentages(null)
    // restore help use counts
    setRemaining5050(uses5050)
    setRemainingCall(usesCall)
    setRemainingPublic(usesPublic)
    // initialize timer
    setTimeLeft(timerEnabled ? timerSeconds : null)
  }

  function use5050() {
    if (uses5050 === 0 || gameOver) return
    if (remaining5050 === 0 && uses5050 !== -1) return
    if (selectedQuestionIndex === null) return
    const q = questions[selectedQuestionIndex]
    if (!q) return
    // dejar la respuesta correcta y una incorrecta aleatoria
    if (!q.opciones || typeof q.respuesta !== 'number') return
    const incorrectIndices = (q.opciones || []).map((_, i) => i).filter(i => i !== q.respuesta)
    const keep = incorrectIndices[Math.floor(Math.random() * incorrectIndices.length)]
    const toHide = incorrectIndices.filter(i => i !== keep)
    setHiddenBy5050(toHide)
    setUsed5050(true)
    if (uses5050 !== -1) {
      setRemaining5050(prev => Math.max(0, prev - 1))
    }
  }

  function useCall() {
    if (usesCall === 0 || gameOver) return
    if (remainingCall === 0 && usesCall !== -1) return
    if (selectedQuestionIndex === null) return
    const q = questions[selectedQuestionIndex]
    if (!q) return
    // sugerencia del amigo: 70% prob de decir la correcta
    const prob = Math.random()
    let suggestion: number
    if (typeof q.respuesta !== 'number' || !q.opciones) return
    if (prob < 0.7) suggestion = q.respuesta
    else {
      const other = (q.opciones || []).map((_, i) => i).filter(i => i !== q.respuesta)
      suggestion = other[Math.floor(Math.random() * other.length)]
    }
    setFriendSuggestion(suggestion)
    setUsedCall(true)
    if (usesCall !== -1) {
      setRemainingCall(prev => Math.max(0, prev - 1))
    }
  }

  function usePublic() {
    if (usesPublic === 0 || gameOver) return
    if (remainingPublic === 0 && usesPublic !== -1) return
    if (selectedQuestionIndex === null) return
    const q = questions[selectedQuestionIndex]
    if (!q) return
    // generar porcentajes simuladas, favoreciendo la correcta
    if (!q.opciones || typeof q.respuesta !== 'number') return
    const base = Array((q.opciones || []).length).fill(5)
    base[Number(q.respuesta)] += 60
    // repartir resto ligeramente
    let remaining = 100 - base.reduce((a,b) => a+b, 0)
    while (remaining > 0) {
      const i = Math.floor(Math.random() * (q.opciones || []).length)
      base[i] += 1
      remaining -= 1
    }
    setPublicPercentages(base)
    setUsedPublic(true)
    if (usesPublic !== -1) {
      setRemainingPublic(prev => Math.max(0, prev - 1))
    }
  }

  // unified handler when a question is answered in abrecajas mode
  const handleQuestionAnswer = useCallback((correct: boolean, userAnswer?: string) => {
    if (gameOver) return
    if (selectedQuestionIndex === null) return
    const idx = selectedQuestionIndex
    setAnsweredStatus(prev => {
      const copy = [...prev]
      copy[idx] = { answered: true, correct, userAnswer }
      return copy
    })
    if (correct) setScore(s => s + 1)
    // keep the panel open; stop the timer for this question
    setTimeLeft(null)
    // check if all answered
    setTimeout(() => {
      setAnsweredStatus(prev => {
        const allDone = prev.every(p => p.answered)
        if (allDone) setGameOver(true)
        return prev
      })
    }, 50)
  }, [gameOver, selectedQuestionIndex])

  // countdown effect for timer per question
  useEffect(() => {
    // run timer for currently selected question in abrecajas mode
    if (!started || gameOver) return
    if (!timerEnabled) return
    if (selectedQuestionIndex === null) return
    const q = questions[selectedQuestionIndex]
    if (!q) return
    // don't run while answering (we rely on answerResult state for previous flow)
    // initialize timeLeft if null
    setTimeLeft((prev) => (prev === null ? timerSeconds : prev))

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null
        if (prev <= 1) {
          // time out: mark as wrong for the selected question
          handleQuestionAnswer(false, '')
          return 0
        }
        return prev - 1
      })
    }, 1000)

      return () => clearInterval(interval)
    }, [started, selectedQuestionIndex, timerEnabled, timerSeconds, gameOver, questions, handleQuestionAnswer])

  // (sequential nextQuestion no longer used in abrecajas mode)

  function restartGame() {
    // restart with the same settings and (re)shuffle if needed
    if (questions.length === 0) return
    const list = randomize ? shuffle(questions) : [...questions]
    setQuestions(list)
    setStarted(true)
    // sequential index not used in abrecajas mode
    setScore(0)
    setGameOver(false)
    setUsed5050(false)
    setUsedCall(false)
    setUsedPublic(false)
    setHiddenBy5050(null)
    setFriendSuggestion(null)
    setPublicPercentages(null)
    setTimeLeft(timerEnabled ? timerSeconds : null)
  }

  function resetGame() {
    // Vaciar preguntas inmediatamente y recargar desde archivo para evitar que
    // la partida siga mostrando la lista anterior si el fetch tarda.
    setQuestions([])
    setLoading(true)
    fetch('questions.json')
      .then(res => res.json())
      .then((data: Question[]) => setQuestions(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))

    // reset UI state
    setStarted(false)
    setGameOver(false)
  // sequential index not used in abrecajas mode
    setScore(0)
    setHiddenBy5050(null)
    setFriendSuggestion(null)
    setPublicPercentages(null)

    // restore help uses to defaults
    setUses5050(1)
    setUsesCall(1)
    setUsesPublic(1)
    setRemaining5050(1)
    setRemainingCall(1)
    setRemainingPublic(1)

    // clear used-flags and effects
    setUsed5050(false)
    setUsedCall(false)
    setUsedPublic(false)
    setHiddenBy5050(null)
    setFriendSuggestion(null)
    setPublicPercentages(null)
  }

  

  return (
    <div className='App' style={{ padding: 24 }}>
      <h1>¿Quién quiere ser sabio?</h1>

      {!started && (
        <div className='card config-card'>
          <div style={{ marginTop: 8 }}>
            <label>
              <input type='checkbox' checked={timerEnabled} onChange={(e) => setTimerEnabled(e.target.checked)} />{' '}
              Usar temporizador por pregunta
            </label>
            {timerEnabled && (
              <div style={{ marginTop: 8 }}>
                <label>
                  Segundos (30-90):{' '}
                  <input type='number' min={30} max={90} value={timerSeconds} onChange={(e) => {
                    const v = Number(e.target.value)
                    if (Number.isNaN(v)) return
                    const clamped = Math.max(30, Math.min(90, Math.floor(v)))
                    setTimerSeconds(clamped)
                  }} />
                </label>
              </div>
            )}
          </div>
          <div>
            <label>
              <input
                type='checkbox'
                checked={randomize}
                onChange={(e) => setRandomize(e.target.checked)}
              />{' '}
              Preguntas aleatorias
            </label>
          </div>

          <div>
            <p className='title'>Configura los usos disponibles para cada ayuda</p>
            <div className='help-config'>
              <div>
                <label>50/50:</label>
                <select 
                  value={uses5050} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    setUses5050(val)
                    setRemaining5050(val)
                  }}
                >
                  <option value="0">Desactivado</option>
                  <option value="-1">Usos infinitos</option>
                  {[1,2,3,4,5].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'uso' : 'usos'}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ marginTop: 8 }}>
                <label>Llamada a un amigo:</label>
                <select 
                  value={usesCall}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    setUsesCall(val)
                    setRemainingCall(val)
                  }}
                >
                  <option value="0">Desactivado</option>
                  <option value="-1">Usos infinitos</option>
                  {[1,2,3,4,5].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'uso' : 'usos'}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ marginTop: 8 }}>
                <label>Ayuda del público:</label>
                <select 
                  value={usesPublic}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    setUsesPublic(val)
                    setRemainingPublic(val)
                  }}
                >
                  <option value="0">Desactivado</option>
                  <option value="-1">Usos infinitos</option>
                  {[1,2,3,4,5].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'uso' : 'usos'}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12 }} className='controls'>
            <button className='button primary' onClick={startGame} disabled={loading || questions.length === 0}>
              Iniciar juego
            </button>
            <button className='button' onClick={() => { fetch('questions.json').then(r=>r.json()).then((d:Question[])=>setQuestions(d)) }} style={{ marginLeft: 8 }}>
              Recargar preguntas
            </button>
            {loading && <p>Cargando preguntas...</p>}
          </div>
        </div>
      )}

      {started && !gameOver && (
        <div className='game-area'>
          <div className='topbar' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p>Selecciona la pregunta que quieras responder</p>
              <p>Puntuación: {score}</p>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {timerEnabled && timeLeft !== null && (
                  (() => {
                    const ratio = timerSeconds > 0 ? (timeLeft / timerSeconds) : 0
                    let cls = 'timer-green'
                    if (ratio <= 0.33) cls = 'timer-red'
                    else if (ratio <= 0.66) cls = 'timer-yellow'
                    return (
                      <div className={`timer ${cls}`}>
                        Tiempo: {timeLeft}s
                      </div>
                    )
                  })()
                )}
                <button className='button' onClick={resetGame}>Salir / Reiniciar</button>
              </div>
            </div>
          </div>

          {/* grid/list of questions (hidden when a question is selected) */}
          {selectedQuestionIndex === null && (
            <div className='card' style={{ marginTop: 12, padding: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                {questions.map((q, i) => {
                  const tipo = (q.tipo || (q.opciones ? 'Seleccion multiple' : 'Abierta'))
                  const status = answeredStatus[i]
                  let cls = 'button'
                  if (status?.answered) cls += status.correct ? ' answer-correct' : ' answer-wrong'
                  // Determine question type class
                  const tipoLower = tipo.toLowerCase()
                  let questionTypeClass = ''
                  if (tipoLower.includes('seleccion')) questionTypeClass = 'question-type-seleccion'
                  else if (tipoLower.includes('completa')) questionTypeClass = 'question-type-completa'
                  else if (tipoLower === 'analisis') questionTypeClass = 'question-type-analisis'
                  else if (tipoLower.includes('sinonimos')) questionTypeClass = 'question-type-sinonimos'
                  else if (tipoLower.includes('abierta')) questionTypeClass = 'question-type-abierta'

                  return (
                    <div key={i} style={{ borderRadius: 8, padding: 8 }}>
                      <button 
                        className={`${cls} ${questionTypeClass}`} 
                        onClick={() => { 
                          setSelectedQuestionIndex(i); 
                          setHiddenBy5050(null); 
                          setFriendSuggestion(null); 
                          setPublicPercentages(null); 
                        }} 
                        disabled={status?.answered} 
                        style={{ width: '100%', textAlign: 'left' }}
                      >
                        <div style={{ fontWeight: 700 }}>#{i + 1}</div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{tipo}</div>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* selected question panel */}
          {selectedQuestionIndex !== null && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Pregunta #{selectedQuestionIndex + 1}</h3>
                <div>
                  <button className='button' onClick={() => { setSelectedQuestionIndex(null); setTimeLeft(timerEnabled ? timerSeconds : null) }}>Volver al panel</button>
                </div>
              </div>
              <Questions
                question={questions[selectedQuestionIndex]}
                onAnswer={(correct, userAnswer) => handleQuestionAnswer(correct, userAnswer)}
                hiddenIndices={hiddenBy5050}
                disabled={false}
                result={answeredStatus[selectedQuestionIndex] ?? null}
              />
            </div>
          )}

          {/* helpers area is still available while playing */}
          <div style={{ marginTop: 12 }} className='helpers-area'>
            <h3>Ayudas</h3>
            <div className='help-buttons'>
              <button 
                className='button' 
                onClick={use5050} 
                disabled={uses5050 === 0 || (remaining5050 === 0 && uses5050 !== -1)}
              >
                50/50 {uses5050 !== -1 && ` (${remaining5050}/${uses5050})`}
              </button>
              <button 
                className='button' 
                onClick={useCall} 
                disabled={usesCall === 0 || (remainingCall === 0 && usesCall !== -1)}
                style={{ marginLeft: 8 }}
              >
                Llamada a un amigo {usesCall !== -1 && ` (${remainingCall}/${usesCall})`}
              </button>
              <button 
                className='button' 
                onClick={usePublic} 
                disabled={usesPublic === 0 || (remainingPublic === 0 && usesPublic !== -1)}
                style={{ marginLeft: 8 }}
              >
                Ayuda del público {usesPublic !== -1 && ` (${remainingPublic}/${usesPublic})`}
              </button>
            </div>

            <Helpers
              used5050={used5050}
              usedCall={usedCall}
              usedPublic={usedPublic}
              friendSuggestion={friendSuggestion}
              publicPercentages={publicPercentages}
            />
          </div>
        </div>
      )}

      {/* Pantalla final simplificada (sin ayudas) */}
      {started && gameOver && (
        <div className='card' style={{ textAlign: 'center', marginTop: 16 }}>
          <h2>Fin del juego</h2>
          <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>Puntuación final: {score} / {questions.length}</p>
          <div style={{ marginTop: 16 }}>
            <button className='button primary' onClick={restartGame}>Recomenzar</button>
            <button className='button' style={{ marginLeft: 8 }} onClick={resetGame}>Volver a configuración</button>
          </div>
        </div>
      )}
    </div>
  )
}
