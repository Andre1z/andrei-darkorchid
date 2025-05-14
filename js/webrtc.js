const webrtc = {
  localStream: null,
  pc: null,
  dataChannel: null,
  onMessage: null,       // Callback: se ejecuta cuando se recibe un mensaje vía DataChannel
  onRemoteStream: null,  // Callback: se ejecuta al recibir el stream remoto

  // Configuración del RTCPeerConnection (usamos un STUN público)
  configuration: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }
    ]
  },

  /**
   * initialize(localStream)
   * Este método se utiliza en el lado iniciador (offerer).
   * - Guarda la transmisión local.
   * - Crea la conexión WebRTC, agrega las pistas locales.
   * - Crea y configura un DataChannel para chat.
   * - Establece los callbacks de ICE y tracks.
   * - Crea una oferta SDP y la envía utilizando signaling.send().
   *
   * @param {MediaStream} localStream - Stream obtenido de getUserMedia().
   */
  initialize: async function(localStream) {
    this.localStream = localStream;
    // Crea la conexión con la configuración definida.
    this.pc = new RTCPeerConnection(this.configuration);

    // Agrega todas las pistas locales (audio y video) al PeerConnection.
    localStream.getTracks().forEach(track => {
      this.pc.addTrack(track, localStream);
    });

    // Para el iniciador se crea el DataChannel para el chat.
    this.dataChannel = this.pc.createDataChannel("chatChannel");
    this.setupDataChannel(this.dataChannel);

    // Establece el callback para el intercambio de ICE candidates.
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Envia cada candidato ICE a través del módulo de señalización.
        signaling.send({ type: "ice-candidate", candidate: event.candidate });
      }
    };

    // Cuando se reciba el stream remoto se invoca el callback asignado.
    this.pc.ontrack = (event) => {
      if (this.onRemoteStream) {
        // Usamos event.streams[0], que normalmente contiene el stream completo.
        this.onRemoteStream(event.streams[0]);
      }
    };

    // También se define ondatachannel por si llega a iniciarse desde el otro lado.
    this.pc.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannel(this.dataChannel);
    };

    // Crea la oferta SDP, la establece como descripción local y la envía.
    try {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      signaling.send({ type: "offer", sdp: this.pc.localDescription });
    } catch (err) {
      console.error("Error al crear la oferta:", err);
    }
  },

  /**
   * handleSignalingData(data)
   * Procesa mensajes entrantes de señalización. Según el tipo de mensaje,
   * se actúa de la siguiente forma:
   * - "offer": si se recibe una oferta, se crea la conexión (si no existe),
   *            se establece la descripción remota, se genera una respuesta y se envía.
   * - "answer": se establece la descripción remota con la respuesta recibida.
   * - "ice-candidate": se agrega el candidato ICE a la conexión.
   *
   * @param {Object} data - Objeto de señalización recibido.
   */
  handleSignalingData: async function(data) {
    if (data.type === "offer") {
      // Si no existe la conexión, la creamos.
      if (!this.pc) {
        this.pc = new RTCPeerConnection(this.configuration);
        if (this.localStream) {
          this.localStream.getTracks().forEach(track => {
            this.pc.addTrack(track, this.localStream);
          });
        }
        this.pc.onicecandidate = (event) => {
          if (event.candidate) {
            signaling.send({ type: "ice-candidate", candidate: event.candidate });
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
        signaling.send({ type: "answer", sdp: this.pc.localDescription });
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
   * Envía un mensaje de texto a través del DataChannel.
   *
   * @param {string} message - Texto a enviar.
   */
  sendMessage: function(message) {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(message);
    } else {
      console.warn("El DataChannel no está abierto. No se envió el mensaje.");
    }
  },

  /**
   * closeConnection()
   * Cierra el DataChannel y la conexión peer-to-peer.
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
   * Configura los callbacks del DataChannel para eventos de apertura, mensaje,
   * error y cierre.
   *
   * @param {RTCDataChannel} channel - Canal de datos a configurar.
   */
  setupDataChannel: function(channel) {
    channel.onopen = () => {
      console.log("DataChannel abierto");
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