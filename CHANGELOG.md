# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [1.0.0-alpha] - 2026-02-04

### Agregado
- **Sidebar Responsivo**: Implementación completa de barra lateral para escritorio y menú hamburguesa para móvil.
- **Theme Toggle**: Botón de cambio de tema con animación SVG (Sol/Luna) y persistencia.
  - *Fix*: Animación restaurada usando `globals.css` con variables de easing Open Props.
  - *Mobile*: Forzado color blanco (`!text-white`) en vista móvil para asegurar contraste.
- **Modales**: Sistema de modales para "Contacto" y "Créditos".
  - Estilos con inversión de color (Dark bg/Light text en modo oscuro, Light bg/Dark text en modo claro).
- **Grilla Masonry**: Implementación CSS pura para galería de imágenes, soportando hasta 5 columnas en resoluciones 2K.

### Modificado
- **Layout General**: Ajuste de márgenes y espaciados para separar contenido de la barra lateral.
- **Perfil**:
  - Desktop: Diseño estándar (Avatar izquierda, texto derecha).
  - Mobile: Diseño centrado (Avatar arriba, texto abajo, etiqueta "Perfil" oculta).
- **Tipografía**: Ajustes de tracking y tamaño en menú de navegación.

### Corregido
- **Toggle en Desktop**: Centrado correcto del botón de tema usando `w-full` en el contenedor.
- **Inversión de Colores**: Solucionado conflicto de variables globales en modales mediante clases explícitas (`text-black` / `dark:text-white`).
