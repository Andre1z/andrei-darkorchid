/**
 * signaling.js
 * 
 * Este módulo implementa la señalización usando Firebase Realtime Database.
 * Se utiliza para intercambiar mensajes de señalización (SDP, ICE candidates, etc.)
 * entre pares WebRTC sin disponer de un servidor de Node.js propio.
 *
 * Requisitos:
 *  - Incluir Firebase en el HTML.
 *  - Configurar Firebase con los parámetros propios de tu proyecto.
 *
 * Interfaz:
 *  - signaling.connect() inicia la conexión a la "sala" de señalización.
 *  - signaling.send(message) envía un mensaje a la sala.
 *
 * Callbacks que podrás definir externamente:
 *  - signaling.onOpen: se invoca cuando se establece la conexión.
 *  - signaling.onError: se invoca si ocurre un error.
 *  - signaling.onMessage: se invoca con cada mensaje entrante.
 *  - signaling.onRemoteStream: (opcional) para delegar el stream remoto,
 *      aunque normalmente la lógica de WebRTC se encarga de ello.
 */

// Configuración de Firebase (reemplaza con tus propios datos)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  databaseURL: "TU_DATABASE_URL",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializamos Firebase (si aún no se ha inicializado)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();

let roomRef = null;
let connected = false;

// Objeto signaling que administrará la conexión de señalización.
const signaling = {
  // Callbacks que se pueden definir desde elsewhere (por ejemplo, en app.js)
  onOpen: null,      // Se invoca cuando la conexión se establece.
  onError: null,     // Se invoca en caso de errores en la conexión.
  onMessage: null,   // Se invoca al recibir un mensaje de señalización.
  // Opcional: onRemoteStream (puedes asignarla si decides emitir un stream a través de señalización)
  onRemoteStream: null,
  
  roomId: null,      // Identificador de la sala de señalización.

  /**
   * connect()
   * Genera o utiliza una sala (room) identificada por un roomId y
   * se suscribe para recibir mensajes nuevos que se publiquen en esta.
   */
  connect: function() {
    // Intentamos obtener un roomId de la URL (hash) o generamos uno nuevo.
    this.roomId = location.hash.substring(1) || this._generateRoomId();
    location.hash = this.roomId;  // Actualiza la URL para facilitar el compartir la sala

    // Referencia a la sala en Firebase
    roomRef = db.ref('rooms/' + this.roomId);

    // Escucha nuevos mensajes en la sala.
    roomRef.on('child_added', snapshot => {
      const message = snapshot.val();
      // Aquí podrías filtrar mensajes (ej. omitir los que envió el mismo usuario si se agrega un ID)
      if (this.onMessage) {
        this.onMessage(message);
      }
    }, error => {
      if (this.onError) {
        this.onError(error);
      }
    });

    connected = true;
    if (this.onOpen) {
      this.onOpen();
    }
  },

  /**
   * send(message)
   * Envía un mensaje de señalización a la sala.
   * @param {Object} message - Objeto que contiene la información de señalización.
   */
  send: function(message) {
    if (!connected || !roomRef) {
      console.error("La conexión de señalización no está establecida.");
      return;
    }
    // Agregamos un timestamp para ordenar mensajes si fuera necesario.
    message.timestamp = Date.now();
    // Opcionalmente, inyecta un identificador de remitente:
    // message.sender = TU_IDENTIFICADOR;
    roomRef.push(message, error => {
      if (error && this.onError) {
        this.onError(error);
      }
    });
  },

  /**
   * _generateRoomId()
   * Genera un identificador aleatorio para la sala.
   * @return {string} Un nuevo roomId.
   */
  _generateRoomId: function() {
    return Math.random().toString(36).substr(2, 9);
  }
};