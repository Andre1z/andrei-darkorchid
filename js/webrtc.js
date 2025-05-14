// webrtc.js

const webrtc = {
  localStream: null,
  pc: null,
  dataChannel: null,
  // Cola para almacenar mensajes pendientes y un flag para evitar logs repetidos
  messageQueue: [],
  _queueWarningLogged: false,
  
  onMessage: null,       // Callback para recibir mensajes del DataChannel
  onRemoteStream: null,  // Callback invocado cuando se recibe el stream remoto

  // Configuración del RTCPeerConnection (utilizando un STUN público)
  configuration: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }
    ]
  },

  /**
   * initialize(localStream)
   * Se usa en el lado iniciador (offerer) para:
   *  - Almacenar el stream local.
   *  - Crear la conexión RTCPeerConnection y agregar las pistas locales.
   *  - Crear y configurar el DataChannel para el chat.
   *  - Configurar callbacks (ICE, ontrack, ondatachannel).
   *  - Crear una oferta SDP y enviarla vía señalización.
   *
   * @param {MediaStream} localStream - La transmisión local obtenida con getUserMedia().
   */
  initialize: async function(localStream) {
    this.localStream = localStream;
    this.pc = new RTCPeerConnection(this.configuration);

    // Agregar las pistas locales
    localStream.getTracks().forEach(track => {
      this.pc.addTrack(track, localStream);
    });

    // Crear un DataChannel (lado offerer)
    this.dataChannel = this.pc.createDataChannel("chatChannel");
    this.setupDataChannel(this.dataChannel);

    // Configurar ICE candidates
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        signaling.send({
          type: "ice-candidate",
          candidate: event.candidate
        });
      }
    };

    // Cuando se recibe el stream remoto
    this.pc.ontrack = (event) => {
      if (this.onRemoteStream) {
        this.onRemoteStream(event.streams[0]);
      }
    };

    // Si la otra parte crea un DataChannel, se captura aquí
    this.pc.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannel(this.dataChannel);
    };

    // Crear y enviar la oferta SDP
    try {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      signaling.send({
        type: "offer",
        sdp: this.pc.localDescription
      });
    } catch (err) {
      console.error("Error al crear la oferta:", err);
    }
  },

  /**
   * handleSignalingData(data)
   * Procesa los mensajes entrantes para:
   *  - Oferta: (si es answerer) establece la descripción remota, crea una respuesta y la envía.
   *  - Respuesta: establece la descripción remota.
   *  - ICE Candidate: lo agrega a la conexión.
   *
   * @param {Object} data - Objeto de señalización recibido.
   */
  handleSignalingData: async function(data) {
    if (data.type === "offer") {
      if (!this.pc) {
        this.pc = new RTCPeerConnection(this.configuration);
        if (this.localStream) {
          this.localStream.getTracks().forEach(track => {
            this.pc.addTrack(track, this.localStream);
          });
        }
        this.pc.onicecandidate = (event) => {
          if (event.candidate) {
            signaling.send({
              type: "ice-candidate",
              candidate: event.candidate
            });
          }
        };
        this.pc.ontrack = (event) => {
          if (this.onRemoteStream) {
            this.onRemoteStream(event.streams[0]);
          }
        };
        this.pc.ondatachannel = (event) => {
          this.dataChannel = event.channel;
          this.setupDataChannel(this.dataChannel);
        };
      }
      try {
        await this.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        signaling.send({
          type: "answer",
          sdp: this.pc.localDescription
        });
      } catch (err) {
        console.error("Error al procesar la oferta:", err);
      }
    } else if (data.type === "answer") {
      try {
        await this.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      } catch (err) {
        console.error("Error al establecer la respuesta remota:", err);
      }
    } else if (data.type === "ice-candidate") {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error("Error al agregar candidato ICE:", err);
      }
    }
  },

  /**
   * sendMessage(message)
   * Envía un mensaje a través del DataChannel. Si el canal no está abierto,
   * se encola el mensaje y se registra la advertencia (una única vez).
   *
   * @param {string} message - Mensaje de texto a enviar.
   */
  sendMessage: function(message) {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(message);
    } else {
      if (!this._queueWarningLogged) {
        console.warn("El DataChannel no está abierto. Se encolará el mensaje.");
        this._queueWarningLogged = true;
      }
      this.messageQueue.push(message);
    }
  },

  /**
   * closeConnection()
   * Cierra el DataChannel y la conexión PeerConnection.
   */
  closeConnection: function() {
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    if (this.pc) {
      this.pc.close();
    }
    this.pc = null;
    this.dataChannel = null;
    console.log("Conexión WebRTC cerrada.");
  },

  /**
   * setupDataChannel(channel)
   * Configura el DataChannel asignándole callbacks para eventos de apertura,
   * mensaje, error y cierre. Cuando se abra, se envían los mensajes pendientes y
   * se reinicia la advertencia de cola.
   *
   * @param {RTCDataChannel} channel - El canal de datos a configurar.
   */
  setupDataChannel: function(channel) {
    channel.onopen = () => {
      console.log("DataChannel abierto");
      // Al abrirse, se restablece el flag de advertencia.
      this._queueWarningLogged = false;
      // Enviar mensajes pendientes:
      while (this.messageQueue.length > 0) {
        const msg = this.messageQueue.shift();
        channel.send(msg);
      }
    };
    channel.onmessage = (event) => {
      console.log("Mensaje recibido vía DataChannel:", event.data);
      if (this.onMessage) {
        this.onMessage(event.data);
      }
    };
    channel.onerror = (error) => {
      console.error("Error en DataChannel:", error);
    };
    channel.onclose = () => {
      console.log("DataChannel cerrado");
    };
  }
};