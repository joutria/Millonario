// React import not required with new JSX transform

type Props = {
    question: {
        pregunta: string
        opciones: string[]
        respuesta: number
    }
    onAnswer: (index: number) => void
    hiddenIndices?: number[] | null
    selectedIndex?: number | null
    result?: 'correct' | 'wrong' | null
    correctIndex?: number
    disabled?: boolean
}

export default function Questions({ question, onAnswer, hiddenIndices, selectedIndex = null, result = null, correctIndex, disabled = false }: Props) {
    return (
        <div className='Question'>
            <p>{question.pregunta}</p>
            <ul>
                {question.opciones.map((answer, index) => {
                    const hidden = hiddenIndices?.includes(index)
                    // determine classes depending on feedback
                    const classes = ['button', 'answer-button']
                    if (selectedIndex === index && result === 'correct') classes.push('answer-correct')
                    if (selectedIndex === index && result === 'wrong') classes.push('answer-wrong')
                    // when wrong, also highlight correct answer
                    if (result === 'wrong' && correctIndex === index) classes.push('answer-correct')

                    return (
                        <li key={index} style={{ listStyle: 'none', margin: 6 }}>
                            <button
                                onClick={() => onAnswer(index)}
                                disabled={!!hidden || disabled}
                                className={classes.join(' ')}
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