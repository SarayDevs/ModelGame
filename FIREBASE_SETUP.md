# 🔥 Configuración de Firebase para Juego Online

Este documento explica cómo configurar Firebase Realtime Database para habilitar el modo de juego online.

## 📋 Pasos para Configurar Firebase

### 1. Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en **"Agregar proyecto"** o **"Crear proyecto"**
3. Ingresa un nombre para tu proyecto (ej: "piedra-papel-tijeras")
4. Sigue los pasos del asistente
5. **Desactiva** Google Analytics (opcional, no es necesario para este proyecto)

### 2. Habilitar Realtime Database

1. En el panel de Firebase, ve a **"Realtime Database"** en el menú lateral
2. Haz clic en **"Crear base de datos"**
3. Selecciona la ubicación más cercana a ti
4. Elige **"Modo de prueba"** (para desarrollo)
5. Haz clic en **"Habilitar"**

### 3. Configurar Reglas de Seguridad

1. Ve a la pestaña **"Reglas"** en Realtime Database
2. Reemplaza las reglas con:

```json
{
  "rules": {
    "rooms": {
      ".read": true,
      ".write": true,
      "$roomCode": {
        ".validate": "newData.hasChildren(['host', 'players', 'status', 'gameState'])",
        "players": {
          "$playerId": {
            ".validate": "newData.hasChildren(['name', 'gesture', 'ready', 'score'])"
          }
        }
      }
    }
  }
}
```

3. Haz clic en **"Publicar"**

### 4. Obtener Credenciales de Firebase

1. En Firebase Console, haz clic en el ícono de **⚙️ Configuración** (engranaje)
2. Selecciona **"Configuración del proyecto"**
3. Desplázate hasta **"Tus aplicaciones"**
4. Haz clic en el ícono **`</>`** (Web)
5. Registra la app con un nombre (ej: "Piedra Papel Tijeras Web")
6. **Copia las credenciales** que aparecen

### 5. Configurar en el Proyecto

1. Abre el archivo `firebase-config.js`
2. Reemplaza los valores con tus credenciales:

```javascript
const firebaseConfig = {
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "TU_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://TU_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_PROJECT_ID.appspot.com",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
};
```

3. Guarda el archivo

## ✅ Verificar Configuración

1. Abre `index.html` en tu navegador
2. Abre la consola (F12)
3. Deberías ver: `✅ Firebase inicializado correctamente`
4. Si ves un error, verifica que las credenciales sean correctas

## 🎮 Cómo Usar el Modo Online

### Para el Anfitrión (Jugador que crea la sala):

1. Haz clic en **"Jugar Online"**
2. Haz clic en **"Crear Sala"**
3. Se generará un código de 6 caracteres (ej: "ABC123")
4. **Comparte este código** con el otro jugador
5. Espera a que el otro jugador se una
6. Cuando ambos estén listos, haz clic en **"Iniciar Juego"**

### Para el Jugador que se Une:

1. Haz clic en **"Jugar Online"**
2. Haz clic en **"Unirse a Sala"**
3. Ingresa el código de 6 caracteres que te dio el anfitrión
4. Haz clic en **"Unirse"**
5. Espera a que el anfitrión inicie el juego

## 🔒 Seguridad

- Las salas se eliminan automáticamente cuando el anfitrión sale
- Los códigos de sala son temporales y únicos
- Las reglas de Firebase permiten lectura/escritura para desarrollo
- Para producción, deberías implementar autenticación

## 🐛 Solución de Problemas

### "Firebase no está cargado"
- Verifica que los scripts de Firebase estén en el HTML
- Verifica que `firebase-config.js` esté cargado antes de `script.js`

### "Firebase no está configurado"
- Asegúrate de haber completado todos los pasos de configuración
- Verifica que las credenciales en `firebase-config.js` sean correctas

### "La sala no existe"
- Verifica que el código de sala sea correcto
- Asegúrate de que el anfitrión haya creado la sala
- Verifica tu conexión a internet

### Los jugadores no se sincronizan
- Verifica las reglas de seguridad de Firebase
- Asegúrate de que ambos jugadores tengan conexión a internet
- Revisa la consola del navegador para errores

## 📚 Recursos

- [Documentación de Firebase](https://firebase.google.com/docs)
- [Firebase Realtime Database](https://firebase.google.com/docs/database)
- [Reglas de Seguridad](https://firebase.google.com/docs/database/security)

