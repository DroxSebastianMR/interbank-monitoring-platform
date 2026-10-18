---
name: "Interbank Monitor"
description: "Consola operativa de papel técnico que convierte la salud de servicios en un horario de red legible en segundos."
colors:
  ink: "#10231b"
  muted-ink: "#607068"
  technical-paper: "#f3f6f2"
  panel-white: "#ffffff"
  precision-line: "#d8e0da"
  interbank-green: "#008f3c"
  deep-operations-green: "#09271c"
  soft-signal-green: "#e2f3e7"
  interbank-blue: "#003da5"
  critical-red: "#c83236"
  critical-wash: "#fff0f1"
  warning-amber: "#bd7600"
  warning-wash: "#fff5dc"
  focus-blue: "#73a2ed"
typography:
  display:
    fontFamily: "Space Grotesk Variable, sans-serif"
    fontSize: "clamp(27px, 2.5vw, 36px)"
    fontWeight: 670
    lineHeight: 0.95
    letterSpacing: "-0.055em"
  headline:
    fontFamily: "Space Grotesk Variable, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Space Grotesk Variable, sans-serif"
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "DM Sans Variable, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Space Grotesk Variable, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.06em"
rounded:
  none: "0px"
  control: "6px"
  nav: "8px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "14px"
  xl: "18px"
  2xl: "24px"
  3xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.interbank-green}"
    textColor: "{colors.panel-white}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 15px"
    height: "42px"
  button-secondary:
    backgroundColor: "{colors.panel-white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  input:
    backgroundColor: "{colors.panel-white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "9px 11px"
    height: "42px"
  panel:
    backgroundColor: "{colors.panel-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "18px"
  status-chip:
    backgroundColor: "{colors.soft-signal-green}"
    textColor: "{colors.interbank-green}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "5px 8px"
---

# Design System: Interbank Monitor

## Overview

**Creative North Star: "El Horario de Red"**

Interbank Monitor se comporta como una estación de control: cada servicio conserva una posición estable, el tiempo avanza sobre líneas comparables y las alteraciones aparecen como señales inequívocas. La interfaz combina el rigor de un horario ferroviario suizo con superficies claras de papel técnico; su densidad es deliberada, compacta y escaneable durante jornadas operativas prolongadas.

El verde y el azul de Interbank aportan identidad sin competir con la información. Los divisores, los rótulos pequeños y la tipografía numérica tabular estructuran el diagnóstico; rojo y ámbar quedan reservados para severidad. La composición evita una colección genérica de tarjetas KPI: primero presenta prioridad y actualidad, después comparación temporal y evidencia.

**Key Characteristics:**

- Horario operacional con líneas de servicio estables y memoria espacial.
- Papel técnico claro, divisores precisos y superficies planas.
- Interbank verde para identidad y calma; azul para estructura y flujo.
- Rojo y ámbar escasos, semánticos y siempre acompañados por texto.
- Jerarquía compacta orientada a detectar, confirmar y diagnosticar.

## Colors

La paleta une el verde profundo de una sala de operaciones con un campo claro de papel técnico; los acentos de marca organizan y los tonos de severidad interrumpen únicamente cuando existe evidencia.

### Primary

- **Verde Interbank:** identifica acciones primarias, actividad saludable, trazos operativos y confirmaciones positivas.
- **Verde de Operaciones Profundo:** sostiene el rail lateral y crea un ancla de navegación sobria durante uso prolongado.
- **Verde de Señal Suave:** acompaña estados saludables y pulsos de conexión sin teñir grandes áreas.

### Secondary

- **Azul Interbank:** estructura flujos, rutas, topología y señales informativas; no sustituye al verde como llamada principal.

### Tertiary

- **Rojo Crítico:** marca indisponibilidad e incidentes críticos confirmados.
- **Ámbar de Advertencia:** comunica degradación, recuperación o datos vencidos que requieren atención sin afirmar una caída.

### Neutral

- **Tinta Operativa:** texto principal y cifras de lectura inmediata.
- **Tinta Atenuada:** contexto, marcas temporales y texto de apoyo.
- **Papel Técnico:** fondo general que reduce el deslumbramiento y separa paneles blancos.
- **Blanco de Panel:** superficie de trabajo para horarios, tablas, métricas y formularios.
- **Línea de Precisión:** bordes y divisores que construyen la retícula sin peso decorativo.

