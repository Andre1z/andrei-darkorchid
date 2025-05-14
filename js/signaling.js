/**
 * signaling.js
 * 
 * Este módulo implementa una señalización manual sin utilizar APIs externas,
 * guardando automáticamente el mensaje en un "archivo JSON virtual" usando localStorage.
 * 
 * Los mensajes se acumulan en una variable interna y se almacenan en localStorage bajo la clave "messages".
 * Así, otro script o archivo puede leerlos posteriormente sin tener que lidiar con múltiples alerts.
 *
 * Interfaz:
 *  - signaling.connect(): inicializa el modo manual.
 *  - signaling.send(message): guarda el mensaje (en JSON) en el "archivo" (localStorage).
 *  - signaling.receive(): lee los mensajes guardados y los procesa, luego los limpia.
 *
 * Callbacks:
 *  - signaling.onOpen: se invoca al establecer la conexión (modo manual activado).
 *  - signaling.onError: se invoca si ocurre algún error.
 *  - signaling.onMessage: se invoca al recibir un mensaje (por ejemplo, al leer desde el "archivo").
 */

const signaling = {
  onOpen: null,
  onError: null,
  onMessage: null,
  messageLog: [],

  /**
   * connect()
   * Inicializa el modo de señalización manual.
   */
  connect: function() {
    console.log("Modo de señalización manual activado.");
    if (this.onOpen) {
      this.onOpen();
    }
  },

  /**
   * send(message)
   * Convierte el objeto de señalización a una cadena JSON y lo guarda en el "archivo" (localStorage).
   * Esto evita la aparición de múltiples alerts consecutivos.
   *
   * @param {Object} message - Objeto con la información de señalización.
   */
  send: function(message) {
    try {
      // Convertir message a cadena JSON
      const messageStr = JSON.stringify(message);
      console.log("Mensaje de señalización a enviar:\n", messageStr);

      // Acumula el mensaje en el log interno
      this.messageLog.push(message);

      // Guarda el arreglo completo en localStorage bajo la clave "messages"
      localStorage.setItem("messages", JSON.stringify(this.messageLog));

      console.log("Mensaje guardado en messages.json (virtual, en localStorage).");
    } catch (e) {
      console.error("Error al enviar el mensaje:", e);
      if (this.onError) {
        this.onError(e);
      }
    }
  },

  /**
   * receive()
   * Lee los mensajes guardados en el "archivo" (localStorage) y los procesa.
   * Se ejecuta el callback onMessage para cada mensaje recibido y, finalmente, se limpia el log.
   */
  receive: function() {
    const stored = localStorage.getItem("messages");
    if (!stored) {
      console.warn("No hay mensajes guardados.");
      return;
    }
    
    try {
      const messages = JSON.parse(stored);
      messages.forEach(msg => {
        if (this.onMessage) {
          this.onMessage(msg);
        }
      });

      // Limpia el log interno y el almacenado en localStorage para evitar mensajes duplicados
      this.messageLog = [];
      localStorage.removeItem("messages");
      console.log("Mensajes procesados y limpieza del 'archivo JSON' completada.");
    } catch (e) {
      console.error("Error al parsear los mensajes guardados:", e);
      if (this.onError) {
        this.onError(e);
      }
    }
  }
};