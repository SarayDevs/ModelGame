# 🔒 Reglas de Seguridad de Firebase para el Juego

## ⚠️ IMPORTANTE: Configura estas reglas en Firebase Console

El error `permission_denied` se debe a que las reglas de seguridad no permiten escribir en la base de datos.

## 📝 Pasos para Configurar las Reglas

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **piedra-papel-tijeras-112d9**
3. En el menú lateral, ve a **Realtime Database**
4. Haz clic en la pestaña **"Reglas"** (Rules)
5. **Reemplaza completamente** el contenido con las siguientes reglas:

```json
{
  "rules": {
    "rooms": {
      ".read": true,
      ".write": true,
      "$roomCode": {
        ".read": true,
        ".write": true,
        "players": {
          "$playerId": {
            ".read": true,
            ".write": true
          }
        },
        "gameState": {
          ".read": true,
          ".write": true
        }
      }
    }
  }
}
```

6. Haz clic en **"Publicar"** (Publish)

## ✅ Reglas Alternativas (Más Seguras para Desarrollo)

Si quieres reglas un poco más estrictas pero que aún funcionen:

```json
{
  "rules": {
    "rooms": {
      ".read": true,
      ".write": true,
      "$roomCode": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['host', 'players', 'status', 'gameState'])",
        "host": {
          ".validate": "newData.isString()"
        },
        "status": {
          ".validate": "newData.isString() && (newData.val() == 'waiting' || newData.val() == 'ready' || newData.val() == 'playing')"
        },
        "players": {
          "$playerId": {
            ".read": true,
            ".write": true,
            ".validate": "newData.hasChildren(['name', 'gesture', 'ready', 'score'])",
            "name": {
              ".validate": "newData.isString()"
            },
            "gesture": {
              ".validate": "newData.val() == null || newData.isString()"
            },
            "ready": {
              ".validate": "newData.isBoolean()"
            },
            "score": {
              ".validate": "newData.isNumber() && newData.val() >= 0"
            }
          }
        },
        "gameState": {
          ".read": true,
          ".write": true,
          ".validate": "newData.hasChildren(['isPlaying', 'countdown', 'round'])",
          "isPlaying": {
            ".validate": "newData.isBoolean()"
          },
          "countdown": {
            ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 3"
          },
          "round": {
            ".validate": "newData.isNumber() && newData.val() >= 0"
          }
        }
      }
    }
  }
}
```

## 🎯 Reglas Mínimas (Solo para Pruebas Rápidas)

Si solo quieres probar rápidamente sin validaciones:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

⚠️ **ADVERTENCIA**: Estas reglas permiten acceso total. Solo úsalas para desarrollo local.

## 🔍 Verificar que Funcionó

Después de publicar las reglas:

1. Recarga la página del juego
2. Intenta crear una sala nuevamente
3. Si funciona, deberías ver en la consola: `✅ Sala creada en Firebase: [CÓDIGO]`
4. Si aún hay errores, verifica que:
   - Las reglas se publicaron correctamente
   - Estás usando la base de datos correcta (Realtime Database, no Firestore)
   - Tu conexión a internet está funcionando

## 📸 Ubicación Visual en Firebase Console

```
Firebase Console
├── Tu Proyecto (piedra-papel-tijeras-112d9)
    ├── Realtime Database  ← Aquí
        ├── Data (pestaña)
        └── Rules (pestaña) ← Aquí es donde cambias las reglas
```

## 🐛 Si Aún No Funciona

1. Verifica que estés en **Realtime Database** (no Firestore)
2. Asegúrate de que la base de datos esté en modo **"Test Mode"** o con las reglas personalizadas
3. Revisa la consola del navegador para más detalles del error
4. Verifica que la URL de la base de datos en `firebase-config.js` sea correcta

