<?php
// index.php
session_start();

// Comprobamos si la variable de sesión 'user_id' está definida.
// Esta variable debería establecerse al iniciar sesión exitosamente.
if (!isset($_SESSION['user_id'])) {
    // Si no hay sesión iniciada, redirige a la página de inicio de sesión.
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
    <!-- Contenido protegido: Solo se muestra si el usuario ha iniciado sesión -->
    <header>
        <h1>Bienvenido, <?php echo htmlspecialchars($_SESSION['username']); ?></h1>
        <!-- Puedes agregar aquí un botón de "Cerrar sesión" que destruya la sesión -->
    </header>
    
    <main>
        <p>Aquí va el contenido de la aplicación, por ejemplo, la interfaz WebRTC.</p>
        <!-- Incluye aquí los elementos (videos, chat, controles, etc.) de tu aplicación -->
    </main>
    
    <footer>
        <p>Mi Aplicación WebRTC &copy; <?php echo date('Y'); ?></p>
    </footer>
</body>
</html>