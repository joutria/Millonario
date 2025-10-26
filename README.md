# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    # Sabio — ¿Quién quiere ser sabio?

    Proyecto de ejemplo (React + TypeScript + Vite) que implementa un juego tipo "¿Quién quiere ser sabio?".

    Este README explica cómo ejecutar el proyecto, las opciones del juego, el formato de preguntas y notas útiles para desarrolladores.

    ## Contenido

    - Descripción
    - Ejecutar en desarrollo / construir
    - Cómo jugar y opciones
    - Archivo de preguntas
    - Comportamiento de las ayudas
    - Temporizador
    - Pantalla final
    - Contribuciones y mejoras sugeridas

    ## Descripción

    Sabio es una implementación simple del popular formato de preguntas y respuestas. Las preguntas se cargan desde `public/questions.json`. El jugador puede configurar:

    - Si las preguntas serán mostradas en orden o aleatoriamente.
    - Qué ayudas estarán disponibles (50/50, Llamada a un amigo, Ayuda del público).
    - Si se usa un temporizador por pregunta y cuántos segundos (entre 30 y 90).

    ## Ejecutar y construir

    Requisitos: Node.js y npm.

    En PowerShell (Windows):

    ```powershell
    cd "d:\Users\joutria\Documents\Git projects\Sabio"
    npm install
    npm run dev    # ejecuta Vite en modo desarrollo
    ```

    Para compilar para producción:

    ```powershell
    npm run build
    npm run preview   # opcional: previsualizar la build
    ```

    ## Cómo jugar

    1. Abre la app en el navegador (Vite mostrará la URL al arrancar `npm run dev`).
    2. En la pantalla de configuración puedes:
       - Activar "Preguntas aleatorias".
       - Seleccionar qué ayudas estarán disponibles (cada ayuda solo puede usarse 1 vez por partida).
       - Activar el temporizador y elegir los segundos (entre 30 y 90).
    3. Pulsa "Iniciar juego".
    4. Por cada pregunta:
       - Selecciona una respuesta.
       - Aparecerá feedback: la respuesta correcta se pintará de verde; la incorrecta, de naranja; el usuario puede revisar y pulsar "Siguiente" para continuar.
       - Si el temporizador está activado y llega a 0 antes de responder, la pregunta se marca como errada automáticamente.
    5. Al finalizar (cuando no quedan preguntas) verás una pantalla final limpia con tu puntuación y las opciones de "Recomenzar" o "Volver a configuración".

    ## Archivo de preguntas

    Las preguntas se encuentran en `public/questions.json` y tienen este formato:

    ```json
    [
      {
        "pregunta": "¿Cuál es la capital de Francia?",
        "opciones": ["Madrid", "París", "Roma", "Berlín"],
        "respuesta": 1
      }
    ]
    ```

    - `pregunta`: texto de la pregunta.
    - `opciones`: array de strings con las posibles respuestas.
    - `respuesta`: índice (0-based) de la respuesta correcta dentro de `opciones`.

    ## Comportamiento de las ayudas

    - 50/50: elimina dos respuestas incorrectas (la pregunta muestra las opciones restantes). Solo usable una vez por partida.
    - Llamada a un amigo: sugiere una respuesta. Tiene una probabilidad aproximada del 70% de indicar la respuesta correcta. Solo usable una vez por partida.
    - Ayuda del público: genera porcentajes simulados favoreciendo la opción correcta. Solo usable una vez por partida.

    ### Notas sobre uso de ayudas

    - Las ayudas deben seleccionarse (activarse/desactivarse) en la pantalla de configuración antes de iniciar la partida.
    - Durante la partida, cada ayuda mostrará su resultado y quedará marcada como usada.

    ## Temporizador

    - Puedes activar el temporizador por pregunta y elegir entre 30 y 90 segundos.
    - El temporizador se muestra en la barra superior. Tiene un estilo "semáforo": verde al inicio, amarillo cuando queda ~66% o menos, y rojo al llegar a ~33% o menos.
    - Si el temporizador llega a cero antes de responder, la pregunta se marca como errada y el usuario puede continuar con "Siguiente".

    ## Pantalla final

    - La pantalla final es intencionalmente limpia: no muestra las ayudas ni controles del juego. Solo muestra la puntuación final y dos botones:
      - "Recomenzar": comienza una nueva partida con la misma configuración.
      - "Volver a configuración": regresa a la pantalla de configuración para cambiar opciones y recargar preguntas.

    ## Editar o añadir preguntas

    - Añade/edita entradas en `public/questions.json` siguiendo el formato indicado. Asegúrate de que `respuesta` apunte al índice correcto.

    ## Notas para desarrolladores

    - Código principal en `src/App.tsx`. Los componentes relevantes:
      - `src/components/Questions.tsx` — render de pregunta y botones de respuesta.
      - `src/components/Helpers.tsx` — muestra ayudas usadas y resultados.
    - Estilos principales en `src/index.css` y `src/App.css`.
    - Para cambiar el comportamiento de las ayudas o ajustar probabilidades, edita las funciones `use5050`, `useCall` y `usePublic` en `src/App.tsx`.

    ## Pruebas rápidas y verificación

    - Ejecuta `npm run dev` y prueba:
      - Selección/orden aleatorio de preguntas.
      - Uso de cada ayuda (cada una debe desactivarse después de usarla una vez).
      - Temporizador: prueba con 30s para ver la transición de color y el timeout.

    ## Mejoras sugeridas

    - Guardar el mejor puntaje en `localStorage` y mostrar récord.
    - Añadir una barra visual (progreso) para el temporizador.
    - Mostrar resumen de preguntas contestadas (correctas/erradas) en la pantalla final.
    - Añadir animaciones y accesibilidad (aria-labels, teclas rápidas para respuestas).

    Si quieres, puedo implementar cualquiera de las mejoras sugeridas; dime cuál prefieres y lo hago.
