# 🌸 Tu Ramo Mágico

> Descubre las flores que florecen con tu nombre.

---

## 📖 Descripción

**Tu Ramo Mágico** es una aplicación web interactiva que genera un ramo de flores personalizado basado en el nombre del usuario. Escribe tu nombre y descubre qué flores te corresponden, o arma un ramo y envíaselo a alguien especial.

---

## ✨ Funcionalidades

- 🌺 Ramo animado y único para cada nombre, dibujado con p5.js
- ✉️ **Taller de regalos:** elige flores, papel, lazo, mensaje y fecha de apertura
- 🔒 Regalos sellados con cuenta regresiva hasta la fecha elegida
- 🔗 Enlaces directos (`?nombre=Ana`) y códigos QR para compartir
- 📷 Guarda cualquier ramo como imagen lista para redes sociales
- 🎬 Guarda el ramo creciendo como video (con las campanitas) para historias
- 💌 Responde a un regalo con otro ramo en un clic
- 🌙 **Mi jardín:** colección de ramos descubiertos, enviados y recibidos, más la flor del día
- 🔐 **Inicio de sesión con Google** (Firebase): jardín en la nube, enlaces cortos y sellos de fecha que nadie puede saltarse
- 🔔 Campanitas mágicas al abrirse cada flor y al romper el sello (con botón para silenciar)
- 🖼️ Vista previa con imagen al compartir el enlace en WhatsApp y redes
- 🛡️ Nota de privacidad clara: qué se guarda, quién lo ve y qué no hacemos
- 📱 Diseño responsive para móvil y escritorio

> Sin iniciar sesión todo sigue funcionando: el jardín se guarda en el navegador y el regalo viaja dentro del enlace.

---

## 🗂️ Estructura del proyecto

```
tu-ramo-magico/
├── index.html       # Estructura principal
├── styles.css       # Estilos y diseño visual
└── js/
    ├── datos.js     # Flores, ramo de Eva, papeles y lazos
    ├── ramo.js      # Lógica del ramo y dibujo con p5.js
    ├── imagen.js    # Imagen para descargar y código QR
    ├── video.js     # Video del ramo creciendo, con las campanitas
    ├── regalo.js    # Taller de regalos y sobre sellado
    ├── jardin.js    # Mi jardín: ramos guardados y flor del día
    ├── sonido.js    # Campanitas con la Web Audio API (sin archivos de audio)
    ├── app.js       # Pestañas, sesión, "Descubre tu ramo" y arranque
    └── nube.js      # Firebase: inicio de sesión con Google, jardín y regalos en la nube
firestore.rules      # Reglas de seguridad de la base de datos (se pegan en la consola de Firebase)
```

---

## 🛠️ Tecnologías

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

---

## 🚀 Ver en vivo

🌐 [Abrir Tu Ramo Mágico](https://hectordfigueroa.github.io/Flores/)

---

## 📬 Contacto

| Medio | Información |
|---|---|
| 📧 Email | hdfigueroap@gmail.com |

---

<p align="center">Hecho con ❤️ y flores por Hector Figueroa</p>
