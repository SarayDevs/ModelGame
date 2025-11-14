// Configuración del modelo Teachable Machine
const URL = "./tm-my-image-model/";
let model1, model2;
let webcam1, webcam2;
let labelContainer1, labelContainer2;
let maxPredictions;

// Estado del juego
let gameState = {
    mode: 'system', // 'system', 'player' o 'online'
    isPlaying: false,
    countdown: 0,
    player1Gesture: null,
    player2Gesture: null,
    scores: {
        player1: 0,
        opponent: 0,
        rounds: 0
    },
    online: {
        isOnline: false,
        roomCode: null,
        isHost: false,
        playerId: null,
        database: null
    }
};

// Gestos del juego
const GESTURES = {
    'PIEDRA': {
        emoji: '✊',
        name: 'Piedra'
    },
    'PAPEL': {
        emoji: '✋',
        name: 'Papel'
    },
    'TIJERA': {
        emoji: '✌️',
        name: 'Tijera'
    }
};

// Mapeo de gestos para comparación
const GESTURE_ORDER = ['PIEDRA', 'PAPEL', 'TIJERA'];

// Función para generar número aleatorio seguro
function getRandomGesture() {
    const gestures = ['PIEDRA', 'PAPEL', 'TIJERA'];
    let randomIndex;

    // Usar crypto.getRandomValues para mejor aleatoriedad criptográfica
    if (window.crypto && window.crypto.getRandomValues) {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        randomIndex = array[0] % gestures.length;
    } else {
        // Fallback a Math.random
        randomIndex = Math.floor(Math.random() * gestures.length);
    }

    const selectedGesture = gestures[randomIndex];
    console.log('🎲 Gestos disponibles:', gestures);
    console.log('🎲 Índice aleatorio generado:', randomIndex);
    console.log('🎲 Gesto seleccionado por el sistema:', selectedGesture);

    return selectedGesture;
}

// Verificar que las librerías estén cargadas
function checkLibrariesLoaded() {
    // Verificar TensorFlow
    if (typeof tf === 'undefined') {
        console.error('TensorFlow.js no está cargado');
        return false;
    }

    // Verificar Teachable Machine - puede estar en diferentes variables
    let tmAvailable = false;
    if (typeof tmImage !== 'undefined') {
        tmAvailable = true;
        window.tmImage = tmImage; // Asegurar que esté en window
    } else if (typeof tm !== 'undefined') {
        tmAvailable = true;
        window.tmImage = tm; // Usar tm como alias
    } else if (window.tmImage !== undefined) {
        tmAvailable = true;
    } else {
        console.error('Teachable Machine Image no está cargado');
        console.log('Variables globales disponibles:', Object.keys(window).filter(k =>
            k.toLowerCase().includes('tm') ||
            k.toLowerCase().includes('teachable') ||
            k.toLowerCase().includes('image')
        ));
        return false;
    }

    console.log('✓ TensorFlow.js cargado');
    console.log('✓ Teachable Machine Image cargado');
    return true;
}

// Inicialización - se ejecuta cuando el script se carga
(function() {
    // Verificar inmediatamente si las librerías están disponibles
    if (!checkLibrariesLoaded()) {
        console.warn('Librerías no disponibles aún, esperando...');
        // Intentar de nuevo después de un breve delay
        setTimeout(function() {
            if (!checkLibrariesLoaded()) {
                alert('Error: Las librerías necesarias no se cargaron correctamente.\n\nPor favor:\n1. Verifica tu conexión a internet\n2. Recarga la página\n3. Si el problema persiste, verifica la consola del navegador');
                return;
            }
            initializeApp();
        }, 1000);
    } else {
        initializeApp();
    }

    function initializeApp() {
        setupEventListeners();
        updateUI();
        console.log('Aplicación inicializada correctamente');
    }
})();

function setupEventListeners() {
    document.getElementById('initCameraBtn').addEventListener('click', initializeCamera);
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('resetBtn').addEventListener('click', resetScores);
    document.getElementById('modeBtn').addEventListener('click', toggleMode);
    document.getElementById('closeModal').addEventListener('click', closeModal);

    // Event listeners para modo online
    document.getElementById('onlineBtn').addEventListener('click', openOnlineModal);
    document.getElementById('createRoomBtn').addEventListener('click', createRoom);
    document.getElementById('joinRoomBtn').addEventListener('click', showJoinRoom);
    document.getElementById('joinWithCodeBtn').addEventListener('click', joinRoom);
    document.getElementById('startGameOnlineBtn').addEventListener('click', () => {
        closeOnlineModal();
        startGame();
    });
    document.getElementById('closeRoomModalBtn').addEventListener('click', () => {
        // Solo cerrar el modal, no salir de la sala
        closeOnlineModal();
    });
    document.getElementById('cancelOnlineBtn').addEventListener('click', () => {
        if (gameState.online.isOnline) {
            if (confirm('¿Estás seguro de que deseas salir de la sala?')) {
                leaveRoom();
                closeOnlineModal();
            }
        } else {
            closeOnlineModal();
        }
    });
    document.getElementById('copyCodeBtn').addEventListener('click', copyRoomCode);

    // Permitir Enter para unirse a sala
    document.getElementById('roomCodeInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            joinRoom();
        }
    });
}

// Inicializar cámara (función principal llamada por el botón)
async function initializeCamera() {
    const initBtn = document.getElementById('initCameraBtn');
    const startBtn = document.getElementById('startBtn');

    try {
        initBtn.disabled = true;
        initBtn.textContent = 'Inicializando...';

        // Verificar que las librerías estén cargadas
        if (!checkLibrariesLoaded()) {
            throw new Error('Las librerías necesarias no están cargadas. Por favor, recarga la página.');
        }

        // Inicializar cámara del jugador 1
        if (!webcam1) {
            await initPlayer1();
        }

        // Si está en modo jugador vs jugador, inicializar segunda cámara
        if (gameState.mode === 'player' && !webcam2) {
            await initPlayer2();
        }

        initBtn.textContent = '✓ Cámara Inicializada';
        initBtn.style.background = 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)';
        startBtn.disabled = false;

        console.log('Cámara inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar cámara:', error);
        alert('Error al inicializar la cámara:\n\n' + error.message + '\n\nAsegúrate de:\n1. Dar permisos de cámara al navegador\n2. Tener una cámara conectada\n3. Recargar la página si el problema persiste');
        initBtn.disabled = false;
        initBtn.textContent = 'Inicializar Cámara';
    }
}

// Inicializar modelo y cámara para Jugador 1
async function initPlayer1() {
    try {
        // Verificar que tmImage esté disponible (puede estar en window.tmImage)
        const tm = window.tmImage || (typeof tmImage !== 'undefined' ? tmImage : undefined);
        if (typeof tm === 'undefined') {
            throw new Error('Teachable Machine Image no está cargado. Por favor, recarga la página.');
        }

        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        console.log('Cargando modelo...');
        model1 = await tm.load(modelURL, metadataURL);
        maxPredictions = model1.getTotalClasses();
        console.log('Modelo cargado correctamente');

        console.log('Inicializando cámara...');
        webcam1 = new tm.Webcam(300, 300, true);
        await webcam1.setup();
        await webcam1.play();
        console.log('Cámara iniciada correctamente');

        const container = document.getElementById("webcam-container-1");
        if (container && webcam1.canvas) {
            container.innerHTML = ''; // Limpiar contenedor
            container.appendChild(webcam1.canvas);
        }

        labelContainer1 = document.getElementById("label-container-1");
        if (labelContainer1) {
            labelContainer1.innerHTML = '';
            for (let i = 0; i < maxPredictions; i++) {
                labelContainer1.appendChild(document.createElement("div"));
            }
        }

        loopPlayer1();
    } catch (error) {
        console.error('Error al inicializar Jugador 1:', error);
        alert('Error al inicializar la cámara: ' + error.message + '\n\nAsegúrate de dar permisos de cámara al navegador.');
        throw error;
    }
}

