<?php
session_start();

// Si el usuario ya inició sesión, redirige a index.php
if (isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}

$message = "";

// Procesamiento del formulario
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = isset($_POST["username"]) ? trim($_POST["username"]) : "";
    $password = isset($_POST["password"]) ? $_POST["password"] : "";
    $confirmPassword = isset($_POST["confirm_password"]) ? $_POST["confirm_password"] : "";
    
    if (empty($username) || empty($password) || empty($confirmPassword)) {
        $message = "Todos los campos son obligatorios.";
    } elseif ($password !== $confirmPassword) {
        $message = "Las contraseñas no coinciden.";
    } else {
        $db_file = __DIR__ . '/database/users.db';
        if (!file_exists($db_file)) {
            $message = "La base de datos no existe. Ejecuta create_db.php primero.";
        } else {
            try {
                $db = new SQLite3($db_file);
            } catch (Exception $e) {
                $message = "Error al conectar a la base de datos: " . $e->getMessage();
            }
            
            if (!empty($db)) {
                $hash = password_hash($password, PASSWORD_DEFAULT);
                if ($hash === false) {
                    $message = "Error al procesar la contraseña.";
                } else {
                    $stmt = $db->prepare("INSERT INTO users (username, password) VALUES (:username, :password)");
                    $stmt->bindValue(':username', $username, SQLITE3_TEXT);
                    $stmt->bindValue(':password', $hash, SQLITE3_TEXT);
    
                    $result = $stmt->execute();
    
                    if ($result) {
                        // Registro exitoso: redirigir al formulario de login
                        header("Location: login.php?registered=1");
                        exit;
                    } else {
                        $message = "Error al registrar el usuario. Es posible que el nombre de usuario ya esté en uso.";
                    }
                }
                $db->close();
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Registro - Mi Aplicación WebRTC</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <h2>Registro de Usuario</h2>
  <?php
    if (!empty($message)) {
        echo '<p style="color:red;">' . htmlspecialchars($message) . '</p>';
    }
  ?>
  <form method="post" action="register.php">
      <label for="username">Username:</label>
      <input type="text" id="username" name="username" required>
      <br>
      <label for="password">Contraseña:</label>
      <input type="password" id="password" name="password" required>
      <br>
      <label for="confirm_password">Confirmar Contraseña:</label>
      <input type="password" id="confirm_password" name="confirm_password" required>
      <br>
      <input type="submit" value="Registrarse">
  </form>
  <p>¿Ya tienes cuenta? <a href="login.php">Inicia sesión aquí</a>.</p>
</body>
</html>