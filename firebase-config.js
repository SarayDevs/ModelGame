// Configuración de Firebase
// NOTA: Necesitas crear un proyecto en Firebase y obtener estas credenciales
// 1. Ve a https://console.firebase.google.com/
// 2. Crea un nuevo proyecto
// 3. Habilita Realtime Database
// 4. Copia la configuración aquí

const firebaseConfig = {
    apiKey: "AIzaSyBTjmcV9BBW4VnuDp28Mkp03O4QuTAqmVs",
    authDomain: "piedra-papel-tijeras-112d9.firebaseapp.com",
    databaseURL: "https://piedra-papel-tijeras-112d9-default-rtdb.firebaseio.com",
    projectId: "piedra-papel-tijeras-112d9",
    storageBucket: "piedra-papel-tijeras-112d9.firebasestorage.app",
    messagingSenderId: "184383784364",
    appId: "1:184383784364:web:5bc4d2c2160ee27068e609"
};

// Inicializar Firebase
let firebaseApp, firebaseDatabase;

if (typeof firebase !== 'undefined') {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    firebaseDatabase = firebase.database();
    console.log('✅ Firebase inicializado correctamente');
} else {
    console.warn('⚠️ Firebase no está cargado. El modo online no funcionará.');
}