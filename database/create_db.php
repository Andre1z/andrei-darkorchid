<?php
// database/create_db.php

// Definir la ruta para almacenar la base de datos
$db_file = __DIR__ . '/users.db';

// Crear (o abrir) la base de datos SQLite
$db = new SQLite3($db_file);

// Crear la tabla "users" si no existe
$query = "CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
)";
$result = $db->exec($query);

if (!$result) {
    die("Error al crear la tabla 'users': " . $db->lastErrorMsg());
} else {
    echo "La tabla 'users' se ha creado (o ya existía) exitosamente.";
}

// Cerrar la conexión a la base de datos
$db->close();
?>