### Named Rules

**The Evidence Before Severity Rule.** El rojo nunca significa falta de datos; se reserva para indisponibilidad o criticidad respaldada por evidencia, mientras “sin telemetría” permanece neutral y textual.

**The Brand Is Structure Rule.** Verde y azul orientan la interfaz; no se usan como relleno decorativo extensivo ni compiten simultáneamente por atención.

## Typography

**Display Font:** Space Grotesk Variable (con `sans-serif` como respaldo)  
**Body Font:** DM Sans Variable (con `sans-serif` como respaldo)  
**Label/Mono Font:** Space Grotesk Variable, con cifras tabulares para horas, latencia y métricas

**Character:** Space Grotesk aporta precisión técnica y personalidad institucional a la jerarquía de interfaz. DM Sans mantiene la lectura continua calmada y legible en descripciones, mensajes y contexto operacional.

### Hierarchy

- **Display** (670, fluido entre 27px y 36px, 0.95): estado general y métricas de máximo énfasis; usa espaciado compacto y cifras tabulares cuando corresponda.
- **Headline** (700, 20px, 1.15): título principal de cada pantalla dentro de la barra superior.
- **Title** (650, 14–17px, 1.2): títulos de panel, secciones, tablas y nodos de topología.
- **Body** (400, 11–12px, 1.5): explicaciones, estados vacíos, mensajes y evidencia de apoyo; conservar líneas concisas en vistas densas.
- **Label** (600, 8–10px, 0.06em, mayúsculas): navegación contextual, ejes, leyendas, categorías, estados y marcas de tiempo.

### Named Rules

**The Two-Voice Rule.** Space Grotesk gobierna jerarquía, headings, navegación, controles, etiquetas y énfasis numérico; DM Sans gobierna cuerpo y copia de apoyo. No intercambiar sus responsabilidades.

**The Numeric Scan Rule.** Horas, latencias, porcentajes y conteos usan Space Grotesk con cifras tabulares para que columnas y cambios se comparen sin saltos ópticos.

## Layout

El escritorio usa una shell de dos columnas: rail fijo de 248px y área operativa flexible. El contenido respira con padding horizontal fluido de 20px a 42px y se limita a 1600px; la cabecera de 76px permanece visible. El primer bloque es una franja prioritaria a ancho completo, seguida por un resumen compuesto y un workspace de dos columnas donde el horario ocupa aproximadamente dos tercios y las señales recientes el tercio restante.

La separación base es compacta: 14px entre paneles, 18px dentro de métricas y 11–17px en encabezados y filas. Los paneles se agrupan con líneas compartidas en lugar de grandes huecos. A 1120px, el workspace y la topología se apilan; a 820px el rail se convierte en navegación superior de cuatro columnas; a 600px métricas y señales pasan a una sola columna y el horario elimina el eje explícito para conservar la lectura táctil.

**The Stable Line Rule.** Los servicios conservan su orden y su línea temporal; un cambio de estado altera el tramo reciente, el marcador y la etiqueta, pero nunca reordena la lista y destruye la memoria espacial.

**The Priority Before Summary Rule.** Incidente o calma confirmada, junto con la actualidad de los datos, preceden siempre a métricas, catálogo y topología.

## Elevation & Depth

El sistema es plano por defecto. El fondo de papel, los paneles blancos, los divisores de un píxel y los cambios tonales construyen profundidad sin sombras decorativas. La única sombra estructural aparece en el elemento activo del rail oscuro; la cabecera usa transparencia y desenfoque para mantener contexto al desplazarse. Los pulsos de estado se limitan a un halo suave alrededor de un punto de 7px.

### Shadow Vocabulary

- **Selección de navegación** (`0 8px 20px #03160e40`): separa exclusivamente el destino activo del rail oscuro.
- **Pulso en vivo** (`0 0 0 4px #e2f3e7`): confirma actividad en tiempo real; se desvanece en un ciclo de 2.4s y respeta movimiento reducido.

### Named Rules

**The Flat-By-Default Rule.** Los paneles en reposo no proyectan sombra; borde, tono y alineación deben resolver la jerarquía.

## Shapes

La forma dominante es rectilínea: paneles, tablas, franjas de incidente y bloques de topología mantienen esquinas cuadradas para reforzar la retícula técnica. Controles y elementos de navegación reciben curvas contenidas de 6–8px; avatares, marcadores y chips de estado son circulares o píldoras porque representan identidades y estados discretos, no contenedores.

