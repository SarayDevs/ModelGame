# 🔑 Cómo Obtener tu API Key de ElevenLabs

## Pasos para Obtener tu API Key

### 1. Inicia Sesión en ElevenLabs
- Ve a: https://elevenlabs.io
- Inicia sesión con tu cuenta

### 2. Accede a tu Perfil
- Haz clic en tu **avatar/foto de perfil** en la esquina superior derecha
- O ve directamente a: https://elevenlabs.io/app/user/settings

### 3. Encuentra la Sección de API Key
- En el menú de configuración, busca la sección **"API Key"** o **"Profile"**
- También puedes ir directamente a: https://elevenlabs.io/app/settings/api-keys

### 4. Copia tu API Key
- Verás tu API key (una cadena larga de caracteres)
- Haz clic en el botón **"Copy"** o **"Show"** para revelarla
- **⚠️ IMPORTANTE**: La API key solo se muestra una vez. Si no la copias, tendrás que generar una nueva

### 5. Generar una Nueva API Key (si es necesario)
- Si no ves una API key o necesitas una nueva:
  - Haz clic en **"Generate New API Key"** o **"Create API Key"**
  - Copia la nueva clave inmediatamente

## 📝 Agregar la API Key al Proyecto

Una vez que tengas tu API key:

1. Abre el archivo `script.js`
2. Busca la línea:
   ```javascript
   const ELEVENLABS_API_KEY = '';
   ```
3. Reemplázala con:
   ```javascript
   const ELEVENLABS_API_KEY = 'tu_api_key_aqui';
   ```
4. Guarda el archivo

## 🔒 Seguridad

- **NUNCA** compartas tu API key públicamente
- **NUNCA** subas tu API key a repositorios públicos de GitHub
- Si accidentalmente compartiste tu API key, genera una nueva inmediatamente
- Considera usar variables de entorno para proyectos más grandes

## ✅ Verificar que Funciona

Después de agregar la API key:

1. Abre `index.html` en tu navegador
2. Abre la consola del navegador (F12)
3. Juega una ronda
4. Deberías ver en la consola:
   ```
   🎙️ Usando VAPI/ElevenLabs para sintetizar: [mensaje]
   Usando ElevenLabs API directamente
   ✅ Audio de ElevenLabs reproducido correctamente
   ```

## 🆘 Problemas Comunes

### "Invalid API Key"
- Verifica que copiaste la API key completa
- Asegúrate de que no hay espacios antes o después
- Verifica que la API key esté activa en tu cuenta de ElevenLabs

### "Rate Limit Exceeded"
- Has excedido el límite de caracteres de tu plan gratuito
- Considera actualizar tu plan o usar speechSynthesis como fallback

### "Voice Not Found"
- Verifica que el voice ID `n4x17EKVqyxfey8QMqvy` esté disponible en tu cuenta
- Algunas voces pueden requerir un plan de pago

## 📚 Recursos Adicionales

- Documentación de ElevenLabs: https://elevenlabs.io/docs
- Panel de API Keys: https://elevenlabs.io/app/settings/api-keys
- Soporte: https://elevenlabs.io/support

