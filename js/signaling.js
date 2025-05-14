/**
 * signaling.js
 * 
 * Este módulo implementa una señalización manual sin utilizar APIs externas.
 * 
 * La idea es facilitar la transferencia de mensajes de señalización de forma
 * manual; sin embargo, en esta versión se copia automáticamente el mensaje al
 * portapapeles para que el usuario simplemente lo comparta con la otra parte.
 *
 * Interfaz:
 *  - signaling.connect(): inicializa el modo manual.
 *  - signaling.send(message): copia automáticamente el mensaje (formateado) al portapapeles.
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
   * Convierte el objeto de señalización a una cadena JSON y lo copia automáticamente al portapapeles.
   * Si la copia automática falla (por ejemplo, por falta de permisos o de compatibilidad),
   * se muestra una alerta para que el usuario copie manualmente el mensaje.
   *
   * @param {Object} message - Objeto con la información de señalización.
   */
  send: function(message) {
    try {
      const messageStr = JSON.stringify(message);
      console.log("Mensaje de señalización a enviar:\n", messageStr);
      
      // Intentamos copiar automáticamente al portapapeles
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(messageStr)
          .then(() => {
            alert("El mensaje se ha copiado automáticamente al portapapeles:\n\n" + messageStr);
          })
          .catch(error => {
            console.error("Error al copiar el mensaje al portapapeles:", error);
            alert("No se pudo copiar el mensaje automáticamente. Por favor, copie manualmente:\n\n" + messageStr);
          });
      } else {
        // Fallback: si el API no está disponible, se usa alert
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