**The Radius Has Meaning Rule.** Cero radio para superficies de datos, 6px para controles, 8px para navegación e iconografía contenida, y píldora completa solo para estados compactos.

## Components

### Buttons

- **Shape:** compacto y contenido, con esquinas suavemente curvas (6px) y alturas de 36px para acciones secundarias o 42px para formularios.
- **Primary:** verde Interbank sobre blanco, padding horizontal de 15px y peso 700; reservar para confirmar una acción operativa.
- **Hover / Focus:** el secundario cambia borde y texto hacia verde; todos muestran un contorno azul visible de 3px con offset de 2px. Las transiciones de estado duran 150–160ms.
- **Secondary / Ghost:** fondo blanco con borde gris-verde para enlaces de avance y actualización; ghost solo en acciones de shell como cerrar sesión.

### Chips

- **Style:** píldora compacta con etiqueta Space Grotesk, color de texto y fondo suave del mismo estado.
- **State:** verde para operativo, ámbar para degradado o recuperación, rojo para indisponible y gris para sin datos; siempre incluye una etiqueta legible.

### Cards / Containers

- **Corner Style:** superficies principales cuadradas (0px); los nodos internos también priorizan borde recto.
- **Background:** blanco de panel sobre papel técnico; lavados verdes, rojos o ámbar aparecen solo como estados.
- **Shadow Strategy:** sin sombra en reposo; consultar Elevation & Depth.
- **Border:** línea de precisión de 1px, con matiz semántico para prioridad, error o calma.
- **Internal Padding:** 14–18px en módulos densos y 22–24px en topología o mensajes aislados.

### Inputs / Fields

- **Style:** fondo blanco, borde gris-verde de 1px, radio de 6px y altura mínima de 40–42px.
- **Focus:** contorno azul de 3px con offset de 2px, perceptible sin depender del color del borde.
- **Error / Disabled:** error en rojo con texto explícito; deshabilitado conserva legibilidad y reduce opacidad, sin sugerir que el dato es crítico.

### Navigation

El rail usa verde profundo, etiquetas claras de 13px e iconos Lucide de 18px. El hover aclara el fondo y desplaza el elemento 2px; el activo invierte a blanco con tinta verde profunda. En pantallas de hasta 820px se vuelve una banda superior de cuatro columnas con rótulos compactos, manteniendo objetivo táctil de 42px.

### Horario de servicios

Cada fila fija el nombre, el tramo temporal, la latencia, la frescura y la tendencia. La línea base es neutral; marcadores y tramo reciente cambian a verde, ámbar o rojo según el estado. En móvil, el tramo baja a una segunda línea sin perder nombre, latencia, frescura ni tendencia.

### Franja prioritaria

Una banda de borde semántico encabeza la vista. En incidente usa lavado y borde rojos; en calma usa lavado y borde verdes. Contiene nivel, evidencia resumida y una única acción contextual, evitando transformar la prioridad en otra tarjeta indistinguible.

## Do's and Don'ts

### Do:

- **Do** preservar posiciones estables para servicios y usar la línea temporal para mostrar cambios.
- **Do** presentar estado junto con actualidad, alcance y evidencia disponible.
- **Do** usar Space Grotesk para jerarquía de interfaz, controles, navegación, etiquetas y números; usar DM Sans para cuerpo y apoyo.
- **Do** separar secciones con bordes de un píxel y cambios tonales antes de introducir elevación.
- **Do** acompañar cada estado semántico con texto, icono o patrón además del color.
- **Do** respetar `prefers-reduced-motion` y conservar foco visible en cada control.

### Don't:

- **Don't** reorganizar servicios según severidad; rompería la memoria espacial del horario.
- **Don't** presentar ausencia o vencimiento de telemetría como una caída confirmada.
- **Don't** convertir el dashboard en una cuadrícula uniforme de tarjetas KPI sin una prioridad operacional clara.
- **Don't** usar rojo o ámbar como decoración, marca o relleno de grandes superficies.
- **Don't** redondear paneles y tablas como tarjetas de consumo; la geometría recta sostiene el carácter de consola.
- **Don't** mezclar familias tipográficas dentro del mismo rol ni usar DM Sans para métricas de énfasis.
