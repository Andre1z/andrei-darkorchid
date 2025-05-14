<?php
// register.php
ob_start();
session_start();

// Si el usuario ya inició sesión, redirigir a index.php
if (isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}

$message = "";

// Procesamiento del formulario cuando se envía vía POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = isset($_POST["username"]) ? trim($_POST["username"]) : "";
    $password = isset($_POST["password"]) ? $_POST["password"] : "";
    $confirmPass = isset($_POST["confirm_password"]) ? $_POST["confirm_password"] : "";
    
    // Validar que todos los campos estén completos
    if (empty($username) || empty($password) || empty($confirmPass)) {
        $message = "Todos los campos son obligatorios.";
    } elseif ($password !== $confirmPass) {
        $message = "Las contraseñas no coinciden.";
    } else {
        $db_file = __DIR__ . '/database/users.db';
        
        // Verificar que la base de datos exista
        if (!file_exists($db_file)) {
            $message = "La base de datos no existe. Ejecuta create_db.php primero.";
        } else {
            try {
                $db = new SQLite3($db_file);
            } catch (Exception $e) {
                $message = "Error al conectar con la base de datos: " . $e->getMessage();
            }
            
            if (!empty($db)) {
                // Hashear la contraseña de forma segura
                $hash = password_hash($password, PASSWORD_DEFAULT);
                if ($hash === false) {
                    $message = "Error al procesar la contraseña.";
                } else {
                    // Insertar el nuevo usuario en la tabla users
                    $stmt = $db->prepare("INSERT INTO users (username, password) VALUES (:username, :password)");
                    $stmt->bindValue(':username', $username, SQLITE3_TEXT);
                    $stmt->bindValue(':password', $hash, SQLITE3_TEXT);
                    $result = $stmt->execute();
                    
                    if ($result) {
                        // Registro exitoso: redirigir al formulario de login
                        header("Location: login.php?registered=1");
                        exit;
                    } else {
                        $message = "Error al registrar el usuario. Es posible que el username ya esté en uso.";
                    }
                }
                $db->close();
            }
        }
    }
}
ob_end_flush();
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Registro - Mi Aplicación WebRTC</title>
  <link rel="stylesheet" href="css/auth.css">
</head>
<body class="auth-page">
  <div class="auth-form-container">
    <h2>Registro de Usuario</h2>
    <?php
      if (!empty($message)) {
          echo '<p style="color:red;">' . htmlspecialchars($message) . '</p>';
      }
    ?>
    <form method="post" action="register.php">
      <label for="username">Username:</label>
      <input type="text" id="username" name="username" required>
      
      <label for="password">Contraseña:</label>
      <input type="password" id="password" name="password" required>
      
      <label for="confirm_password">Confirmar Contraseña:</label>
      <input type="password" id="confirm_password" name="confirm_password" required>
      
      <input type="submit" value="Registrarse">
    </form>
    <p>¿Ya tienes cuenta? <a href="login.php">Inicia sesión aquí</a>.</p>
  </div>
</body>
</html>