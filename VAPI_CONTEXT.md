# 🎙️ Contexto del Juego para Integración con VAPI

Este documento proporciona una descripción completa y detallada del juego "Piedra, Papel o Tijeras" controlado por visión artificial para alimentar el sistema de voz VAPI y generar respuestas contextuales y naturales.

---

## 📋 DESCRIPCIÓN GENERAL DEL JUEGO

### Concepto
"Piedra, Papel o Tijeras" es un juego clásico de manos donde dos oponentes eligen simultáneamente uno de tres gestos. El juego utiliza visión artificial (Teachable Machine) para detectar los gestos de los jugadores a través de una cámara web, y un sistema de voz IA (VAPI) para anunciar resultados, proporcionar feedback y crear una experiencia interactiva.

### Objetivo
Ganar rondas eligiendo el gesto que vence al del oponente según las reglas clásicas:
- **Piedra (✊)** vence a **Tijera (✌️)**
- **Papel (✋)** vence a **Piedra (✊)**
- **Tijera (✌️)** vence a **Papel (✋)**
- Si ambos eligen el mismo gesto, es un **Empate**

---

## 🎮 MECÁNICAS DEL JUEGO

### Modos de Juego

#### 1. Modo: Jugador vs Sistema
- **Jugador 1**: Usuario humano que muestra gestos a la cámara
- **Oponente**: Sistema que elige aleatoriamente entre Piedra, Papel o Tijera
- **Cámara**: Una sola cámara para el Jugador 1
- **Detección**: El modelo de IA detecta el gesto del jugador en tiempo real

#### 2. Modo: Jugador vs Jugador
- **Jugador 1**: Primer jugador humano con su propia cámara
- **Jugador 2**: Segundo jugador humano con su propia cámara
- **Cámaras**: Dos cámaras independientes, una por jugador
- **Detección**: Ambos gestos se detectan simultáneamente

### Flujo de una Ronda

1. **Inicialización de Cámara**
   - El usuario hace clic en "Inicializar Cámara"
   - Se solicita permiso de acceso a la cámara
   - Se carga el modelo de Teachable Machine
   - La cámara comienza a capturar video en tiempo real

2. **Inicio de Ronda**
   - El usuario hace clic en "Iniciar Juego"
   - Comienza una cuenta regresiva visual: "3... 2... 1... ¡YA!"
   - Durante la cuenta regresiva, los jugadores preparan sus gestos

3. **Captura de Gestos**
   - Al llegar a "¡YA!", se capturan los gestos de ambos jugadores
   - El sistema detecta el gesto con mayor probabilidad (mínimo 60-70% de confianza)
   - Se ignoran detecciones "Indeterminado"

4. **Comparación y Resultado**
   - Se comparan los gestos según las reglas del juego
   - Se determina el ganador, perdedor o empate
   - Se actualiza el marcador

5. **Anuncio de Resultado**
   - Se muestra un modal con el resultado
   - **VAPI anuncia el resultado con voz**
   - Se actualiza el marcador en pantalla

---

## 🎯 ESTADOS DEL JUEGO

### Estados Principales

1. **INICIALIZANDO**
   - Estado: Cargando modelo y solicitando permisos de cámara
   - Acción del usuario: Clic en "Inicializar Cámara"
   - Voz sugerida: "Inicializando cámara... Por favor, permite el acceso a tu cámara."

2. **ESPERANDO_INICIO**
   - Estado: Cámara activa, modelo cargado, esperando inicio de ronda
   - Acción del usuario: Clic en "Iniciar Juego"
   - Voz sugerida: "Cámara lista. Haz clic en 'Iniciar Juego' cuando estés listo."

3. **CUENTA_REGRESIVA**
   - Estado: Mostrando cuenta regresiva (3, 2, 1, ¡YA!)
   - Duración: ~3.5 segundos
   - Voz sugerida: "¡Preparados! Tres... Dos... Uno... ¡YA!"

4. **CAPTURANDO_GESTOS**
   - Estado: Detectando gestos de los jugadores
   - Duración: ~1 segundo después del "¡YA!"
   - Voz sugerida: "Detectando gestos..."

5. **PROCESANDO_RESULTADO**
   - Estado: Comparando gestos y determinando ganador
   - Duración: Instantáneo
   - Voz sugerida: (Silencio o "Procesando...")

6. **MOSTRANDO_RESULTADO**
   - Estado: Modal visible, resultado anunciado
   - Voz: **AQUÍ ES DONDE VAPI HABLA** (ver sección de mensajes)

7. **ENTRE_RONDAS**
   - Estado: Esperando siguiente ronda
   - Voz sugerida: "¿Listo para otra ronda? Haz clic en 'Iniciar Juego'."

