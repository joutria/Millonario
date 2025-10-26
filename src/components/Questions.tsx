import React from 'react'

type Props = {
    question: {
        pregunta: string
        opciones?: string[]
        tipo?: string
        // allow respuesta to be string for open/completa or boolean/number
        respuesta?: string | number | boolean
    }
    onAnswer: (correct: boolean, userAnswer?: string) => void
    hiddenIndices?: number[] | null
    disabled?: boolean
    result?: { answered: boolean, correct: boolean, userAnswer?: string } | null
}

export default function Questions({ question, onAnswer, hiddenIndices, disabled = false }: Props) {
    // local state for inputs
    const [text, setText] = React.useState('')
    const [submittedOpen, setSubmittedOpen] = React.useState(false)
    const [juradoDecision, setJuradoDecision] = React.useState<'correct' | 'wrong' | null>(null)
    const [chosenIndex, setChosenIndex] = React.useState<number | null>(null)
    const [submittedChoice, setSubmittedChoice] = React.useState(false)

    // reset local state when question changes
    React.useEffect(() => {
        setText('')
        setSubmittedOpen(false)
        setChosenIndex(null)
        setSubmittedChoice(false)
    }, [question])

    // If opciones has entries -> multiple-choice list (respuesta is index)
    if (question.opciones && question.opciones.length > 0) {
        // multiple choice: show choices; when user selects, reveal correct and chosen
        const correctIndex = typeof question.respuesta === 'number' ? question.respuesta : null
        return (
            <div className='Question'>
                <p>{question.pregunta}</p>
                <ul>
                    {question.opciones.map((answer: string, index: number) => {
                        const hidden = hiddenIndices?.includes(index)
                        const classes = ['button', 'answer-button']
                        let className = classes.join(' ')

                        // apply coloring after submission
                        if (submittedChoice && chosenIndex !== null) {
                            if (index === correctIndex) className += ' answer-correct'
                            if (index === chosenIndex && chosenIndex !== correctIndex) className += ' answer-wrong'
                        }

                        return (
                            <li key={index} style={{ listStyle: 'none', margin: 6 }}>
                                <button
                                    onClick={() => {
                                        if (disabled || !!hidden || submittedChoice) return
                                        setChosenIndex(index)
                                        setSubmittedChoice(true)
                                        const isCorrect = correctIndex !== null && index === correctIndex
                                        onAnswer(isCorrect)
                                    }}
                                    disabled={!!hidden || disabled || submittedChoice}
                                    className={className}
                                >
                                    {answer} {hidden ? ' (eliminada)' : ''}
                                </button>
                            </li>
                        )
                    })}
                </ul>
            </div>
        )
    }

    // If opciones is empty -> free text input
    // 'completa' -> we can auto-compare against question.respuesta
    const tipo = (question.tipo || '').toLowerCase()
    if (tipo.includes('completa')) {
        return (
            <div className='Question'>
                <p>{question.pregunta}</p>
                <div>
                    <input className='answer-input' value={text} onChange={(e) => setText(e.target.value)} />
                    <button className='button' style={{ marginLeft: 8 }} onClick={() => onAnswer(String(text).trim().toLowerCase() === String(question.respuesta).trim().toLowerCase(), text)} disabled={disabled}>Confirmar</button>
                </div>
            </div>
        )
    }

    // For other empty-opciones questions (abierta / analisis / pregunta abierta): input + jury confirm
    return (
        <div className='Question'>
            <p>{question.pregunta}</p>
            {!submittedOpen ? (
                <div>
                    <textarea className='answer-input' value={text} onChange={(e) => setText(e.target.value)} rows={4} style={{ width: '100%' }} />
                    <div style={{ marginTop: 8 }}>
                        <button className='button' onClick={() => setSubmittedOpen(true)}>Confirmar respuesta</button>
                    </div>
                </div>
            ) : (
                <div>
                    <p><strong>Respuesta del participante:</strong></p>
                    <div style={{ whiteSpace: 'pre-wrap', background: '#0f0f0f', padding: 8, borderRadius: 6 }}>{text}</div>
                    <p style={{ marginTop: 8 }}><strong>Respuesta esperada:</strong> {question.respuesta || <em>(no provista)</em>}</p>
                        <div style={{ marginTop: 8 }}>
                            <button
                                className={`button ${juradoDecision === 'correct' ? 'answer-correct' : ''}`}
                                onClick={() => { if (!juradoDecision) { setJuradoDecision('correct'); onAnswer(true, text) } }}
                                disabled={!!juradoDecision}
                            >
                                Jurado: Correcto
                            </button>
                            <button
                                className={`button ${juradoDecision === 'wrong' ? 'answer-wrong' : ''}`}
                                style={{ marginLeft: 8 }}
                                onClick={() => { if (!juradoDecision) { setJuradoDecision('wrong'); onAnswer(false, text) } }}
                                disabled={!!juradoDecision}
                            >
                                Jurado: Incorrecto
                            </button>
                        </div>
                </div>
            )}
        </div>
    )
}