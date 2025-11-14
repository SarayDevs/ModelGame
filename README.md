# 🎮 Piedra, Papel o Tijeras - Controlado por IA

Un juego interactivo de "Piedra, Papel o Tijeras" que utiliza visión artificial (Teachable Machine) para detectar gestos y voz sintética para anunciar resultados.

## 🚀 Características

- **Reconocimiento de gestos en tiempo real** usando Teachable Machine
- **Dos modos de juego**:
  - Jugador vs Sistema (jugada aleatoria)
  - Jugador vs Jugador (dos cámaras)
- **Sistema de voz** con speechSynthesis (compatible con VAPI)
- **Interfaz moderna** con diseño arcade
- **Cuenta regresiva visual** antes de cada ronda
- **Marcador en tiempo real** con estadísticas

## 📋 Requisitos

- Navegador web moderno (Chrome, Firefox, Edge)
- Cámara web
- Conexión a Internet (para cargar TensorFlow.js y Teachable Machine)

## 🛠️ Instalación

1. Asegúrate de que el modelo de Teachable Machine esté en la carpeta `tm-my-image-model/`
2. Abre `index.html` en tu navegador
3. Permite el acceso a la cámara cuando se solicite

## 🎯 Uso

### Modo Jugador vs Sistema

1. Haz clic en **"Iniciar Juego"**
2. Muestra tu gesto (piedra ✊, papel ✋ o tijera ✌️) a la cámara
3. Espera la cuenta regresiva (3... 2... 1...)
4. El sistema elegirá aleatoriamente su jugada
5. Se mostrará el resultado y se anunciará con voz

### Modo Jugador vs Jugador

1. Haz clic en **"Cambiar modo"** para activar el modo multijugador
2. Cada jugador muestra su gesto a su respectiva cámara
3. Al finalizar la cuenta regresiva, se comparan ambas jugadas
4. Se muestra el ganador y se actualiza el marcador

## 🎨 Personalización

### Integración con VAPI

Para usar VAPI en lugar de speechSynthesis, descomenta y configura la función `speakWithVAPI()` en `script.js`:

```javascript
// Agrega tu API key de VAPI
const VAPI_API_KEY = 'tu_api_key_aqui';
```

**📖 Documentación Completa para VAPI:**
Consulta el archivo `VAPI_CONTEXT.md` para obtener una descripción detallada del juego, todos los mensajes de voz, estados del juego, y ejemplos de conversaciones. Este documento está diseñado específicamente para alimentar el sistema de voz VAPI con todo el contexto necesario.

### Modificar el modelo

El modelo de Teachable Machine se encuentra en `tm-my-image-model/`. Para usar un modelo diferente:

1. Entrena tu modelo en [Teachable Machine](https://teachablemachine.withgoogle.com/)
2. Descarga el modelo
3. Reemplaza los archivos en `tm-my-image-model/`

## 📁 Estructura del Proyecto

```
ProyectoTarea2/
├── index.html              # Página principal
├── styles.css              # Estilos CSS
├── script.js               # Lógica del juego
├── README.md              # Este archivo
└── tm-my-image-model/     # Modelo de Teachable Machine
    ├── model.json
    ├── metadata.json
    └── weights.bin
```

## 🔧 Tecnologías Utilizadas

- **HTML5** - Estructura
- **CSS3** - Estilos y animaciones
- **JavaScript** - Lógica del juego
- **TensorFlow.js** - Framework de machine learning
- **Teachable Machine** - Modelo de reconocimiento de imágenes
- **Web Speech API** - Síntesis de voz

## 📝 Notas

- El modelo requiere una probabilidad mínima del 70% para detectar un gesto
- La clase "Indeterminado" se ignora en las predicciones
- El juego funciona mejor con buena iluminación y fondo claro

## 🐛 Solución de Problemas

### La cámara no se inicia
- Verifica que hayas dado permisos de cámara al navegador
- Asegúrate de que ninguna otra aplicación esté usando la cámara

### No se detectan gestos
- Mejora la iluminación
- Asegúrate de que el gesto sea claro y visible
- Verifica que el modelo esté correctamente cargado

### La voz no funciona
- Verifica que tu navegador soporte Web Speech API
- En Chrome, asegúrate de que las voces estén disponibles

## 📄 Licencia

Este proyecto es de uso educativo y académico.

## 👨‍💻 Autor

Desarrollado como proyecto académico con integración de Teachable Machine y sistemas de voz.