---

## 🗣️ MENSAJES DE VOZ PARA VAPI

### Contexto de Anuncio de Resultados

La función `announceResult()` se llama después de cada ronda con los siguientes parámetros:
- `result`: "Ganaste", "Perdiste", o "Empate"
- `player1`: Gesto del Jugador 1 ("PIEDRA", "PAPEL", o "TIJERA")
- `player2`: Gesto del oponente (Sistema o Jugador 2)
- `isSystem`: Boolean indicando si el oponente es el sistema

### Mensajes Base Actuales

#### Caso 1: Empate
```
"Empate. Ambos eligieron [gesto en minúsculas]."
```
**Ejemplos:**
- "Empate. Ambos eligieron piedra."
- "Empate. Ambos eligieron papel."
- "Empate. Ambos eligieron tijera."

#### Caso 2: Jugador 1 Gana
```
"[Oponente] eligió [gesto2]. Tú elegiste [gesto1]. ¡Ganaste esta ronda!"
```
**Ejemplos:**
- "Sistema eligió tijera. Tú elegiste piedra. ¡Ganaste esta ronda!"
- "Jugador 2 eligió papel. Tú elegiste tijera. ¡Ganaste esta ronda!"

#### Caso 3: Jugador 1 Pierde
```
"[Oponente] eligió [gesto2]. Tú elegiste [gesto1]. [Oponente] gana esta ronda."
```
**Ejemplos:**
- "Sistema eligió papel. Tú elegiste piedra. Sistema gana esta ronda."
- "Jugador 2 eligió tijera. Tú elegiste papel. Jugador 2 gana esta ronda."

---

## 🎨 VARIACIONES Y MEJORAS PARA VAPI

### Mensajes Más Naturales y Variados

VAPI puede generar variaciones más naturales y emocionales. Aquí hay sugerencias:

#### Empate - Variaciones
1. "¡Empate! Ambos mostraron [gesto]."
2. "Nadie gana esta ronda. Ambos eligieron [gesto]."
3. "Es un empate. Los dos jugaron [gesto]."
4. "¡Qué coincidencia! Ambos eligieron [gesto]."

#### Victoria - Variaciones
1. "¡Excelente! Elegiste [gesto1] y [oponente] eligió [gesto2]. ¡Ganaste!"
2. "¡Bien jugado! Tu [gesto1] venció al [gesto2] de [oponente]."
3. "¡Punto para ti! [Oponente] mostró [gesto2], pero tu [gesto1] fue mejor."
4. "¡Victoria! [Gesto1] contra [gesto2]. ¡Felicitaciones!"

#### Derrota - Variaciones
1. "Esta vez [oponente] ganó. Eligió [gesto2] y tú [gesto1]."
2. "No fue tu ronda. [Oponente] jugó [gesto2] y venció tu [gesto1]."
3. "Punto para [oponente]. Su [gesto2] superó tu [gesto1]."
4. "Esta ronda es para [oponente]. [Gesto2] vence a [gesto1]."

### Mensajes Contextuales Adicionales

#### Al Inicializar Cámara
- "Inicializando sistema de visión artificial..."
- "Cargando modelo de reconocimiento de gestos..."
- "Solicitando acceso a la cámara..."
- "¡Cámara lista! El sistema puede detectar tus gestos ahora."

#### Durante la Cuenta Regresiva
- "¡Preparados! Tres... Dos... Uno... ¡YA! Muestra tu gesto."
- "Cuenta regresiva: Tres... Dos... Uno... ¡Ahora!"
- "¡Aquí vamos! Tres... Dos... Uno... ¡Muéstrame tu jugada!"

#### Si No Se Detecta Gesto
- "No pude detectar tu gesto claramente. Por favor, intenta de nuevo con mejor iluminación."
- "La detección no fue exitosa. Asegúrate de mostrar tu gesto claramente a la cámara."
- "Gesto no reconocido. Intenta mostrar piedra, papel o tijera de forma más clara."

#### Actualización de Marcador
- "Marcador actualizado: Tú [puntos1], [Oponente] [puntos2]. Rondas jugadas: [rondas]."
- "Después de [rondas] rondas, llevas [puntos1] puntos y [oponente] tiene [puntos2]."
- "El marcador está [puntos1] a [puntos2] a tu favor/desfavor después de [rondas] rondas."

#### Al Reiniciar Marcador
- "Marcador reiniciado. Empecemos de nuevo."
- "Todo vuelve a cero. ¡Nueva partida!"
- "Marcador reseteado. ¿Listo para comenzar?"

