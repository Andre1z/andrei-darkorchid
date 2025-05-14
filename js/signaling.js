/**
 * signaling.js
 * 
 * Este módulo implementa una señalización manual sin utilizar APIs externas.
 * 
 * La idea es facilitar la transferencia de mensajes de señalización de forma
 * manual: cuando se envía un mensaje se muestra en un alert para que el usuario lo copie,
 * y para recibir un mensaje se le pedirá que lo pegue en un prompt.
 *
 * Interfaz:
 *  - signaling.connect(): inicializa el modo manual.
 *  - signaling.send(message): muestra el mensaje (formateado) para que el usuario lo copie.
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
   * Convierte el objeto de señalización a una cadena JSON y lo muestra para que el usuario lo copie.
   * @param {Object} message - Objeto con la información de señalización.
   */
  send: function(message) {
    try {
      const messageStr = JSON.stringify(message);
      // Mostrar en la consola para referencia
      console.log("Mensaje de señalización a enviar:\n", messageStr);
      // Alert para que el usuario lo copie manualmente
      alert("Copie el siguiente mensaje y compártalo con la otra parte:\n\n" + messageStr);
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