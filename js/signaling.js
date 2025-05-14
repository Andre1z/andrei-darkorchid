/**
 * signaling.js
 * 
 * Este módulo implementa una señalización manual sin utilizar APIs externas.
 * Con esta versión se pretende que, en el caso de mensajes generados en respuesta a acciones del usuario
 * (por ejemplo, ofertas o respuestas), se copien automáticamente; mientras que para aquellos generados automáticamente
 * (como los ICE candidates) se solicite al usuario copiar manualmente.
 *
 * Interfaz:
 *  - signaling.connect(): inicializa el modo manual.
 *  - signaling.send(message): copia automáticamente el mensaje (formateado) al portapapeles para ofertas/respuestas,
 *                             o muestra un alert para copia manual en caso de ICE candidates.
 *  - signaling.receive(): solicita al usuario que pegue un mensaje y lo procesa.
 *
 * Callbacks:
 *  - signaling.onOpen: se invoca al establecer la conexión (modo manual activado).
 *  - signaling.onError: se invoca si ocurre algún error.
 *  - signaling.onMessage: se invoca al recibir (manualmente) un mensaje.
 */

const signaling = {
  onOpen: null,
  onError: null,
  onMessage: null,

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
   * Convierte el objeto de señalización a una cadena JSON y,
   * dependiendo del tipo de mensaje, lo copia automáticamente al portapapeles
   * o se muestra un alert para que el usuario lo copie manualmente.
   *
   * @param {Object} message - Objeto con la información de señalización.
   */
  send: function(message) {
    try {
      const messageStr = JSON.stringify(message);
      console.log("Mensaje de señalización a enviar:\n", messageStr);

      // Si el mensaje es un ICE Candidate, se evita el auto-copy pues ocurre fuera de un evento de usuario
      if (message.type === "ice-candidate") {
        alert("Copie manualmente el siguiente ICE Candidate:\n\n" + messageStr);
        return;
      }

      // Para ofertas y respuestas se intenta copiar automáticamente
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(messageStr)
          .then(() => {
            alert("El mensaje se ha copiado automáticamente al portapapeles:\n\n" + messageStr);
          })
          .catch(error => {
            console.error("Error al copiar el mensaje al portapapeles:", error);
            alert("No se pudo copiar el mensaje automáticamente. Por favor, cópielo manualmente:\n\n" + messageStr);
          });
      } else {
        // Fallback: si la API no está disponible, se muestra un alert para copia manual.
        alert("Copie el siguiente mensaje y compártalo con la otra parte:\n\n" + messageStr);
      }
    } catch (e) {
      console.error("Error al enviar el mensaje:", e);
      if (this.onError) {
        this.onError(e);
      }
    }
  },

  /**
   * receive()
   * Solicita al usuario que pegue el mensaje de señalización recibido manualmente y lo procesa.
   */
  receive: function() {
    const messageStr = prompt("Pegue el mensaje de señalización recibido:");
    if (!messageStr) {
      console.warn("No se recibió mensaje.");
      return;
    }
    
    try {
      const message = JSON.parse(messageStr);
      if (this.onMessage) {
        this.onMessage(message);
      }
    } catch(e) {
      console.error("Error al parsear el mensaje:", e);
      if (this.onError) {
        this.onError(e);
      }
      alert("El mensaje recibido no es válido. Por favor, inténtelo de nuevo.");
    }
  }
};