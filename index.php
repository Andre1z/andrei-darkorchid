<?php
// index.php
session_start();

// Comprobamos si la sesión se ha iniciado (por ejemplo, revisando "user_id")
// Si no está definida, redirigimos al usuario al formulario de login.
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Mi Aplicación WebRTC</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header>
    <h1>Bienvenido, <?php echo htmlspecialchars($_SESSION['username']); ?></h1>
    <a href="logout.php">Cerrar sesión</a>
  </header>
  
  <main>
    <!-- Sección para video -->
    <section id="video-section">
      <div id="localVideo-container">
        <video id="localVideo" autoplay playsinline muted></video>
      </div>
      <div id="remoteVideo-container">
        <video id="remoteVideo" autoplay playsinline></video>
      </div>
    </section>

    <!-- Sección de chat -->
    <section id="chat-section">
      <div id="chat-messages"></div>
      <div id="chat-controls">
        <input type="text" id="chat-input" placeholder="Escribe tu mensaje...">
        <button id="chat-send">Enviar</button>
      </div>
    </section>

    <!-- Sección de controles de llamada -->
    <section id="controls-section">
      <button id="startCall">Iniciar llamada</button>
      <button id="endCall" disabled>Finalizar llamada</button>
    </section>
  </main>
  
  <footer>
    <p>Mi Aplicación WebRTC &copy; <?php echo date('Y'); ?></p>
  </footer>
  
  <!-- Inclusión de scripts de señalización y WebRTC -->
  <script src="js/signaling.js"></script>
  <script src="js/webrtc.js"></script>
  <script src="js/app.js"></script>
</body>
</html>