// Inicializar modelo y cámara para Jugador 2 (solo en modo jugador vs jugador)
async function initPlayer2() {
    try {
        // Verificar que tmImage esté disponible (puede estar en window.tmImage)
        const tm = window.tmImage || (typeof tmImage !== 'undefined' ? tmImage : undefined);
        if (typeof tm === 'undefined') {
            throw new Error('Teachable Machine Image no está cargado.');
        }

        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        console.log('Cargando modelo para Jugador 2...');
        model2 = await tm.load(modelURL, metadataURL);

        // Intentar usar una segunda cámara o la misma
        console.log('Inicializando segunda cámara...');
        webcam2 = new tm.Webcam(300, 300, true);
        await webcam2.setup();
        await webcam2.play();
        console.log('Segunda cámara iniciada correctamente');

        const container2 = document.getElementById("webcam-container-2");
        if (container2 && webcam2.canvas) {
            container2.innerHTML = ''; // Limpiar contenedor
            container2.appendChild(webcam2.canvas);
            container2.classList.remove('hidden');
        }

        labelContainer2 = document.getElementById("label-container-2");
        if (labelContainer2) {
            labelContainer2.innerHTML = '';
            labelContainer2.classList.remove('hidden');
            for (let i = 0; i < maxPredictions; i++) {
                labelContainer2.appendChild(document.createElement("div"));
            }
        }

        loopPlayer2();
    } catch (error) {
        console.error('Error al inicializar segunda cámara:', error);
        alert('No se pudo acceder a una segunda cámara. Usando modo Jugador vs Sistema.\n\nError: ' + error.message);
        gameState.mode = 'system';
        updateUI();
    }
}

// Loop de predicción para Jugador 1
async function loopPlayer1() {
    if (webcam1) {
        webcam1.update();
        await predictPlayer1();
        window.requestAnimationFrame(loopPlayer1);
    }
}

// Loop de predicción para Jugador 2
async function loopPlayer2() {
    if (webcam2) {
        webcam2.update();
        await predictPlayer2();
        window.requestAnimationFrame(loopPlayer2);
    }
}

// Predecir gesto del Jugador 1
async function predictPlayer1() {
    if (!model1 || !webcam1 || !webcam1.canvas) return;

    try {
        const prediction = await model1.predict(webcam1.canvas);
        let maxProbability = 0;
        let detectedGesture = null;

        for (let i = 0; i < maxPredictions; i++) {
            const classPrediction = prediction[i].className + ": " + (prediction[i].probability * 100).toFixed(2) + "%";
            if (labelContainer1 && labelContainer1.childNodes[i]) {
                labelContainer1.childNodes[i].innerHTML = classPrediction;
            }

            // Obtener el gesto con mayor probabilidad (excluyendo "Indeterminado" y mínimo 50%)
            if (prediction[i].className !== 'Indeterminado' &&
                prediction[i].probability > maxProbability &&
                prediction[i].probability > 0.5) {
                maxProbability = prediction[i].probability;
                detectedGesture = prediction[i].className;
            }
        }

        // Actualizar UI del gesto detectado
        if (detectedGesture && GESTURES[detectedGesture]) {
            updateGestureDisplay('gesture1', detectedGesture);
            // Guardar el gesto detectado si estamos jugando (se usará después del countdown)
            if (gameState.isPlaying) {
                gameState.player1Gesture = detectedGesture;
            }
        }
    } catch (error) {
        console.error('Error en predictPlayer1:', error);
    }
}

// Predecir gesto del Jugador 2
async function predictPlayer2() {
    if (!model2 || !webcam2 || !webcam2.canvas) return;

    try {
        const prediction = await model2.predict(webcam2.canvas);
        let maxProbability = 0;
        let detectedGesture = null;

        for (let i = 0; i < maxPredictions; i++) {
            const classPrediction = prediction[i].className + ": " + (prediction[i].probability * 100).toFixed(2) + "%";
            if (labelContainer2 && labelContainer2.childNodes[i]) {
                labelContainer2.childNodes[i].innerHTML = classPrediction;
            }

            if (prediction[i].className !== 'Indeterminado' &&
                prediction[i].probability > maxProbability &&
                prediction[i].probability > 0.5) {
                maxProbability = prediction[i].probability;
                detectedGesture = prediction[i].className;
            }
        }

        if (detectedGesture && GESTURES[detectedGesture]) {
            updateGestureDisplay('gesture2', detectedGesture);
            // Guardar el gesto detectado si estamos jugando
            if (gameState.isPlaying) {
                gameState.player2Gesture = detectedGesture;
            }
        }
    } catch (error) {
        console.error('Error en predictPlayer2:', error);
    }
}

// Actualizar visualización del gesto
function updateGestureDisplay(elementId, gesture) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const gestureData = GESTURES[gesture];
    if (gestureData) {
        element.classList.remove('piedra', 'papel', 'tijera');
        element.classList.add(gesture.toLowerCase());
        const emojiElement = element.querySelector('.emoji');
        const textElement = element.querySelector('.gesture-text');
        if (emojiElement) emojiElement.textContent = gestureData.emoji;
        if (textElement) textElement.textContent = gestureData.name;
    }
}

// Iniciar juego
async function startGame() {
    if (gameState.isPlaying) return;

    // Si está en modo online, usar función específica
    if (gameState.mode === 'online') {
        await startGameOnline();
        return;
    }

    try {
        // Verificar que la cámara esté inicializada
        if (!webcam1) {
            alert('Por favor, primero inicializa la cámara haciendo clic en "Inicializar Cámara"');
            return;
        }

        if (gameState.mode === 'player' && !webcam2) {
            alert('Por favor, inicializa la cámara del Jugador 2 primero');
            return;
        }

        gameState.isPlaying = true;
        gameState.player1Gesture = null;
        gameState.player2Gesture = null;

        document.getElementById('startBtn').disabled = true;

        // Ocultar resultado anterior
        document.getElementById('result-display').classList.add('hidden');

        // Iniciar cuenta regresiva
        await countdown();

        // Capturar gestos
        await captureGestures();

        // Comparar y mostrar resultado
        compareGestures();
    } catch (error) {
        console.error('Error al iniciar el juego:', error);
        alert('Error al iniciar el juego: ' + error.message);
        gameState.isPlaying = false;
        document.getElementById('startBtn').disabled = false;
    }
}

// Cuenta regresiva
async function countdown() {
    const countdownElement = document.getElementById('countdown');
    countdownElement.classList.remove('hidden');

    // Resetear gestos antes de la cuenta regresiva
    gameState.player1Gesture = null;
    gameState.player2Gesture = null;

    for (let i = 3; i > 0; i--) {
        countdownElement.textContent = i;
        await sleep(1000);
    }

    countdownElement.textContent = '¡YA!';
    await sleep(500);
    countdownElement.classList.add('hidden');
    gameState.countdown = 0;
}

