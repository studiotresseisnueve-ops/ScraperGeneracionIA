Prototipo: AI Inspiration & Creative Engine
1. Contexto y ObjetivoEste sistema es una herramienta interna privada diseñada para el equipo de diseño de la empresa. Su función es procesar manuales de identidad en PDF, realizar scraping de tendencias en Reels/TikTok y generar assets visuales (moodboards) alineados a la marca. 
2. Stack Tecnológico RequeridoFrontend: React (Vite) + Tailwind CSS.  Backend: FastAPI (Python) para orquestación de agentes y manejo de archivos.  Infraestructura: Docker (Multi-container) desplegado en un Droplet de DigitalOcean.  Privacidad: Nginx con Basic Auth y directivas noindex para evitar rastreo externo. 
3. Instrucciones para el Agente (Prompt de Sistema)A. Procesamiento de DocumentosExtracción: Utiliza PyMuPDF para leer el briefing/PDF subido.  Perfilado: Identifica el "Tone of Voice", paleta de colores y público objetivo basándote en el documento.  B. Scraping de Inspiración (Reels/TikTok)Búsqueda: Genera 5 keywords de tendencia basadas en el perfil de la empresa.  Consumo: Utiliza una API de terceros (ej. Apify) para evitar bloqueos de IP en el servidor de DigitalOcean.  Filtrado: Selecciona solo contenido cuya estética sea compatible con el manual de identidad extraído.C. Generación de Imágenes (Creative Agent)Prompting: Traduce la estética de los Reels encontrados a prompts técnicos para DALL-E 3 o Midjourney.  Consistencia: Asegura que los assets generados respeten la paleta de colores del PDF original.  
4. Flujo de Despliegue (Docker)Para asegurar la estabilidad en producción, el sistema debe seguir este esquema de contenedores:Container 1 (Nginx): Actúa como "portero" con Basic Auth.  Container 2 (Frontend): Sirve la interfaz de React.  Container 3 (Backend): Ejecuta la lógica de Python y gestiona las API Keys ocultas en el archivo .env.  
5. Reglas de Salida (Output)Privacidad Total: Jamás indexar el sitio en motores de búsqueda.  Visual First: Los resultados en el frontend deben mostrar embebidos de video y las imágenes generadas de forma prominente para los diseñadores.  Feedback: Mostrar estados de carga claros (ej. "El agente está analizando el estilo de la marca...").  

6. Especificaciones de la Interfaz (Frontend UX)
El objetivo es una Single Page Application (SPA) intuitiva que oculte la complejidad de los agentes de Python tras una estética moderna.  

A. Módulo de Ingesta (Branding Input)
Dropzone de PDF: Un área central para arrastrar el manual de identidad o briefing.  

Extracción en tiempo real: Visualización de los datos clave extraídos (Paleta de colores detectada, keywords de la marca, tono de voz) para que el usuario valide antes de proceder.  

B. Dashboard de Resultados (Inspiration Grid)
Feed de Reels/TikTok: Una cuadrícula estilo Pinterest con los videos embebidos.  

Creative Cards: Cada video debe ir acompañado de:

Análisis de IA: Breve explicación de por qué este video encaja con la marca.  

Metadata: Tags de estilo (ej. #Minimalista, #HighContrast).  

Enlace directo: Botón para ir a la fuente original.

C. Laboratorio de Imagen (AI Generation)
Galería de Variaciones: Sección donde se muestran las imágenes generadas por la IA (DALL-E 3/Midjourney) basadas en la inspiración.  

Interacción Creativa: Botones para "Regenerar con más brillo", "Cambiar formato a Story", o "Descargar en alta resolución".  

D. Panel de Control y Costos (Admin View)
Monitor de Gastos: Una pequeña barra o contador que muestre el uso estimado de créditos de las APIs (OpenAI, Scrapper) para control del jefe.  

Historial Privado: Acceso rápido a las búsquedas y generaciones anteriores para evitar duplicar gastos de API.

