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
    
    if (empty($username) || empty($password)) {
        $message = "Username y password son requeridos.";
    } else {
        $db_file = __DIR__ . '/database/users.db';
        if (!file_exists($db_file)) {
            $message = "La base de datos no existe. Ejecuta create_db.php primero.";
        } else {
            try {
                $db = new SQLite3($db_file);
            } catch (Exception $e) {
                $message = "Error al conectar con la base de datos: " . $e->getMessage();
            }
            
            if (!empty($db)) {
                $stmt = $db->prepare("SELECT * FROM users WHERE username = :username");
                $stmt->bindValue(':username', $username, SQLITE3_TEXT);
                $result = $stmt->execute();
                $row = $result->fetchArray(SQLITE3_ASSOC);
    
                if (!$row) {
                    $message = "Usuario no encontrado.";
                } else {
                    if (password_verify($password, $row['password'])) {
                        $_SESSION['user_id'] = $row['id'];
                        $_SESSION['username'] = $row['username'];
                        header("Location: index.php");
                        exit;
                    } else {
                        $message = "Contraseña incorrecta.";
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
    <title>Inicio de Sesión - Mi Aplicación WebRTC</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <h2>Inicio de Sesión</h2>
  <?php
    if (!empty($message)) {
        echo '<p style="color:red;">' . htmlspecialchars($message) . '</p>';
    }
  ?>
  <form method="post" action="login.php">
      <label for="username">Username:</label>
      <input type="text" id="username" name="username" required>
      <br>
      <label for="password">Contraseña:</label>
      <input type="password" id="password" name="password" required>
      <br>
      <input type="submit" value="Iniciar Sesión">
  </form>
  <p>¿No tienes cuenta? <a href="register.php">Regístrate aquí</a>.</p>
</body>
</html>