// Capturar gestos
async function captureGestures() {
    // Esperar un momento para que se estabilice la detección después del "¡YA!"
    await sleep(1000);

    // Forzar una predicción inmediata para capturar el gesto actual
    if (model1 && webcam1 && webcam1.canvas) {
        try {
            const prediction = await model1.predict(webcam1.canvas);
            let maxProbability = 0;
            let detectedGesture = null;

            for (let i = 0; i < prediction.length; i++) {
                if (prediction[i].className !== 'Indeterminado' &&
                    prediction[i].probability > maxProbability &&
                    prediction[i].probability > 0.5) {
                    maxProbability = prediction[i].probability;
                    detectedGesture = prediction[i].className;
                }
            }

            // Validar que el gesto detectado tenga al menos 50% de probabilidad
            if (detectedGesture && GESTURES[detectedGesture] && maxProbability > 0.5) {
                gameState.player1Gesture = detectedGesture;
                updateGestureDisplay('gesture1', detectedGesture);
                console.log(`✅ Gesto Jugador 1 detectado: ${detectedGesture} (${(maxProbability * 100).toFixed(1)}%)`);
            } else {
                console.warn(`⚠️ Gesto Jugador 1 no válido: ${detectedGesture || 'ninguno'} (${(maxProbability * 100).toFixed(1)}%)`);
            }
        } catch (error) {
            console.error('Error al capturar gesto del jugador 1:', error);
        }
    }

    // En modo jugador vs jugador, capturar gesto del jugador 2
    if (gameState.mode === 'player' && model2 && webcam2 && webcam2.canvas) {
        try {
            const prediction = await model2.predict(webcam2.canvas);
            let maxProbability = 0;
            let detectedGesture = null;

            for (let i = 0; i < prediction.length; i++) {
                if (prediction[i].className !== 'Indeterminado' &&
                    prediction[i].probability > maxProbability &&
                    prediction[i].probability > 0.5) {
                    maxProbability = prediction[i].probability;
                    detectedGesture = prediction[i].className;
                }
            }

            // Validar que el gesto detectado tenga al menos 50% de probabilidad
            if (detectedGesture && GESTURES[detectedGesture] && maxProbability > 0.5) {
                gameState.player2Gesture = detectedGesture;
                updateGestureDisplay('gesture2', detectedGesture);
                console.log(`✅ Gesto Jugador 2 detectado: ${detectedGesture} (${(maxProbability * 100).toFixed(1)}%)`);
            } else {
                console.warn(`⚠️ Gesto Jugador 2 no válido: ${detectedGesture || 'ninguno'} (${(maxProbability * 100).toFixed(1)}%)`);
            }
        } catch (error) {
            console.error('Error al capturar gesto del jugador 2:', error);
        }
    }

    // En modo sistema, generar jugada aleatoria
    if (gameState.mode === 'system') {
        // Usar función auxiliar para asegurar aleatoriedad
        gameState.player2Gesture = getRandomGesture();
        updateGestureDisplay('gesture2', gameState.player2Gesture);
    }

    // Si aún no hay gesto del jugador 1, intentar obtenerlo de la UI
    if (!gameState.player1Gesture) {
        const gestureText = document.querySelector('#gesture1 .gesture-text');
        if (gestureText) {
            const text = gestureText.textContent.trim();
            for (const [key, value] of Object.entries(GESTURES)) {
                if (value.name === text) {
                    gameState.player1Gesture = key;
                    break;
                }
            }
        }
    }
}

// Comparar gestos y determinar ganador
function compareGestures() {
    const player1 = gameState.player1Gesture;
    const player2 = gameState.player2Gesture;

    // Validar que ambos gestos estén detectados y no sean "Indeterminado"
    if (!player1 || !player2 || player1 === 'Indeterminado' || player2 === 'Indeterminado') {
        const missingGestures = [];
        if (!player1 || player1 === 'Indeterminado') missingGestures.push('Jugador 1');
        if (!player2 || player2 === 'Indeterminado') missingGestures.push(gameState.mode === 'system' ? 'Sistema' : 'Jugador 2');

        const errorMessage = `No se pudo detectar el gesto correctamente. ${missingGestures.join(' y ')} ${missingGestures.length > 1 ? 'no tienen' : 'no tiene'} un gesto válido. Por favor, inicia el juego nuevamente mostrando el gesto más claramente.`;

        // Anunciar con voz
        speak(errorMessage).catch(err => console.error('Error al anunciar:', err));

        alert(errorMessage);
        gameState.isPlaying = false;
        document.getElementById('startBtn').disabled = false;

        // Si es online, notificar al otro jugador
        if (gameState.mode === 'online' && gameState.online.database) {
            const roomRef = gameState.online.database.ref(`rooms/${gameState.online.roomCode}`);
            roomRef.child('gameState/error').set('indeterminado');
        }

        return;
    }

    let result = '';
    let winner = null;

    if (player1 === player2) {
        result = 'Empate';
        winner = 'tie';
    } else {
        const p1Index = GESTURE_ORDER.indexOf(player1);
        const p2Index = GESTURE_ORDER.indexOf(player2);

        // Piedra (0) vence a Tijera (2)
        // Papel (1) vence a Piedra (0)
        // Tijera (2) vence a Papel (1)
        const diff = (p1Index - p2Index + 3) % 3;

        if (diff === 1) {
            result = 'Ganaste';
            winner = 'player1';
            gameState.scores.player1++;
        } else {
            result = 'Perdiste';
            winner = 'opponent';
            gameState.scores.opponent++;
        }
    }

    gameState.scores.rounds++;

    // Actualizar UI
    updateScores();
    showResult(result, player1, player2, winner);

    // Anunciar con voz
    announceResult(result, player1, player2, gameState.mode === 'system');

    gameState.isPlaying = false;
    document.getElementById('startBtn').disabled = false;
}

// Mostrar resultado en modal
function showResult(result, player1, player2, winner) {
    const modal = document.getElementById('resultModal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');

    modalTitle.textContent = result;

    const player1Name = GESTURES[player1].name;
    const player2Name = gameState.mode === 'system' ?
        GESTURES[player2].name :
        GESTURES[player2].name;

    const opponentLabel = gameState.mode === 'system' ? 'Sistema' : 'Jugador 2';

    modalMessage.textContent = `Tú elegiste ${player1Name}. ${opponentLabel} eligió ${player2Name}.`;

    // Actualizar marcadores en el modal
    document.getElementById('modal-score-1').textContent = gameState.scores.player1;
    document.getElementById('modal-score-2').textContent = gameState.scores.opponent;
    document.getElementById('modal-rounds').textContent = gameState.scores.rounds;
    document.getElementById('modal-opponent-label').textContent = opponentLabel + ':';

    modal.classList.remove('hidden');
}

// Cerrar modal
function closeModal() {
    document.getElementById('resultModal').classList.add('hidden');
}

// Anunciar resultado con voz
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

    speak(message);
}

// Configuración de VAPI/ElevenLabs
const VAPI_VOICE_ID = 'n4x17EKVqyxfey8QMqvy'; // Voice ID de ElevenLabs configurado
const VAPI_PUBLIC_KEY = 'd18dd720-b478-4f1a-8cd4-c2c1b8279b37'; // Public key del widget
// API Key de ElevenLabs - Configurada
const ELEVENLABS_API_KEY = 'sk_4acb5dc0803f7e63a478aca3a4fdf7fdb52082d4211a0337';

