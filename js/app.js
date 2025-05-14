// Esperamos a que se cargue todo el DOM
document.addEventListener('DOMContentLoaded', () => {
  // Referencias a los elementos de la UI
  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const chatSendButton = document.getElementById('chat-send');
  const startCallButton = document.getElementById('startCall');
  const endCallButton = document.getElementById('endCall');

  // Variable para almacenar la transmisión local
  let localStream = null;

  /**
   * Función auxiliar para agregar mensajes al área de chat.
   * @param {string} sender - Nombre o etiqueta del remitente (por ejemplo, "Yo", "Remoto" o "Sistema").
   * @param {string} message - El contenido del mensaje.
   */
  function appendChatMessage(sender, message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.textContent = `${sender}: ${message}`;
    chatMessages.appendChild(messageDiv);
    // Hacemos scroll hacia abajo para mostrar el último mensaje
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /**
   * Evento para iniciar la llamada:
   * - Solicita los medios locales (audio y video).
   * - Muestra el stream local en el elemento de video.
   * - Inicializa la conexión WebRTC y el módulo de señalización.
   */
  startCallButton.addEventListener('click', async () => {
    try {
      // Solicita acceso a cámara y micrófono
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideo.srcObject = localStream;

      // Inicializa la conexión WebRTC con el stream local
      webrtc.initialize(localStream);

      // Conecta el módulo de señalización (por ejemplo, con Firebase, PeerJS, etc.)
      signaling.connect();

      // Actualiza la UI: deshabilita el botón de inicio y habilita el de fin de llamada
      startCallButton.disabled = true;
      endCallButton.disabled = false;

      appendChatMessage('Sistema', 'La llamada se ha iniciado.');
    } catch (err) {
      console.error('Error al acceder a los dispositivos de audio/video:', err);
      alert('No se pudo acceder a la cámara o micrófono.');
    }
  });

  /**
   * Evento para finalizar la llamada:
   * - Cierra la conexión WebRTC y el canal de señalización.
   * - Detiene todas las pistas del stream local.
   * - Actualiza la UI para permitir reiniciar la llamada.
   */
  endCallButton.addEventListener('click', () => {
    // Cierra la conexión WebRTC (peer connections y data channels)
    webrtc.closeConnection();

    // Detiene todas las pistas de la transmisión local
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }

    // Limpia el video remoto
    remoteVideo.srcObject = null;

    // Actualiza la UI: habilita el botón para iniciar llamada y deshabilita el de finalizar
    startCallButton.disabled = false;
    endCallButton.disabled = true;

    appendChatMessage('Sistema', 'La llamada se ha finalizado.');
  });

  /**
   * Evento para enviar mensajes de chat.
   * Se utiliza el DataChannel de WebRTC para enviar mensajes a la otra parte.
   */
  chatSendButton.addEventListener('click', () => {
    const message = chatInput.value.trim();
    if (message === '') return; // No se envían mensajes vacíos

    // Envía el mensaje usando la función de webrtc (que debe enviar por el DataChannel)
    webrtc.sendMessage(message);

    // Agrega el mensaje enviado al área de chat
    appendChatMessage('Yo', message);

    // Limpia el campo de entrada
    chatInput.value = '';
  });

  // Permitir enviar mensajes al presionar la tecla "Enter" en el campo de chat
  chatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      chatSendButton.click();
    }
  });

  /********** CALLBACKS DE RECEPCIÓN DE EVENTOS **********/

  // Cuando se recibe un mensaje por el DataChannel (desde el módulo webrtc)
  webrtc.onMessage = (message) => {
    appendChatMessage('Remoto', message);
  };

  // Cuando se recibe (o se establece) el stream remoto desde la conexión WebRTC
  webrtc.onRemoteStream = (stream) => {
    remoteVideo.srcObject = stream;
  };

  // Opcional: callbacks del módulo de señalización
  signaling.onOpen = () => {
    console.log('Conexión de señalización establecida.');
  };

  signaling.onError = (error) => {
    console.error('Error en la señalización:', error);
  };

  // Si el módulo de señalización decide emitir el stream remoto, lo asignamos al video correspondiente
  signaling.onRemoteStream = (stream) => {
    remoteVideo.srcObject = stream;
  };

});