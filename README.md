# Andrei | Darkorchid

Descripción:
-------------
Esta aplicación es una plataforma de videoconferencia basada en WebRTC, que integra 
un sistema de autenticación mediante PHP y SQLite. Los usuarios deben registrarse 
y posteriormente iniciar sesión para poder acceder al entorno protegido, donde se 
ofrece la funcionalidad de comunicación en tiempo real (video, chat, etc.).

Características:
---------------
- Registro de usuarios con contraseña encriptada.
- Inicio y cierre de sesión mediante PHP.
- Interfaz de videoconferencia basada en WebRTC (uso de RTCPeerConnection, DataChannel, 
  etc.) para la transmisión de audio/video y chat.
- Módulo de señalización implementado (puede ser manual o vinculado a alguna API externa).
- Diseño innovador y responsivo utilizando CSS moderno (se incluyen dos estilos: style.css 
  para la aplicación principal y auth.css para las páginas de autenticación).

Estructura del Proyecto:
--------------------------
```
andrei-darkorchid/
├── css/
│   ├── auth.css         --> Estilos para páginas de autenticación (login/register)
│   └── style.css        --> Estilos para el contenido principal (index.php)
├── database/
│   ├── create_db.php    --> Script PHP para generar la base de datos SQLite y la tabla de usuarios
│   └── users.db         --> Archivo SQLite que se genera al ejecutar create_db.php
├── js/
│   ├── app.js           --> Lógica principal de la aplicación WebRTC
│   ├── signaling.js     --> Módulo de señalización (manual o mediante API)
│   └── webrtc.js        --> Módulo para gestionar la conexión WebRTC (RTCPeerConnection, DataChannel)
├── index.php            --> Página principal, protegida por autenticación (acceso a la aplicación WebRTC)
├── login.php            --> Formulario de inicio de sesión
├── register.php         --> Formulario de registro de nuevos usuarios
└── logout.php           --> Script para cerrar sesión y redireccionar al login
```

Requisitos:
------------
- Servidor web con PHP (idealmente en XAMPP, WAMP o similar).
- Extensión SQLite3 habilitada.
- Navegador moderno compatible con WebRTC y Clipboard API.
- Conexión a Internet (para cargar las fuentes desde Google Fonts, si se utiliza).

Instalación y Configuración:
-----------------------------
1. Coloca estos archivos en la raíz de tu servidor web (por ejemplo, en el directorio htdocs de XAMPP).
2. Asegúrate de que la extensión SQLite3 esté habilitada en tu archivo php.ini.
   - Abre php.ini y verifica que la línea "extension=sqlite3" esté descomentada.
3. Ejecuta el script de creación de la base de datos:
   - Accede a http://localhost/andrei-darkorchid/database/create_db.php en tu navegador 
     o ejecútalo mediante la línea de comandos.
   - Esto generará el archivo "users.db" en la carpeta database y creará la tabla “users”.
4. Accede a la aplicación:
   - Para registrarte, ve a http://localhost/andrei-darkorchid/register.php y completa el formulario.
   - Una vez registrado, inicia sesión en http://localhost/andrei-darkorchid/login.php.
   - Si el inicio de sesión es exitoso, serás redirigido a http://localhost/andrei-darkorchid/index.php,
     donde podrás usar las funcionalidades de WebRTC.
5. Para cerrar sesión, utiliza el enlace "Cerrar sesión" (redirige a logout.php).

Notas Adicionales:
-------------------
- Si encuentras problemas con la redirección, asegúrate de no haber enviado ninguna salida previa 
  al header (revisa espacios en blanco o saltos de línea fuera de las etiquetas PHP).
- Los estilos específicos para autenticación se encuentran en "css/auth.css". Si los formularios no se 
  muestran correctamente, verifica la ruta en la etiqueta <link> y que la clase "auth-page" esté incluida 
  en el <body>.
- Esta es una base para la aplicación. Puedes extender la funcionalidad agregando validaciones adicionales, 
  manejo de sesiones más robusto o integración con otros servicios de señalización para WebRTC.