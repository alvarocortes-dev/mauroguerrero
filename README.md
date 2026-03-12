# Portfolio Mauro Guerrero

Portfolio web para el fotógrafo Mauro Guerrero, construido con Next.js 15, Tailwind CSS y Framer Motion.

## 🛠 Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animaciones**: [Framer Motion](https://www.framer.com/motion/)
- **Base de Datos**: Drizzle ORM (Configuración inicial)
- **Deployment**: Vercel (Recomendado)

## ✨ Características Principales

### Navegación y Layout
- **Sidebar Responsivo**:
  - Desktop: Diseño lateral fijo, alineación a la izquierda.
  - Mobile: Menú colapsable con animaciones fluidas, alineación centrada.
- **Grilla Masonry**:
  - Layout de imágenes adaptativo (1 a 5 columnas según resolución).
  - Soporte para pantallas grandes (2K/4K).

### Tema y UI
- **Dark/Light Mode**:
  - Toggle personalizado con animación sol/luna (SVG + CSS variables).
  - Persistencia de preferencia de usuario.
  - Comportamiento específico en mobile: Botón toggle forzado a blanco para visibilidad sobre fondos difuminados.
- **Modales**:
  - Componente reutilizable para secciones "Contacto" y "Créditos".
  - Inversión de colores inteligente: Fondo oscuro/texto claro en Dark Mode, y viceversa.
- **Tipografía**: Geist Font (optimizada vía `next/font`).

## 📂 Estructura del Proyecto

```
src/
├── app/
│   ├── (site)/          # Rutas públicas del sitio
│   ├── globals.css      # Estilos globales y variables CSS (Open Props)
│   └── layout.tsx       # Root Layout
├── components/
│   ├── SidebarContent.tsx # Contenido principal de navegación
│   ├── MobileMenu.tsx     # Versión móvil de la navegación
│   ├── ThemeToggle.tsx    # Botón de cambio de tema
│   ├── Modal.tsx          # Componente base de modal
│   ├── ContactForm.tsx    # Formulario de contacto
│   └── CreditsContent.tsx # Información de créditos
└── lib/                 # Utilidades y configuración de BD
```

## 🚀 Instalación y Desarrollo

1.  **Clonar el repositorio**:
    ```bash
    git clone <url-del-repo>
    cd mauroguerrero
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Iniciar servidor de desarrollo**:
    ```bash
    npm run dev
    ```
    Visita [http://localhost:3000](http://localhost:3000).

## 📝 Notas de Desarrollo

- **Animaciones**: Las transiciones del tema dependen de variables CSS inyectadas en `globals.css` (Open Props easings). No eliminar.
- **Responsive**: El sidebar tiene comportamientos distintos en mobile vs desktop (alineación, visibilidad de etiquetas). Revisar `SidebarContent.tsx` y `MobileMenu.tsx` al hacer cambios.
