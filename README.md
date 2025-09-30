
# <div align="center"><img src="https://i.ibb.co/0R42bBKz/Karen-Flix.png" alt="Karen-Flix" border="0"><div>Plataforma Geek de Películas, Series y Animes

<h3 align="center">Aplicación Full-Stack para explorar, calificar y rankear contenido geek</h3>

<div align="center">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" height="40" width="40" alt="Node.js"/>
  <img width="12"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" height="40" width="40" alt="Express"/>
  <img width="12"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg" height="40" width="40" alt="MongoDB"/>
  <img width="12"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" height="40" width="40" alt="JavaScript"/>
  <img width="12"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" height="40" width="40" alt="HTML5"/>
  <img width="12"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" height="40" width="40" alt="CSS3"/>
</div>

<img src="https://i.ibb.co/mVV8XnQG/336shots-so.jpg" alt="KarenFlix Demo" border="0">

---

## 🌟 Descripción del Proyecto

**KarenFlix** es una aplicación **full-stack** desarrollada con **Node.js + Express** en el backend y **HTML + CSS + JS puro** en el frontend.  
El objetivo es brindar una plataforma donde los usuarios puedan:

- Registrar, calificar y reseñar **películas, series y animes**.
- Consultar rankings ponderados basados en calificaciones, likes/dislikes y popularidad.
- Diferenciar permisos entre **usuarios** y **administradores** (gestión de categorías, aprobación de películas).
- Autenticarse de manera segura con **JWT**.

---

## 🎯 Funcionalidades Principales

👤 **Gestión de Usuarios**  
- Registro, inicio de sesión y autenticación con JWT.  
- Roles: usuario y administrador.  
- Los admins gestionan categorías y aprueban contenido.  

🎥 **Gestión de Películas y Series**  
- CRUD de películas/series.  
- Validación de títulos duplicados.  
- Atributos: título, descripción, categoría, año, imagen opcional.  

📝 **Reseñas y Ratings**  
- Crear, editar y eliminar reseñas.  
- Calificación numérica detallada (1–5 con decimales).  
- Likes/dislikes en reseñas de otros usuarios.  
- Ranking ponderado automático.  

🏷️ **Categorías**  
- CRUD de categorías (Anime, Ciencia Ficción, Superhéroes, Fantasía).  
- Solo administradores pueden gestionarlas.  

📊 **Ranking y Listados**  
- Películas ordenadas por popularidad y ranking.  
- Filtro por categoría.  
- Vista detalle con reseñas asociadas.  

---

## 🛠️ Tecnologías Utilizadas

- **Backend:** Node.js, Express, MongoDB (driver oficial).  
- **Autenticación:** passport-jwt, jsonwebtoken, bcrypt.  
- **Seguridad:** express-rate-limit, dotenv, express-validator.  
- **Documentación:** swagger-ui-express, semver.  
- **Frontend:** HTML, CSS y JavaScript puro.  

---

## 📂 Estructura del Proyecto

```bash
├── html
│   ├── admin.html
│   ├── home.html
│   └── search.html
├── index.html
├── scripts
│   ├── admin.js
│   ├── home.js
│   ├── index.js
│   └── search.js
├── storage
│   ├── KarenFlix.png
│   ├── poster2.jpg
│   └── ...
└── styles
    ├── admin.css
    ├── home.css
    └── index.css

```

----------

## ⚙️ Instalación Local

1.  **Clona el repositorio**
    
    ```bash
    git clone https://github.com/httmljuandvs/ProyectoExpress_VargasJuan_GranadosOmar_Frontend.git
    ```
    
2.  **Selecciona el archivo principal**
    
    ```
    index.html
    ```
    
3.  **Click derecho** → "Open With Live Server"
    
4.  **Dirígete al repositorio del Backend** para la API.
    

----------

## 📺 Backend

El backend se encuentra en un repositorio separado:  
👉 [KarenFlix Backend](https://github.com/Lazar2422/Proyecto_S1_Express_GranadosOmar_VargarJuan.git)

----------
## ⭐️ Figma

La maquetación realizada en Figma:  
👉 [KarenFlix Diseño](https://www.figma.com/design/ZW88NP5Vk35f54b5aoDPum/KarenFlix?node-id=0-1&t=KdRg8q2YZF2x9JmK-1)

----------
## 📹 Video de Presentación

🔗 [KarenFlix Sustentación](https://drive.google.com/drive/folders/1uAJmRcerUQr_tQOSCBTLXSMw1p0MvwwX?usp=sharing) – Demostración de la aplicación completa en funcionamiento.

----------

## 👥 Créditos

Proyecto desarrollado bajo metodología **SCRUM**:

-   **Scrum Master**: Juan David Vargas Soto
    
-   **Product Owner**: Omar Fernando Granados
    
-   **Developers**: Omar Fernando Granados y Juan David Vargas Soto
    