#### Al Cambiar Modo
- "Cambiando a modo Jugador vs Jugador. Cada jugador necesitará su propia cámara."
- "Modo Sistema activado. Ahora jugarás contra la computadora."
- "Modo multijugador activado. Ambos jugadores deben inicializar sus cámaras."

---

## 📊 INFORMACIÓN DEL ESTADO DEL JUEGO

### Variables de Estado Disponibles

```javascript
gameState = {
    mode: 'system' | 'player',        // Modo de juego actual
    isPlaying: boolean,                // Si una ronda está en progreso
    countdown: number,                 // Estado de cuenta regresiva (0 = terminada)
    player1Gesture: 'PIEDRA' | 'PAPEL' | 'TIJERA' | null,
    player2Gesture: 'PIEDRA' | 'PAPEL' | 'TIJERA' | null,
    scores: {
        player1: number,               // Puntos del Jugador 1
        opponent: number,              // Puntos del oponente (Sistema o Jugador 2)
        rounds: number                // Total de rondas jugadas
    }
}
```

### Gestos Disponibles

```javascript
GESTURES = {
    'PIEDRA': { emoji: '✊', name: 'Piedra' },
    'PAPEL': { emoji: '✋', name: 'Papel' },
    'TIJERA': { emoji: '✌️', name: 'Tijera' }
}
```

### Reglas de Victoria

```javascript
GESTURE_ORDER = ['PIEDRA', 'PAPEL', 'TIJERA']
// Índice 0: Piedra vence a Tijera (índice 2)
// Índice 1: Papel vence a Piedra (índice 0)
// Índice 2: Tijera vence a Papel (índice 1)
```

---

## 🎭 PERSONALIDAD Y TONO SUGERIDO PARA VAPI

### Características de la Voz

1. **Entusiasta pero no exagerado**: La voz debe sonar emocionada en victorias, pero no demasiado dramática
2. **Clara y concisa**: Los mensajes deben ser fáciles de entender
3. **Alentadora**: Debe motivar al jugador, especialmente después de derrotas
4. **Informativa**: Debe proporcionar información clara sobre el estado del juego

### Ejemplos de Tono

**Entusiasta (Victoria):**
- "¡Excelente jugada! Tu piedra aplastó la tijera del sistema. ¡Punto para ti!"

**Neutral (Empate):**
- "Es un empate. Ambos eligieron papel. Nadie gana esta ronda."

**Alentador (Derrota):**
- "Esta vez el sistema ganó con papel contra tu piedra. ¡No te desanimes, sigue intentando!"

**Informativo (Estado):**
- "Marcador: Tú 3, Sistema 2. Llevas la delantera después de 5 rondas."

---

## 🔄 FLUJO DE EVENTOS Y MOMENTOS PARA VOZ

### Eventos Principales

1. **onCameraInitialized**
   - Momento: Cuando la cámara se inicializa correctamente
   - Voz: "Cámara inicializada. Sistema listo para detectar gestos."

2. **onGameStart**
   - Momento: Cuando el usuario hace clic en "Iniciar Juego"
   - Voz: "¡Comencemos! Prepárate para mostrar tu gesto."

3. **onCountdownStart**
   - Momento: Inicio de cuenta regresiva
   - Voz: "¡Preparados! Tres... Dos... Uno..."

4. **onCountdownEnd**
   - Momento: Al llegar a "¡YA!"
   - Voz: "¡YA! Muestra tu gesto ahora."

5. **onGestureDetected**
   - Momento: Cuando se detecta un gesto (opcional, para feedback)
   - Voz: "Gesto detectado: [gesto]"

6. **onResultCalculated**
   - Momento: **PRINCIPAL** - Después de comparar gestos
   - Voz: **AQUÍ VAPI ANUNCIA EL RESULTADO** (ver mensajes base)

7. **onScoreUpdated**
   - Momento: Después de actualizar marcador
   - Voz: "Marcador actualizado: [puntos]"

8. **onRoundEnd**
   - Momento: Al cerrar el modal de resultado
   - Voz: "¿Listo para otra ronda?"

---

## 📝 EJEMPLOS DE CONVERSACIONES COMPLETAS

### Ejemplo 1: Ronda Completa (Jugador vs Sistema)

**VAPI:** "Cámara inicializada. Sistema listo para detectar gestos."

**Usuario:** [Hace clic en "Iniciar Juego"]

**VAPI:** "¡Comencemos! Prepárate para mostrar tu gesto."

**VAPI:** "¡Preparados! Tres... Dos... Uno... ¡YA! Muestra tu gesto ahora."

[Usuario muestra piedra, Sistema elige tijera]

**VAPI:** "¡Excelente! Elegiste piedra y Sistema eligió tijera. ¡Ganaste esta ronda!"

