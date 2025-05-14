<?php
// register.php

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

// Hashear la contraseña utilizando password_hash()
$hash = password_hash($password, PASSWORD_DEFAULT);
if ($hash === false) {
    echo json_encode(['error' => 'Error al hashear la contraseña.']);
    exit;
}

// Preparar la sentencia SQL para insertar el nuevo usuario
$stmt = $db->prepare('INSERT INTO users (username, password) VALUES (:username, :password)');
$stmt->bindValue(':username', $username, SQLITE3_TEXT);
$stmt->bindValue(':password', $hash, SQLITE3_TEXT);

$result = $stmt->execute();

if ($result) {
    echo json_encode(['success' => true, 'message' => 'Usuario registrado correctamente.']);
} else {
    $error = $db->lastErrorMsg();
    echo json_encode(['error' => 'Error al registrar el usuario: ' . $error]);
}

$db->close();
?>