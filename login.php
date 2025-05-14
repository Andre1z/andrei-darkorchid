<?php
// login.php

header("Content-Type: application/json");

// Verificar que la petición se realice mediante POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Método no permitido. Utilice POST.']);
    exit;
}

// Recoger los datos enviados
$username = isset($_POST['username']) ? trim($_POST['username']) : '';
$password = isset($_POST['password']) ? $_POST['password'] : '';

if (empty($username) || empty($password)) {
    echo json_encode(['error' => 'Username y password son requeridos.']);
    exit;
}

// Ruta del archivo de la base de datos
$db_file = __DIR__ . '/database/users.db';

// Verificar que el archivo de la base de datos exista
if (!file_exists($db_file)) {
    echo json_encode(['error' => 'La base de datos no existe. Ejecute create_db.php para crearla.']);
    exit;
}

// Conectar a la base de datos SQLite
try {
    $db = new SQLite3($db_file);
} catch (Exception $e) {
    echo json_encode(['error' => 'Error al conectar con la base de datos: ' . $e->getMessage()]);
    exit;
}

// Preparar la consulta para buscar el usuario por username
$stmt = $db->prepare('SELECT * FROM users WHERE username = :username');
$stmt->bindValue(':username', $username, SQLITE3_TEXT);
$result = $stmt->execute();

$row = $result->fetchArray(SQLITE3_ASSOC);

if (!$row) {
    echo json_encode(['error' => 'Usuario no encontrado.']);
    exit;
}

// Verificar que la contraseña ingresada coincide con el hash almacenado
$stored_hash = $row['password'];
if (password_verify($password, $stored_hash)) {
    // Autenticación exitosa. Aquí podrías generar una sesión o un token.
    echo json_encode(['success' => true, 'message' => 'Login exitoso.', 'userId' => $row['id']]);
} else {
    echo json_encode(['error' => 'Contraseña incorrecta.']);
}

$db->close();
?>