**VAPI:** "Marcador actualizado: Tú 1, Sistema 0. Rondas jugadas: 1."

---

### Ejemplo 2: Ronda con Empate

**VAPI:** "¡Preparados! Tres... Dos... Uno... ¡YA!"

[Ambos eligen papel]

**VAPI:** "¡Empate! Ambos mostraron papel. Nadie gana esta ronda."

**VAPI:** "Marcador: Tú 2, Sistema 1. Rondas jugadas: 4."

---

### Ejemplo 3: Ronda con Derrota

**VAPI:** "¡Preparados! Tres... Dos... Uno... ¡YA!"

[Usuario muestra piedra, Sistema elige papel]

**VAPI:** "Esta vez Sistema ganó. Eligió papel y venció tu piedra. ¡No te desanimes, sigue intentando!"

**VAPI:** "Marcador: Tú 1, Sistema 2. Rondas jugadas: 3."

---

## 🎯 INTEGRACIÓN TÉCNICA CON VAPI

### Función Actual de Anuncio

```javascript
function announceResult(result, player1, player2, isSystem) {
    const player1Name = GESTURES[player1].name.toLowerCase();
    const player2Name = GESTURES[player2].name.toLowerCase();
    const opponent = isSystem ? 'Sistema' : 'Jugador 2';
    
    let message = '';
    if (result === 'Empate') {
        message = `Empate. Ambos eligieron ${player1Name}.`;
    } else if (result === 'Ganaste') {
        message = `${opponent} eligió ${player2Name}. Tú elegiste ${player1Name}. ¡Ganaste esta ronda!`;
    } else {
        message = `${opponent} eligió ${player2Name}. Tú elegiste ${player1Name}. ${opponent} gana esta ronda.`;
    }
    
    speak(message); // Esta función debe llamar a VAPI
}
```

### Datos Disponibles para VAPI

Cuando se llama `announceResult()`, VAPI tiene acceso a:
- `result`: "Ganaste" | "Perdiste" | "Empate"
- `player1Gesture`: "PIEDRA" | "PAPEL" | "TIJERA"
- `player2Gesture`: "PIEDRA" | "PAPEL" | "TIJERA"
- `isSystem`: boolean (true si oponente es sistema)
- `scores.player1`: número de victorias del jugador
- `scores.opponent`: número de victorias del oponente
- `scores.rounds`: total de rondas jugadas

### Contexto Adicional para VAPI

VAPI puede usar esta información para:
1. **Generar variaciones naturales** de los mensajes
2. **Adaptar el tono** según el marcador (ej: más alentador si el jugador va perdiendo)
3. **Proporcionar comentarios contextuales** (ej: "¡Estás en racha!" si el jugador gana varias seguidas)
4. **Detectar patrones** (ej: "Siempre eliges piedra, ¿por qué no pruebas con papel?")

---

## 🎪 ESCENARIOS ESPECIALES

### Racha de Victorias
- "¡Increíble! Llevas [X] victorias seguidas. ¡Sigue así!"
- "¡Estás en racha! [X] rondas ganadas consecutivamente."

### Racha de Derrotas
- "No te desanimes. Llevas [X] derrotas, pero puedes recuperarte."
- "Vamos, puedes hacerlo mejor. Intenta cambiar tu estrategia."

### Partida Cerca del Final
- "¡Partida muy reñida! El marcador está empatado."
- "¡Qué partida emocionante! Solo hay un punto de diferencia."

### Primera Ronda
- "¡Bienvenido al juego! Esta es tu primera ronda."
- "¡Comencemos! Prepárate para tu primera jugada."

---

## 📋 RESUMEN PARA CONFIGURACIÓN DE VAPI

### Información Clave

1. **Idioma**: Español (es-ES)
2. **Tono**: Entusiasta, claro, alentador
3. **Contexto**: Juego de "Piedra, Papel o Tijeras" con visión artificial
4. **Momentos de voz**: Principalmente al anunciar resultados de cada ronda
5. **Datos disponibles**: Gestos, resultados, marcador, modo de juego

### Mensajes Críticos

Los mensajes más importantes que VAPI debe generar son:
- Anuncio de resultados (Ganaste/Perdiste/Empate)
- Información del marcador
- Feedback sobre el estado del juego

### Personalización Recomendada

VAPI puede mejorar la experiencia con:
- Variaciones naturales de mensajes
- Comentarios contextuales basados en el marcador
- Detección de patrones de juego
- Mensajes alentadores o celebratorios según el contexto

---

**Este documento debe ser usado como contexto completo para configurar VAPI y generar respuestas de voz naturales, contextuales y apropiadas para cada situación del juego.**

