import { useEffect, useState } from 'react'
import './App.css'
import Questions from './components/Questions'
import Helpers from './components/Helpers'

type Question = {
  pregunta: string
  opciones: string[]
  respuesta: number
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
  const [enable5050, setEnable5050] = useState(true)
  const [enableCall, setEnableCall] = useState(true)
  const [enablePublic, setEnablePublic] = useState(true)
  // temporizador
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState<number>(30)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  // estado de la partida
  const [started, setStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  // feedback de respuesta
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answerResult, setAnswerResult] = useState<'correct' | 'wrong' | null>(null)
  const [isChecking, setIsChecking] = useState(false)

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
    setCurrentIndex(0)
    setScore(0)
    setGameOver(false)
    setUsed5050(false)
    setUsedCall(false)
    setUsedPublic(false)
    setHiddenBy5050(null)
    setFriendSuggestion(null)
    setPublicPercentages(null)
    // initialize timer
    setTimeLeft(timerEnabled ? timerSeconds : null)
  }

  function use5050() {
    if (!enable5050 || used5050 || gameOver) return
    const q = questions[currentIndex]
    if (!q) return
    // dejar la respuesta correcta y una incorrecta aleatoria
    const incorrectIndices = q.opciones.map((_, i) => i).filter(i => i !== q.respuesta)
    const keep = incorrectIndices[Math.floor(Math.random() * incorrectIndices.length)]
    const toHide = incorrectIndices.filter(i => i !== keep)
    setHiddenBy5050(toHide)
    setUsed5050(true)
  }

  function useCall() {
    if (!enableCall || usedCall || gameOver) return
    const q = questions[currentIndex]
    if (!q) return
    // sugerencia del amigo: 70% prob de decir la correcta
    const prob = Math.random()
    let suggestion: number
    if (prob < 0.7) suggestion = q.respuesta
    else {
      const other = q.opciones.map((_, i) => i).filter(i => i !== q.respuesta)
      suggestion = other[Math.floor(Math.random() * other.length)]
    }
    setFriendSuggestion(suggestion)
    setUsedCall(true)
  }

  function usePublic() {
    if (!enablePublic || usedPublic || gameOver) return
    const q = questions[currentIndex]
    if (!q) return
    // generar porcentajes simuladas, favoreciendo la correcta
    const base = Array(q.opciones.length).fill(5)
    base[q.respuesta] += 60
    // repartir resto ligeramente
    let remaining = 100 - base.reduce((a,b) => a+b, 0)
    while (remaining > 0) {
      const i = Math.floor(Math.random() * q.opciones.length)
      base[i] += 1
      remaining -= 1
    }
    setPublicPercentages(base)
    setUsedPublic(true)
  }

  // countdown effect for timer per question
  useEffect(() => {
    if (!started || gameOver) return
    if (!timerEnabled) return
    // when there's no current question or when a result is set, don't run timer
    const q = questions[currentIndex]
    if (!q) return
    if (answerResult !== null) return

    // initialize timeLeft if null
    setTimeLeft((prev) => (prev === null ? timerSeconds : prev))

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null
        if (prev <= 1) {
          // time out: mark as wrong
          setAnswerResult('wrong')
          setIsChecking(true)
          // stop timer
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [started, currentIndex, timerEnabled, timerSeconds, gameOver, answerResult, questions])

  function handleAnswer(index: number) {
    // only accept an answer if game running and no answer selected yet
    if (gameOver || isChecking || selectedAnswer !== null) return
    const q = questions[currentIndex]
    if (!q) return

    setSelectedAnswer(index)
    setAnswerResult(index === q.respuesta ? 'correct' : 'wrong')
    setIsChecking(true)
  }

  function nextQuestion() {
    // called when user clicks 'Siguiente' after viewing feedback
    const q = questions[currentIndex]
    if (!q) return
    // count score only if correct
    const correct = answerResult === 'correct'
    if (correct) {
      setScore(s => s + 1)
    }

    // advance to next question; if no more questions, finish the game
    const next = currentIndex + 1
    if (next >= questions.length) {
      setGameOver(true)
      setCurrentIndex(next)
      setTimeLeft(null)
    } else {
      setCurrentIndex(next)
      setTimeLeft(timerEnabled ? timerSeconds : null)
      // reset temporary help effects for next question
      setHiddenBy5050(null)
      setFriendSuggestion(null)
      setPublicPercentages(null)
    }

    // reset feedback controls for the new question or final screen
    setSelectedAnswer(null)
    setAnswerResult(null)
    setIsChecking(false)
  }

  function restartGame() {
    // restart with the same settings and (re)shuffle if needed
    if (questions.length === 0) return
    const list = randomize ? shuffle(questions) : [...questions]
    setQuestions(list)
    setStarted(true)
    setCurrentIndex(0)
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
    setCurrentIndex(0)
    setScore(0)
    setHiddenBy5050(null)
    setFriendSuggestion(null)
    setPublicPercentages(null)

    // restore help toggles to defaults
    setEnable5050(true)
    setEnableCall(true)
    setEnablePublic(true)

    // clear used-flags
    setUsed5050(false)
    setUsedCall(false)
    setUsedPublic(false)
  }

  const currentQuestion = questions[currentIndex]

  return (
    <div className='App' style={{ padding: 24 }}>
      <h1>¿Quién quiere ser millonario?</h1>

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
            <p className='title'>Selecciona qué ayudas estarán disponibles (cada una se puede usar 1 vez)</p>
            <label>
              <input
                type='checkbox'
                checked={enable5050}
                onChange={(e) => setEnable5050(e.target.checked)}
              />{' '}
              50/50
            </label>
            <br />
            <label>
              <input
                type='checkbox'
                checked={enableCall}
                onChange={(e) => setEnableCall(e.target.checked)}
              />{' '}
              Llamada a un amigo
            </label>
            <br />
            <label>
              <input
                type='checkbox'
                checked={enablePublic}
                onChange={(e) => setEnablePublic(e.target.checked)}
              />{' '}
              Ayuda del público
            </label>
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
              <p>Pregunta {currentIndex + 1} / {questions.length}</p>
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

          {currentQuestion ? (
            <>
              <Questions
                question={currentQuestion}
                onAnswer={handleAnswer}
                hiddenIndices={hiddenBy5050}
                selectedIndex={selectedAnswer}
                result={answerResult}
                correctIndex={currentQuestion.respuesta}
                disabled={isChecking || gameOver}
              />

              {/* Mostrar botón Siguiente sólo después de haber seleccionado una respuesta */}
              {selectedAnswer !== null && (
                <div style={{ marginTop: 12 }}>
                  <button className='button' onClick={nextQuestion}>Siguiente</button>
                </div>
              )}
            </>
          ) : null}

          <div style={{ marginTop: 12 }} className='helpers-area'>
            <h3>Ayudas</h3>
            <div className='help-buttons'>
              <button className='button' onClick={use5050} disabled={!enable5050 || used5050}>
                50/50 {used5050 ? '(usada)' : ''}
              </button>
              <button className='button' onClick={useCall} disabled={!enableCall || usedCall} style={{ marginLeft: 8 }}>
                Llamada a un amigo {usedCall ? '(usada)' : ''}
              </button>
              <button className='button' onClick={usePublic} disabled={!enablePublic || usedPublic} style={{ marginLeft: 8 }}>
                Ayuda del público {usedPublic ? '(usada)' : ''}
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
