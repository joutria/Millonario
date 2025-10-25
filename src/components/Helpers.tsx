// React import not required with new JSX transform
type Props = {
    // note: we don't need the pre-start enabled flags here; Helpers shows used-state only
    used5050?: boolean
    usedCall?: boolean
    usedPublic?: boolean
    friendSuggestion?: number | null
    publicPercentages?: number[] | null
}

export default function Helpers({ used5050, usedCall, usedPublic, friendSuggestion, publicPercentages }: Props) {
    return (
        <div className='helpers-box card' style={{ marginTop: 8 }}>
            <h4>Ayudas</h4>
            {/* Mostrar solo las ayudas que ya se usaron durante la partida; las selecciones previas no se muestran */}
            <ul>
                {used5050 && <li>50/50 (usada)</li>}
                {usedCall && <li>Llamada a un amigo {friendSuggestion ? `(sugirió: ${friendSuggestion})` : '(usada)'}</li>}
                {usedPublic && <li>Ayuda del público (usada)</li>}
                {!used5050 && !usedCall && !usedPublic && <li>No se han usado ayudas todavía.</li>}
            </ul>
            {publicPercentages && (
                <div>
                    <p>Resultados de la público:</p>
                    <ul>
                        {publicPercentages.map((p, i) => (
                            <li key={i}>{i}: {p}%</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}