// Función de voz usando VAPI/ElevenLabs (OBLIGATORIO - sin fallback)
async function speak(text) {
    // OBLIGATORIO: Solo usar ElevenLabs, sin fallback a speechSynthesis
    if (!ELEVENLABS_API_KEY) {
        console.error('❌ ERROR: ELEVENLABS_API_KEY no está configurada. El juego requiere ElevenLabs para funcionar.');
        alert('Error: API Key de ElevenLabs no configurada. Por favor, configura ELEVENLABS_API_KEY en script.js');
        return;
    }

    try {
        await speakWithVAPI(text);
    } catch (error) {
        console.error('❌ ERROR CRÍTICO con ElevenLabs:', error);
        // NO usar fallback - mostrar error al usuario
        alert(`Error al reproducir voz de ElevenLabs: ${error.message}\n\nPor favor, verifica:\n1. Tu conexión a internet\n2. Que tu API key sea válida\n3. Que el voice ID sea correcto\n\nRevisa la consola para más detalles.`);
        throw error; // Lanzar error para que el usuario sepa que algo falló
    }
}

// Cache para audio de VAPI
const audioCache = new Map();
const MAX_CACHE_SIZE = 10;

// Función para sintetizar voz con VAPI/ElevenLabs (optimizada)
async function speakWithVAPI(text) {
    console.log('🎙️ Usando VAPI/ElevenLabs para sintetizar:', text);
    console.log('🎙️ Voice ID:', VAPI_VOICE_ID);

    // Verificar cache primero
    const cacheKey = text.substring(0, 50); // Usar primeros 50 caracteres como clave
    if (audioCache.has(cacheKey)) {
        console.log('✅ Usando audio del cache');
        const cachedAudio = audioCache.get(cacheKey).cloneNode();
        await playAudio(cachedAudio);
        return;
    }

    // Opción 1: Usar ElevenLabs directamente (VAPI usa ElevenLabs internamente)
    if (ELEVENLABS_API_KEY) {
        try {
            console.log('Usando ElevenLabs API directamente');

            // Crear AbortController para timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // Timeout de 8 segundos

            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VAPI_VOICE_ID}`, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': ELEVENLABS_API_KEY
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_multilingual_v2', // Modelo multilingüe para español
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                        style: 0.0,
                        use_speaker_boost: true
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error de ElevenLabs API:', response.status, errorText);
                throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
            }

            // Usar window.URL para asegurar compatibilidad
            const audioBlob = await response.blob();
            const URLObject = window.URL || window.webkitURL;

            if (!URLObject || !URLObject.createObjectURL) {
                throw new Error('URL.createObjectURL no está disponible en este navegador. Por favor, usa un navegador moderno.');
            }

            const audioUrl = URLObject.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            // Guardar en cache (limitar tamaño)
            if (audioCache.size >= MAX_CACHE_SIZE) {
                const firstKey = audioCache.keys().next().value;
                audioCache.delete(firstKey);
            }
            audioCache.set(cacheKey, audio.cloneNode());

            // Reproducir audio
            await playAudio(audio);

            // Limpiar URL después de un tiempo
            setTimeout(() => URLObject.revokeObjectURL(audioUrl), 10000);

            return;

        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('❌ Timeout al conectar con ElevenLabs (8 segundos)');
                throw new Error('La conexión con ElevenLabs tardó demasiado. Por favor, verifica tu conexión a internet.');
            }
            console.error('❌ Error crítico con ElevenLabs:', error);
            throw new Error(`No se pudo sintetizar voz con ElevenLabs: ${error.message}`);
        }
    } else {
        throw new Error('ELEVENLABS_API_KEY no está configurada. Es obligatorio usar ElevenLabs.');
    }
}

// Función auxiliar para reproducir audio con timeout
function playAudio(audio) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Timeout al cargar el audio'));
        }, 5000);

        audio.onloadeddata = () => {
            console.log('✅ Audio cargado, reproduciendo...');
        };

        audio.onended = () => {
            console.log('✅ Audio reproducido correctamente');
            clearTimeout(timeout);
            resolve();
        };

        audio.onerror = (error) => {
            console.error('❌ Error al reproducir audio:', error);
            clearTimeout(timeout);
            reject(new Error('Error al reproducir el audio: ' + error.message));
        };

        // Intentar reproducir
        audio.play().then(() => {
            console.log('▶️ Reproduciendo audio...');
        }).catch((err) => {
            clearTimeout(timeout);
            reject(err);
        });
    });
}

// Mostrar resultado online para ambos jugadores
function showOnlineResult(resultData) {
    // Determinar quién es el jugador local
    const roomRef = gameState.online.database.ref(`rooms/${gameState.online.roomCode}`);
    roomRef.child('players').once('value').then((snapshot) => {
        const players = snapshot.val();
        if (!players) return;

        const playerIds = Object.keys(players);
        const isPlayer1 = playerIds[0] === gameState.online.playerId;

        // Determinar resultado desde la perspectiva del jugador local
        let result, winner;
        if (resultData.result === 'Empate') {
            result = 'Empate';
            winner = 'tie';
        } else {
            // El resultado viene desde la perspectiva del jugador 1
            if (isPlayer1) {
                result = resultData.result;
                winner = result === 'Ganaste' ? 'player1' : 'opponent';
            } else {
                // Invertir resultado para jugador 2
                result = resultData.result === 'Ganaste' ? 'Perdiste' : 'Ganaste';
                winner = result === 'Ganaste' ? 'player1' : 'opponent';
            }
        }

        // Actualizar scores localmente
        gameState.scores.player1 = resultData.player1Score;
        gameState.scores.opponent = resultData.player2Score;
        gameState.scores.rounds = resultData.rounds;

        // Mostrar resultado
        showResult(result, resultData.player1Gesture, resultData.player2Gesture, winner);
        updateScores();

        // Anunciar con voz
        const player1Name = GESTURES[resultData.player1Gesture].name.toLowerCase();
        const player2Name = GESTURES[resultData.player2Gesture].name.toLowerCase();
        let message = '';
        if (result === 'Empate') {
            message = `Empate. Ambos eligieron ${player1Name}.`;
        } else if (result === 'Ganaste') {
            message = `Tú elegiste ${isPlayer1 ? player1Name : player2Name}. Tu oponente eligió ${isPlayer1 ? player2Name : player1Name}. ¡Ganaste esta ronda!`;
        } else {
            message = `Tú elegiste ${isPlayer1 ? player1Name : player2Name}. Tu oponente eligió ${isPlayer1 ? player2Name : player1Name}. Tu oponente gana esta ronda.`;
        }

        speak(message).catch(err => console.error('Error al anunciar:', err));

        // Limpiar resultado después de mostrarlo
        setTimeout(() => {
            roomRef.child('gameState/result').set(null);
        }, 5000);
    });
}

// Cargar voces disponibles al iniciar
if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = () => {
        // Las voces están cargadas
    };
}

// Actualizar marcadores
function updateScores() {
    document.getElementById('score-player1').textContent = gameState.scores.player1;
    document.getElementById('score-opponent').textContent = gameState.scores.opponent;
    document.getElementById('rounds-count').textContent = gameState.scores.rounds;

    // Mostrar resultado en el panel central
    const resultDisplay = document.getElementById('result-display');
    const resultText = document.getElementById('result-text');

    if (gameState.scores.rounds > 0) {
        resultDisplay.classList.remove('hidden');
        // El texto del resultado se muestra en el modal
    }
}

// Reiniciar marcador
function resetScores() {
    gameState.scores = {
        player1: 0,
        opponent: 0,
        rounds: 0
    };
    updateScores();
    document.getElementById('result-display').classList.add('hidden');
}

// Cambiar modo de juego
async function toggleMode() {
    if (gameState.isPlaying) {
        alert('No puedes cambiar el modo mientras se está jugando una ronda.');
        return;
    }

    const initBtn = document.getElementById('initCameraBtn');
    const startBtn = document.getElementById('startBtn');

    gameState.mode = gameState.mode === 'system' ? 'player' : 'system';

    if (gameState.mode === 'player') {
        // Modo jugador vs jugador - abrir modal online directamente
        openOnlineModal();

        // Ocultar segunda cámara hasta que se inicialice
        document.getElementById('webcam-container-2').classList.add('hidden');
        document.getElementById('label-container-2').classList.add('hidden');
        // Si había una cámara inicializada, detenerla para reinicializar
        if (webcam2) {
            webcam2.stop();
            webcam2 = null;
            model2 = null;
        }
        // Deshabilitar botón de inicio hasta que se inicialice la cámara
        startBtn.disabled = true;
        initBtn.disabled = false;
        initBtn.textContent = 'Inicializar Cámara';
        initBtn.style.background = '';
    } else {
        // Ocultar segunda cámara en modo sistema
        document.getElementById('webcam-container-2').classList.add('hidden');
        document.getElementById('label-container-2').classList.add('hidden');
        if (webcam2) {
            webcam2.stop();
            webcam2 = null;
            model2 = null;
        }
        // Si la cámara del jugador 1 está inicializada, habilitar inicio
        if (webcam1) {
            startBtn.disabled = false;
        }
    }

    updateUI();
}

// Actualizar UI según el modo
function updateUI() {
    const modeBtn = document.getElementById('modeBtn');
    const opponentTitle = document.getElementById('opponent-title');
    const opponentLabel = document.getElementById('opponent-label');
    const systemEmoji = document.getElementById('system-emoji');
    const systemText = document.getElementById('system-text');

    if (gameState.mode === 'system') {
        modeBtn.textContent = 'Modo: Jugador vs Sistema';
        opponentTitle.textContent = 'Sistema';
        opponentLabel.textContent = 'Sistema';
        systemEmoji.textContent = '🤖';
        systemText.textContent = 'Esperando...';
    } else {
        modeBtn.textContent = 'Modo: Jugador vs Jugador';
        opponentTitle.textContent = 'Jugador 2';
        opponentLabel.textContent = 'Jugador 2';
        systemEmoji.textContent = '👤';
        systemText.textContent = 'Esperando...';
    }
}

// Utilidad: sleep
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// SISTEMA DE JUEGO ONLINE CON FIREBASE
// ============================================

// Generar código de sala aleatorio
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Generar ID único para el jugador
function generatePlayerId() {
    return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Abrir modal de juego online
function openOnlineModal() {
    document.getElementById('onlineModal').classList.remove('hidden');
    document.getElementById('onlineMenu').classList.remove('hidden');
    document.getElementById('roomCodeSection').classList.add('hidden');
}

// Cerrar modal de juego online
function closeOnlineModal() {
    document.getElementById('onlineModal').classList.add('hidden');
    // No salir automáticamente de la sala al cerrar el modal
    // El usuario puede seguir jugando
}

// Mostrar interfaz para unirse a sala
function showJoinRoom() {
    // Verificar que la cámara esté inicializada
    if (!webcam1) {
        const shouldInit = confirm('Para jugar online necesitas inicializar la cámara primero.\n\n¿Deseas inicializarla ahora?');
        if (shouldInit) {
            initializeCamera().then(() => {
                showJoinRoomUI();
            }).catch(error => {
                alert('Error al inicializar la cámara: ' + error.message);
            });
            return;
        } else {
            return;
        }
    }
    showJoinRoomUI();
}

function showJoinRoomUI() {
    document.getElementById('onlineMenu').classList.add('hidden');
    document.getElementById('roomCodeSection').classList.remove('hidden');
    document.getElementById('roomCodeTitle').textContent = 'Unirse a Sala';
    document.getElementById('roomCodeDisplay').textContent = '';
    document.getElementById('copyCodeBtn').style.display = 'none';
    document.getElementById('roomStatus').textContent = 'Ingresa el código de 6 caracteres que te compartió el anfitrión';
    document.getElementById('roomCodeInput').style.display = 'block';
    document.getElementById('roomCodeInput').value = '';
    document.getElementById('roomCodeInput').focus();
    document.getElementById('joinWithCodeBtn').style.display = 'inline-block';
    document.getElementById('roomPlayers').innerHTML = '';
}

// Crear sala
async function createRoom() {
    // Verificar que la cámara esté inicializada
    if (!webcam1) {
        const shouldInit = confirm('Para jugar online necesitas inicializar la cámara primero.\n\n¿Deseas inicializarla ahora?');
        if (shouldInit) {
            try {
                await initializeCamera();
            } catch (error) {
                alert('Error al inicializar la cámara: ' + error.message);
                return;
            }
        } else {
            return;
        }
    }

    if (typeof firebase === 'undefined') {
        alert('Firebase no está cargado. Por favor, configura Firebase en firebase-config.js\n\nConsulta FIREBASE_SETUP.md para más información.');
        return;
    }

    // Validar que Firebase esté configurado correctamente
    if (typeof firebaseConfig === 'undefined') {
        alert('❌ Firebase no está configurado.\n\nPor favor:\n1. Abre firebase-config.js\n2. Configura tus credenciales de Firebase\n3. Recarga la página\n\nConsulta FIREBASE_SETUP.md para más información.');
        return;
    }

    // Validar que las credenciales no sean placeholders
    if (firebaseConfig.apiKey === 'TU_API_KEY' ||
        firebaseConfig.databaseURL === 'https://TU_PROJECT_ID-default-rtdb.firebaseio.com' ||
        firebaseConfig.projectId === 'TU_PROJECT_ID') {
        alert('❌ Firebase no está configurado correctamente.\n\nPor favor:\n1. Abre firebase-config.js\n2. Reemplaza los valores de placeholder (TU_API_KEY, etc.) con tus credenciales reales de Firebase\n3. Recarga la página\n\nConsulta FIREBASE_SETUP.md para más información.');
        return;
    }

    try {
        const createBtn = document.getElementById('createRoomBtn');
        createBtn.disabled = true;
        createBtn.textContent = 'Creando sala...';

        const roomCode = generateRoomCode();
        const playerId = generatePlayerId();

        // Inicializar Firebase si no está inicializado
        if (!firebaseApp) {
            try {
                firebaseApp = firebase.initializeApp(firebaseConfig);
                firebaseDatabase = firebase.database();
                console.log('✅ Firebase inicializado desde createRoom');
            } catch (initError) {
                throw new Error('Error al inicializar Firebase: ' + initError.message);
            }
        }

        // Verificar que firebaseDatabase esté disponible
        if (!firebaseDatabase) {
            firebaseDatabase = firebase.database();
        }

        gameState.online.isOnline = true;
        gameState.online.roomCode = roomCode;
        gameState.online.isHost = true;
        gameState.online.playerId = playerId;
        gameState.online.database = firebaseDatabase;
        gameState.mode = 'online';

        // Actualizar UI para modo online
        updateUIForOnlineMode();

        // Crear sala en Firebase con timeout
        const roomRef = firebaseDatabase.ref(`rooms/${roomCode}`);

        // Crear una promesa con timeout
        const createRoomPromise = roomRef.set({
            host: playerId,
            players: {
                [playerId]: {
                    name: 'Jugador 1 (Anfitrión)',
                    gesture: null,
                    ready: false,
                    score: 0,
                    isHost: true
                }
            },
            status: 'waiting',
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            gameState: {
                isPlaying: false,
                countdown: 0,
                round: 0
            }
        });

        // Timeout de 10 segundos para la operación
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout: La operación tardó demasiado. Verifica tu conexión a internet y las credenciales de Firebase.')), 10000);
        });

        // Esperar a que se complete la operación o el timeout
        await Promise.race([createRoomPromise, timeoutPromise]);

        console.log('✅ Sala creada en Firebase:', roomCode);

        // Mostrar código de sala con todas las opciones
        document.getElementById('onlineMenu').classList.add('hidden');
        document.getElementById('roomCodeSection').classList.remove('hidden');
        document.getElementById('roomCodeTitle').textContent = '🎮 Sala Creada';
        document.getElementById('roomCodeDisplay').textContent = roomCode;
        document.getElementById('copyCodeBtn').style.display = 'inline-block';
        document.getElementById('roomCodeInput').style.display = 'none';
        document.getElementById('joinWithCodeBtn').style.display = 'none';
        document.getElementById('roomStatus').innerHTML = `
            <strong>Comparte este código con tu oponente:</strong><br>
            <span style="font-size: 1.5rem; letter-spacing: 3px;">${roomCode}</span><br><br>
            Esperando a que otro jugador se una...
        `;
        updateRoomPlayers();

        // Escuchar cuando alguien se une
        roomRef.child('players').on('value', (snapshot) => {
            const players = snapshot.val();
            if (players) {
                updateRoomPlayers();
                const playerCount = Object.keys(players).length;
                if (playerCount >= 2) {
                    document.getElementById('roomStatus').innerHTML = `
                        <strong style="color: #4ade80;">✅ ¡Jugador conectado!</strong><br>
                        Ambos jugadores están listos.<br>
                        Haz clic en <strong>"Iniciar Juego"</strong> para comenzar.
                    `;
                    gameState.online.database.ref(`rooms/${roomCode}/status`).set('ready');
                    // Mostrar y habilitar botón de inicio en el modal
                    const startGameOnlineBtn = document.getElementById('startGameOnlineBtn');
                    startGameOnlineBtn.style.display = 'inline-block';
                    startGameOnlineBtn.disabled = false;
                    // También habilitar botón principal
                    document.getElementById('startBtn').disabled = false;
                } else {
                    document.getElementById('roomStatus').innerHTML = `
                        <strong>Comparte este código con tu oponente:</strong><br>
                        <span style="font-size: 1.5rem; letter-spacing: 3px;">${roomCode}</span><br><br>
                        Esperando a que otro jugador se una...
                    `;
                    document.getElementById('startGameOnlineBtn').style.display = 'none';
                    document.getElementById('startBtn').disabled = true;
                }
            }
        });

        // Escuchar gestos del oponente
        roomRef.child('players').on('child_changed', (snapshot) => {
            const playerData = snapshot.val();
            const playerId = snapshot.key;

            // Si no es el jugador local y tiene un gesto, actualizar UI
            if (playerId !== gameState.online.playerId && playerData.gesture) {
                gameState.player2Gesture = playerData.gesture;
                updateGestureDisplay('gesture2', playerData.gesture);
            }
            updateRoomPlayers();
        });

        // Escuchar cambios en el estado del juego
        roomRef.child('gameState').on('value', (snapshot) => {
            const onlineGameState = snapshot.val();
            if (onlineGameState) {
                handleOnlineGameState(onlineGameState);

                // Si hay un resultado, mostrarlo
                if (onlineGameState.result) {
                    showOnlineResult(onlineGameState.result);
                }

                // Si hay error de indeterminado
                if (onlineGameState.error === 'indeterminado') {
                    const errorMessage = 'Uno de los jugadores no eligió su movimiento correctamente. Por favor, inicia el juego nuevamente mostrando el gesto más claramente.';
                    speak(errorMessage).catch(err => console.error('Error al anunciar:', err));
                    alert(errorMessage);
                    roomRef.child('gameState/error').set(null); // Limpiar error
                }
            }
        });

        // Limpiar sala después de 30 minutos de inactividad
        setTimeout(async () => {
            if (gameState.online.roomCode === roomCode) {
                const snapshot = await roomRef.child('players').once('value');
                const players = snapshot.val();
                if (players && Object.keys(players).length < 2) {
                    roomRef.remove();
                    alert('La sala se cerró por inactividad.');
                    closeOnlineModal();
                }
            }
        }, 30 * 60 * 1000);

        console.log('✅ Sala creada exitosamente:', roomCode);
        createBtn.disabled = false;
        createBtn.textContent = 'Crear Sala';

    } catch (error) {
        console.error('❌ Error al crear sala:', error);

        let errorMessage = 'Error al crear sala:\n\n' + error.message;

        // Mensajes de error más específicos
        if (error.message.includes('permission') || error.message.includes('Permission') || error.message.includes('permission_denied')) {
            errorMessage += '\n\n⚠️ ERROR DE PERMISOS DE FIREBASE\n\n';
            errorMessage += 'Las reglas de seguridad de Firebase están bloqueando la escritura.\n\n';
            errorMessage += 'SOLUCIÓN:\n';
            errorMessage += '1. Ve a Firebase Console: https://console.firebase.google.com/\n';
            errorMessage += '2. Selecciona tu proyecto: piedra-papel-tijeras-112d9\n';
            errorMessage += '3. Ve a Realtime Database > Reglas\n';
            errorMessage += '4. Reemplaza las reglas con:\n\n';
            errorMessage += '{\n';
            errorMessage += '  "rules": {\n';
            errorMessage += '    "rooms": {\n';
            errorMessage += '      ".read": true,\n';
            errorMessage += '      ".write": true\n';
            errorMessage += '    }\n';
            errorMessage += '  }\n';
            errorMessage += '}\n\n';
            errorMessage += '5. Haz clic en "Publicar"\n\n';
            errorMessage += 'Consulta REGLAS_FIREBASE.md para más detalles.';
        } else if (error.message.includes('network') || error.message.includes('Network')) {
            errorMessage += '\n\n⚠️ Error de conexión.\nVerifica tu conexión a internet.';
        } else if (error.message.includes('Timeout')) {
            errorMessage += '\n\n⚠️ La operación tardó demasiado.\nVerifica:\n1. Tu conexión a internet\n2. Que Firebase esté configurado correctamente\n3. Que las reglas de seguridad permitan escritura';
        } else if (error.message.includes('initializeApp')) {
            errorMessage += '\n\n⚠️ Error al inicializar Firebase.\nVerifica que las credenciales en firebase-config.js sean correctas.';
        }

        alert(errorMessage);

        // Restaurar botón
        const createBtn = document.getElementById('createRoomBtn');
        if (createBtn) {
            createBtn.disabled = false;
            createBtn.textContent = 'Crear Sala';
        }
    }
}

// Unirse a sala
async function joinRoom() {
    // Verificar que la cámara esté inicializada
    if (!webcam1) {
        const shouldInit = confirm('Para jugar online necesitas inicializar la cámara primero.\n\n¿Deseas inicializarla ahora?');
        if (shouldInit) {
            try {
                await initializeCamera();
            } catch (error) {
                alert('Error al inicializar la cámara: ' + error.message);
                return;
            }
        } else {
            return;
        }
    }

    if (typeof firebase === 'undefined') {
        alert('Firebase no está cargado. Por favor, configura Firebase en firebase-config.js\n\nConsulta FIREBASE_SETUP.md para más información.');
        return;
    }

    const roomCode = document.getElementById('roomCodeInput').value.trim().toUpperCase();

    if (!roomCode || roomCode.length !== 6) {
        alert('Por favor, ingresa un código de sala válido (6 caracteres)');
        document.getElementById('roomCodeInput').focus();
        return;
    }

    try {
        const joinBtn = document.getElementById('joinWithCodeBtn');
        joinBtn.disabled = true;
        joinBtn.textContent = 'Conectando...';

        const playerId = generatePlayerId();

        // Inicializar Firebase si no está inicializado
        if (!firebaseApp) {
            if (typeof firebaseConfig !== 'undefined') {
                firebaseApp = firebase.initializeApp(firebaseConfig);
                firebaseDatabase = firebase.database();
            } else {
                throw new Error('Firebase no está configurado. Por favor, configura firebase-config.js');
            }
        }

        const roomRef = firebaseDatabase.ref(`rooms/${roomCode}`);

        // Verificar que la sala existe
        const snapshot = await roomRef.once('value');
        if (!snapshot.exists()) {
            alert('La sala no existe. Verifica el código.');
            return;
        }

        const roomData = snapshot.val();
        if (roomData.status === 'playing') {
            alert('La partida ya está en curso. Intenta con otra sala.');
            return;
        }

        // Unirse a la sala
        gameState.online.isOnline = true;
        gameState.online.roomCode = roomCode;
        gameState.online.isHost = false;
        gameState.online.playerId = playerId;
        gameState.online.database = firebaseDatabase;
        gameState.mode = 'online';

        await roomRef.child(`players/${playerId}`).set({
            name: 'Jugador 2',
            gesture: null,
            ready: false,
            score: 0
        });

        // Actualizar UI
        updateUIForOnlineMode();
        document.getElementById('onlineMenu').classList.add('hidden');
        document.getElementById('roomCodeSection').classList.remove('hidden');
        document.getElementById('roomCodeTitle').textContent = '✅ Conectado a Sala';
        document.getElementById('roomCodeDisplay').textContent = roomCode;
        document.getElementById('copyCodeBtn').style.display = 'none';
        document.getElementById('roomStatus').innerHTML = `
            <strong style="color: #4ade80;">✅ Conectado exitosamente</strong><br>
            Esperando a que el anfitrión inicie el juego...<br>
            <small style="opacity: 0.8;">Puedes cerrar esta ventana y seguir conectado.</small>
        `;
        document.getElementById('roomCodeInput').style.display = 'none';
        document.getElementById('joinWithCodeBtn').style.display = 'none';
        updateRoomPlayers();

        // Escuchar cambios en el estado del juego
        roomRef.child('gameState').on('value', (snapshot) => {
            const onlineGameState = snapshot.val();
            if (onlineGameState) {
                handleOnlineGameState(onlineGameState);

                // Si hay un resultado, mostrarlo
                if (onlineGameState.result) {
                    showOnlineResult(onlineGameState.result);
                }

                // Si hay error de indeterminado
                if (onlineGameState.error === 'indeterminado') {
                    const errorMessage = 'Uno de los jugadores no eligió su movimiento correctamente. Por favor, inicia el juego nuevamente mostrando el gesto más claramente.';
                    speak(errorMessage).catch(err => console.error('Error al anunciar:', err));
                    alert(errorMessage);
                    roomRef.child('gameState/error').set(null); // Limpiar error
                }
            }
        });

        // Escuchar gestos del oponente
        roomRef.child('players').on('child_changed', (snapshot) => {
            const playerData = snapshot.val();
            const playerId = snapshot.key;

            // Si no es el jugador local y tiene un gesto, actualizar UI
            if (playerId !== gameState.online.playerId && playerData.gesture) {
                gameState.player2Gesture = playerData.gesture;
                updateGestureDisplay('gesture2', playerData.gesture);
            }
            updateRoomPlayers();
        });

        // Escuchar cuando se unen jugadores
        roomRef.child('players').on('value', (snapshot) => {
            updateRoomPlayers();
        });

        // Notificar al host que hay un jugador
        roomRef.child('status').set('ready');

        console.log('✅ Unido a sala exitosamente:', roomCode);
        joinBtn.disabled = false;
        joinBtn.textContent = 'Unirse';

    } catch (error) {
        console.error('Error al unirse a sala:', error);
        alert('Error al unirse a sala:\n\n' + error.message + '\n\nVerifica que:\n1. El código de sala sea correcto\n2. La sala no esté llena\n3. Firebase esté configurado correctamente');
        document.getElementById('joinWithCodeBtn').disabled = false;
        document.getElementById('joinWithCodeBtn').textContent = 'Unirse';
    }
}

// Manejar estado del juego online
function handleOnlineGameState(onlineGameState) {
    if (onlineGameState.isPlaying && !gameState.isPlaying) {
        // El juego ha comenzado
        startOnlineGame();
    }

    if (onlineGameState.countdown !== undefined && onlineGameState.countdown > 0) {
        // Mostrar cuenta regresiva
        showCountdown(onlineGameState.countdown);
    }
}

// Iniciar juego online (solo el host puede iniciar)
async function startOnlineGame() {
    if (!gameState.online.isOnline) return;

    // Solo el host inicia la cuenta regresiva
    if (gameState.online.isHost) {
        gameState.isPlaying = true;
        const roomRef = gameState.online.database.ref(`rooms/${gameState.online.roomCode}`);

        // Iniciar cuenta regresiva sincronizada
        await roomRef.child('gameState/countdown').set(3);
        await sleep(1000);
        await roomRef.child('gameState/countdown').set(2);
        await sleep(1000);
        await roomRef.child('gameState/countdown').set(1);
        await sleep(1000);
        await roomRef.child('gameState/countdown').set(0);
        await roomRef.child('gameState/isPlaying').set(true);
    }

    // Ambos jugadores capturan su gesto cuando el juego inicia
    await sleep(1000); // Esperar después del "¡YA!"
    await captureGestures();

    if (gameState.player1Gesture && gameState.player1Gesture !== 'Indeterminado') {
        const roomRef = gameState.online.database.ref(`rooms/${gameState.online.roomCode}`);
        await roomRef.child(`players/${gameState.online.playerId}/gesture`).set(gameState.player1Gesture);
        await roomRef.child(`players/${gameState.online.playerId}/ready`).set(true);
        console.log('✅ Gesto enviado a Firebase:', gameState.player1Gesture);
    } else {
        console.warn('⚠️ No se pudo detectar gesto válido para enviar');
    }

    // Solo el host verifica el resultado
    if (gameState.online.isHost) {
        // Esperar un momento para que el otro jugador envíe su gesto
        setTimeout(checkOnlineGameResult, 2000);
    }
}

// Verificar resultado del juego online
async function checkOnlineGameResult() {
    if (!gameState.online.isOnline) return;

    const roomRef = gameState.online.database.ref(`rooms/${gameState.online.roomCode}`);
    const snapshot = await roomRef.child('players').once('value');
    const players = snapshot.val();

    if (!players) return;

    const playerIds = Object.keys(players);
    if (playerIds.length < 2) return;

    // Verificar que ambos jugadores tengan gestos
    const player1Data = players[playerIds[0]];
    const player2Data = players[playerIds[1]];

    if (!player1Data.gesture || !player2Data.gesture) {
        // Esperar un poco más
        setTimeout(checkOnlineGameResult, 500);
        return;
    }

    // Determinar quién es el jugador local
    const isPlayer1 = playerIds[0] === gameState.online.playerId;
    const localGesture = isPlayer1 ? player1Data.gesture : player2Data.gesture;
    const opponentGesture = isPlayer1 ? player2Data.gesture : player1Data.gesture;

    // Comparar gestos
    gameState.player1Gesture = localGesture;
    gameState.player2Gesture = opponentGesture;

    // Comparar y mostrar resultado
    compareGestures();

    // Enviar resultado a Firebase para que ambos jugadores lo vean
    // El resultado se calcula desde la perspectiva del jugador 1 (host)
    const p1Index = GESTURE_ORDER.indexOf(localGesture);
    const p2Index = GESTURE_ORDER.indexOf(opponentGesture);
    const diff = (p1Index - p2Index + 3) % 3;

    let resultFromPlayer1Perspective;
    if (diff === 0) {
        resultFromPlayer1Perspective = 'Empate';
    } else if (diff === 1) {
        resultFromPlayer1Perspective = 'Ganaste'; // Jugador 1 gana
    } else {
        resultFromPlayer1Perspective = 'Perdiste'; // Jugador 1 pierde
    }

    const resultData = {
        result: resultFromPlayer1Perspective,
        player1Gesture: localGesture,
        player2Gesture: opponentGesture,
        player1Score: isPlayer1 ? gameState.scores.player1 : gameState.scores.opponent,
        player2Score: isPlayer1 ? gameState.scores.opponent : gameState.scores.player1,
        rounds: gameState.scores.rounds
    };

    await roomRef.child('gameState/result').set(resultData);

    // Actualizar marcadores en Firebase
    if (isPlayer1) {
        await roomRef.child(`players/${playerIds[0]}/score`).set(gameState.scores.player1);
        await roomRef.child(`players/${playerIds[1]}/score`).set(gameState.scores.opponent);
    } else {
        await roomRef.child(`players/${playerIds[0]}/score`).set(gameState.scores.opponent);
        await roomRef.child(`players/${playerIds[1]}/score`).set(gameState.scores.player1);
    }

    // Resetear para siguiente ronda
    await roomRef.child('gameState/isPlaying').set(false);
    await roomRef.child(`players/${playerIds[0]}/gesture`).set(null);
    await roomRef.child(`players/${playerIds[0]}/ready`).set(false);
    await roomRef.child(`players/${playerIds[1]}/gesture`).set(null);
    await roomRef.child(`players/${playerIds[1]}/ready`).set(false);

    gameState.isPlaying = false;
    document.getElementById('startBtn').disabled = false;
}

// Modificar startGame para soportar modo online
async function startGameOnline() {
    if (!gameState.online.isOnline) return;

    if (gameState.online.isHost) {
        // Solo el host puede iniciar el juego
        await startOnlineGame();
    } else {
        alert('Solo el anfitrión puede iniciar el juego. Espera a que inicie la ronda.');
    }
}

// Mostrar cuenta regresiva
function showCountdown(number) {
    const countdownElement = document.getElementById('countdown');
    countdownElement.textContent = number;
    countdownElement.classList.remove('hidden');
    if (number === 0) {
        setTimeout(() => countdownElement.classList.add('hidden'), 500);
    }
}

// Copiar código de sala al portapapeles
function copyRoomCode() {
    const roomCode = gameState.online.roomCode;
    if (!roomCode) return;

    navigator.clipboard.writeText(roomCode).then(() => {
        const copyBtn = document.getElementById('copyCodeBtn');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ ¡Copiado!';
        copyBtn.style.background = 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)';
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('Error al copiar:', err);
        alert('No se pudo copiar el código. Código: ' + roomCode);
    });
}

// Actualizar lista de jugadores en la sala
function updateRoomPlayers() {
    if (!gameState.online.isOnline || !gameState.online.database) return;

    const roomRef = gameState.online.database.ref(`rooms/${gameState.online.roomCode}`);
    roomRef.child('players').once('value').then((snapshot) => {
        const players = snapshot.val();
        if (!players) return;

        const playersList = document.getElementById('roomPlayers');
        playersList.innerHTML = '<strong>Jugadores en la sala:</strong><br>';

        Object.keys(players).forEach((playerId, index) => {
            const player = players[playerId];
            const isLocal = playerId === gameState.online.playerId;
            const isHost = player.isHost || playerId === gameState.online.roomCode;
            playersList.innerHTML += `
                <div style="margin: 5px 0; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 5px;">
                    ${isLocal ? '👤 Tú' : '👤 ' + player.name} ${isHost ? '(Anfitrión)' : ''}
                    ${player.ready ? ' ✅' : ''}
                </div>
            `;
        });
    });
}

// Actualizar UI para modo online
function updateUIForOnlineMode() {
    const opponentTitle = document.getElementById('opponent-title');
    const opponentLabel = document.getElementById('opponent-label');
    const modeBtn = document.getElementById('modeBtn');

    opponentTitle.textContent = 'Oponente Online';
    opponentLabel.textContent = 'Oponente';
    modeBtn.textContent = 'Modo: Online';
    modeBtn.disabled = true; // Deshabilitar cambio de modo cuando está online
}

// Salir de la sala
function leaveRoom() {
    if (gameState.online.isOnline && gameState.online.database) {
        const roomRef = gameState.online.database.ref(`rooms/${gameState.online.roomCode}`);
        if (gameState.online.isHost) {
            // Si es el host, eliminar la sala
            roomRef.remove().catch(err => console.error('Error al eliminar sala:', err));
        } else {
            // Si es jugador, solo salir
            roomRef.child(`players/${gameState.online.playerId}`).remove().catch(err => console.error('Error al salir:', err));
        }
    }

    gameState.online.isOnline = false;
    gameState.online.roomCode = null;
    gameState.online.isHost = false;
    gameState.online.playerId = null;
    gameState.online.database = null;
    gameState.mode = 'system';

    // Restaurar UI
    const modeBtn = document.getElementById('modeBtn');
    modeBtn.disabled = false;
    updateUI();

    closeOnlineModal();
}

// Inicializar cámara al cargar la página
window.addEventListener('load', async () => {
    // Esperar un momento antes de inicializar
    await sleep(500);

    // Verificar Firebase al cargar
    if (typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined') {
        // Validar que las credenciales no sean placeholders
        if (firebaseConfig.apiKey !== 'TU_API_KEY' &&
            firebaseConfig.databaseURL !== 'https://TU_PROJECT_ID-default-rtdb.firebaseio.com' &&
            firebaseConfig.projectId !== 'TU_PROJECT_ID') {
            try {
                if (!firebaseApp) {
                    firebaseApp = firebase.initializeApp(firebaseConfig);
                    firebaseDatabase = firebase.database();
                    console.log('✅ Firebase inicializado al cargar la página');
                }
            } catch (error) {
                console.warn('⚠️ Error al inicializar Firebase al cargar:', error);
            }
        } else {
            console.warn('⚠️ Firebase no está configurado. Configura firebase-config.js para usar el modo online.');
        }
    } else {
        console.warn('⚠️ Firebase SDK no está cargado. El modo online no funcionará.');
    }

    // No inicializar automáticamente, esperar a que el usuario haga clic en "Iniciar Juego"
});