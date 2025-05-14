// webrtc.js

const webrtc = {
  localStream: null,
  pc: null,
  dataChannel: null,
  // Cola para almacenar mensajes que se intenten enviar antes de que el DataChannel esté abierto
  messageQueue: [],
  onMessage: null,       // Callback a asignar para recibir mensajes del DataChannel
  onRemoteStream: null,  // Callback a asignar cuando se reciba el stream remoto

  // Configuración del RTCPeerConnection (utilizando un STUN público)
  configuration: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }
    ]
  },

  /**
   * initialize(localStream)
   * Se utiliza en el lado iniciador (offerer).
   * - Guarda el stream local.
   * - Crea la conexión RTCPeerConnection y agrega las pistas locales.
   * - Crea el DataChannel para chat y lo configura.
   * - Configura callbacks para ICE candidates, tracks y datachannels.
   * - Crea una oferta SDP y la envía vía señalización.
   *
   * @param {MediaStream} localStream - La transmisión local (obtenida con getUserMedia).
   */
  initialize: async function(localStream) {
    this.localStream = localStream;
    this.pc = new RTCPeerConnection(this.configuration);

    // Agregar todas las pistas locales al PeerConnection
    localStream.getTracks().forEach(track => {
      this.pc.addTrack(track, localStream);
    });

    // Crear un DataChannel (solo en el lado offerer)
    this.dataChannel = this.pc.createDataChannel("chatChannel");
    this.setupDataChannel(this.dataChannel);

    // Configurar el manejo de ICE candidates
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Enviar el candidato ICE usando el módulo de señalización
        signaling.send({ type: "ice-candidate", candidate: event.candidate });
      }
    };

    // Cuando se reciba el stream remoto
    this.pc.ontrack = (event) => {
      if (this.onRemoteStream) {
        // Generalmente event.streams[0] contiene el stream completo
        this.onRemoteStream(event.streams[0]);
      }
    };

    // En caso de que la otra parte (answerer) cree un DataChannel, se captura aquí
    this.pc.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannel(this.dataChannel);
    };

    // Crear y enviar la oferta SDP
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
   * Procesa los mensajes de señalización entrantes.
   * - Si se recibe una "offer", se asigna como _answerer_: se crea la conexión si no existe,
   *   se establece la descripción remota, se crea la respuesta (answer) y se envía.
   * - Si se recibe una "answer", se establece la descripción remota.
   * - Si se recibe un "ice-candidate", se añade al PeerConnection.
   *
   * @param {Object} data - Objeto de señalización entrante.
   */
  handleSignalingData: async function(data) {
    if (data.type === "offer") {
      // Si no existe la conexión, la creamos (lado answerer)
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
   * Envía un mensaje a través del DataChannel. Si el canal no está abierto,
   * se encola el mensaje para enviarlo cuando el canal se abra.
   *
   * @param {string} message - El mensaje de texto a enviar.
   */
  sendMessage: function(message) {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(message);
    } else {
      console.warn("El DataChannel no está abierto. Se encolará el mensaje.");
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
   * Configura el DataChannel asignándole los callbacks para eventos de apertura,
   * mensaje, error y cierre. Cuando se abra, envía cualquier mensaje pendiente en la cola.
   *
   * @param {RTCDataChannel} channel - Canal de datos a configurar.
   */
  setupDataChannel: function(channel) {
    // Evento: cuando el DataChannel esté abierto, enviar todos los mensajes pendientes
    channel.onopen = () => {
      console.log("DataChannel abierto");
      while (this.messageQueue.length > 0) {
        const msg = this.messageQueue.shift();
        channel.send(msg);
      }
    };
    // Evento: cuando se reciba un mensaje
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