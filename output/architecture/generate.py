"""Generate the three source-derived, editable architecture diagrams as SVG."""

from html import escape
from pathlib import Path

OUT = Path(__file__).resolve().parent
W, H = 1800, 1080

COLORS = {
    "app": ("#E9F8F0", "#16A663", "#0B7047"),
    "monitor": ("#E8F1FD", "#3276D4", "#1C4D91"),
    "ai": ("#F1EDFF", "#8059C7", "#56378F"),
    "data": ("#FFF4DE", "#C58A29", "#8B5C12"),
    "observe": ("#E6F7F7", "#259999", "#166C72"),
    "neutral": ("#F1F5F9", "#687B8E", "#415366"),
}


def txt(x, y, value, size=20, fill="#21344B", weight=500, anchor="middle"):
    return (
        f'<text x="{x}" y="{y}" text-anchor="{anchor}" '
        f'font-family="Inter,Segoe UI,Arial,sans-serif" font-size="{size}" '
        f'font-weight="{weight}" fill="{fill}">{escape(value)}</text>'
    )


def icon(kind, cx, cy, stroke):
    base = f'transform="translate({cx-24} {cy-24})" fill="none" stroke="{stroke}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"'
    shapes = {
        "phone": '<rect x="13" y="3" width="22" height="42" rx="5"/><path d="M20 9h8M22 39h4"/>',
        "web": '<rect x="3" y="7" width="42" height="29" rx="3"/><path d="M3 14h42M18 42h12M24 36v6"/>',
        "server": '<rect x="7" y="5" width="34" height="12" rx="2"/><rect x="7" y="20" width="34" height="12" rx="2"/><rect x="7" y="35" width="34" height="9" rx="2"/><path d="M13 11h2M13 26h2M13 39h2"/>',
        "db": '<ellipse cx="24" cy="9" rx="17" ry="6"/><path d="M7 9v29c0 4 8 7 17 7s17-3 17-7V9M7 23c0 4 8 7 17 7s17-3 17-7"/>',
        "route": '<path d="M7 24h34M31 14l10 10-10 10M7 12h12M7 36h12"/>',
        "chart": '<path d="M6 42V8M6 42h37M12 32l9-10 8 6 12-17"/><circle cx="12" cy="32" r="2"/><circle cx="21" cy="22" r="2"/><circle cx="29" cy="28" r="2"/>',
        "brain": '<path d="M23 8c-9-7-20 2-15 10-6 5-4 15 4 17-2 8 8 13 12 6V8ZM25 8c9-7 20 2 15 10 6 5 4 15-4 17 2 8-8 13-12 6V8Z"/><path d="M13 21l8 5-4 7M35 21l-8 5 4 7"/>',
        "clock": '<circle cx="24" cy="24" r="18"/><path d="M24 12v13l8 5"/>',
        "shield": '<path d="M24 4l16 7v12c0 11-8 18-16 21C16 41 8 34 8 23V11l16-7Z"/><path d="m16 24 6 6 11-12"/>',
        "code": '<path d="m17 13-11 11 11 11m14-22 11 11-11 11m-4-27-6 32"/>',
        "bell": '<path d="M12 34h24l-4-6V19c0-6-3-10-8-10s-8 4-8 10v9l-4 6ZM21 40h6"/>',
        "user": '<circle cx="24" cy="15" r="8"/><path d="M8 42c0-10 6-16 16-16s16 6 16 16"/>',
        "file": '<path d="M12 4h17l8 9v31H12V4Z M29 4v9h8M17 22h15M17 30h15"/>',
        "gear": '<circle cx="24" cy="24" r="8"/><path d="M24 3v7M24 38v7M3 24h7M38 24h7M9 9l5 5M34 34l5 5M39 9l-5 5M14 34l-5 5"/>',
    }
    return f'<g {base}>{shapes[kind]}</g>'


def block(x, y, w, h, title, sub, kind, symbol, tag=None):
    pale, accent, deep = COLORS[kind]
    dx, dy = 18, 15
    out = [
        f'<g filter="url(#soft-shadow)"><path d="M{x},{y} l{dx},-{dy} h{w} l-{dx},{dy}Z" fill="{pale}" stroke="{accent}" stroke-opacity=".4"/>',
        f'<path d="M{x+w},{y} l{dx},-{dy} v{h} l-{dx},{dy}Z" fill="{accent}" opacity=".76"/>',
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="#FFFFFF" stroke="{accent}" stroke-opacity=".55" stroke-width="2"/></g>',
        f'<rect x="{x+17}" y="{y+18}" width="58" height="58" rx="13" fill="{pale}"/>',
        icon(symbol, x+46, y+47, deep),
        txt(x+90, y+37, title, 21, deep, 700, "start"),
        txt(x+90, y+64, sub, 15, "#506175", 400, "start"),
    ]
    if tag:
        out.extend([
            f'<rect x="{x+18}" y="{y+h-33}" width="{min(w-36, len(tag)*8+24)}" height="23" rx="11" fill="{pale}"/>',
            txt(x+30, y+h-17, tag, 12, deep, 700, "start"),
        ])
    return "".join(out)


def small_block(x, y, w, h, title, sub, kind, symbol):
    pale, accent, deep = COLORS[kind]
    return (
        f'<g filter="url(#soft-shadow)"><path d="M{x},{y} l15,-13 h{w} l-15,13Z" fill="{pale}" stroke="{accent}" stroke-opacity=".4"/>'
        f'<path d="M{x+w},{y} l15,-13 v{h} l-15,13Z" fill="{accent}" opacity=".75"/>'
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="11" fill="#fff" stroke="{accent}" stroke-opacity=".5" stroke-width="2"/></g>'
        f'<rect x="{x+15}" y="{y+16}" width="50" height="50" rx="12" fill="{pale}"/>'
        + icon(symbol, x+40, y+41, deep)
        + txt(x+78, y+35, title, 18, deep, 700, "start")
        + txt(x+78, y+59, sub, 14, "#506175", 400, "start")
    )


def connector(points, kind="monitor", dashed=False, marker=True, width=3):
    accent = COLORS[kind][1]
    path = " ".join(("M" if i == 0 else "L") + f"{x},{y}" for i, (x, y) in enumerate(points))
    dash = 'stroke-dasharray="9 8"' if dashed else ""
    tip = f'marker-end="url(#{kind}-arrow)"' if marker else ""
    return f'<path d="{path}" fill="none" stroke="{accent}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round" {dash} {tip}/>'


def label(x, y, value, kind="neutral"):
    pale, accent, deep = COLORS[kind]
    width = max(95, len(value)*7.4+25)
    return (
        f'<rect x="{x-width/2:.0f}" y="{y-19}" width="{width:.0f}" height="27" rx="13" fill="{pale}" stroke="{accent}" stroke-opacity=".35"/>'
        + txt(x, y, value, 13, deep, 700)
    )


def heading(title, subtitle, number):
    return (
        f'<rect x="64" y="46" width="9" height="78" rx="4" fill="#16A663"/>'
        + txt(97, 78, title, 35, "#183653", 700, "start")
        + txt(99, 108, subtitle, 17, "#587084", 400, "start")
        + txt(1724, 80, number, 25, "#92A6B7", 700, "end")
    )


def base(title, subtitle, number, parts, foot):
    defs = [
        '<defs><pattern id="grid" width="100" height="58" patternUnits="userSpaceOnUse"><path d="M0 0 100 58M100 0 0 58" fill="none" stroke="#C7D5E0" stroke-width="1" opacity=".55"/></pattern>',
        '<filter id="soft-shadow" x="-25%" y="-35%" width="160%" height="180%"><feDropShadow dx="0" dy="9" stdDeviation="10" flood-color="#1B3752" flood-opacity=".13"/></filter>',
    ]
    for kind, (_, color, _) in COLORS.items():
        defs.append(f'<marker id="{kind}-arrow" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M1 1 11 6 1 11Z" fill="{color}"/></marker>')
    defs.append('</defs>')
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="{escape(title)}">'
        + "".join(defs)
        + f'<rect width="{W}" height="{H}" fill="#F8FBFD"/><rect x="0" y="150" width="{W}" height="850" fill="url(#grid)" opacity=".65"/>'
        + heading(title, subtitle, number)
        + "".join(parts)
        + f'<rect x="0" y="1010" width="{W}" height="70" fill="#EDF3F7"/>'
        + txt(67, 1049, foot, 16, "#476177", 400, "start")
        + txt(1730, 1049, "Fuente: origin/main · 51fb80f", 14, "#668094", 400, "end")
        + '</svg>'
    )


def global_view():
    p = []
    # Lanes, directional flows, then node surfaces.
    p += [
        txt(83, 172, "SISTEMA SUPERVISADO", 18, "#0B7047", 700, "start"),
        txt(83, 567, "OBSERVABILIDAD", 18, "#166C72", 700, "start"),
        txt(83, 758, "PLATAFORMA DE MONITOREO", 18, "#1C4D91", 700, "start"),
        connector([(335,310),(390,310),(390,327),(430,327)],"app"),
        connector([(335,488),(380,488),(380,370),(430,370)],"neutral"),
        connector([(690,338),(735,338),(735,256),(775,256)],"app"),
        connector([(690,357),(735,357),(735,407),(775,407)],"app"),
        connector([(1035,260),(1090,260),(1090,332),(1130,332)],"data"),
        connector([(1035,410),(1090,410),(1090,360),(1130,360)],"data"),
        connector([(1035,262),(1074,262),(1074,465),(1430,465)],"data",True),
        connector([(1035,410),(1089,410),(1089,486),(1430,486)],"data",True),
        connector([(1000,572),(1070,572),(1070,615),(1130,615)],"observe"),
        connector([(1000,637),(1040,637),(1040,648),(1130,648)],"observe"),
        connector([(1390,623),(1438,623)],"observe"),
        connector([(335,851),(550,851),(550,864),(665,864)],"monitor"),
        connector([(955,815),(1040,815),(1040,817),(1115,817)],"ai"),
        connector([(955,858),(1055,858),(1055,914),(1430,914)],"data"),
        connector([(955,896),(1070,896),(1070,724),(1430,724)],"data",True),
        connector([(955,790),(970,790),(970,675),(1130,675)],"observe"),
        connector([(665,798),(580,798),(580,445),(690,445),(690,385)],"monitor",True),
    ]
    p += [
        label(376,298,"app / HTTPS","app"),
        label(735,293,"balanceo","app"),
        label(1065,555,"scrape /metrics","observe"),
        label(583,725,"health cada 10 s","monitor"),
        label(1040,781,"análisis","ai"),
    ]
    p += [
        block(72,237,263,135,"App móvil","React Native · Expo","app","phone","cliente"),
        block(72,425,263,112,"k6","tráfico de prueba","neutral","chart"),
        block(430,290,260,140,"NGINX","balanceo / failover","app","route","puerto 8080"),
        small_block(775,200,260,112,"App Backend #1","NestJS · puerto 3000","app","server"),
        small_block(775,355,260,112,"App Backend #2","misma imagen Docker","app","server"),
        block(1130,285,260,135,"PostgreSQL · app","Supabase · schema app","data","db","datos bancarios simulados"),
        small_block(1430,417,260,112,"Redis","sesión y caché","data","db"),
        small_block(775,565,225,112,"/metrics","HTTP · histogramas","observe","chart"),
        block(1130,565,260,140,"Prometheus","series temporales","observe","chart","scrape 10 s"),
        small_block(1438,565,252,112,"Grafana","panel técnico","observe","chart"),
        block(72,795,263,135,"Dashboard web","React · Vite","monitor","web","operadores"),
        block(665,770,290,155,"Monitoring Backend","NestJS · reglas e incidentes","monitor","server","puerto 4000"),
        block(1115,770,275,140,"Monitoring AI","FastAPI · Python","ai","brain","baseline actual"),
        block(1430,860,260,135,"PostgreSQL · monitor","Supabase · monitoring","data","db","incidentes / alertas"),
        small_block(1430,680,260,112,"Redis","ping · colas previstas","data","db"),
    ]
    return base("Arquitectura global", "Sistema supervisado y plataforma de monitoreo · vista de despliegue", "01 / 03", p,
        "Flecha sólida: API o datos · Flecha discontinua: observación / estado · PostgreSQL en dos esquemas lógicos")


def monitor_view():
    p = [
        txt(74,170,"ENTRADAS",18,"#166C72",700,"start"),
        txt(74,439,"ORQUESTACIÓN Y DECISIÓN",18,"#1C4D91",700,"start"),
        txt(74,758,"SALIDAS Y PERSISTENCIA",18,"#8B5C12",700,"start"),
        connector([(350,269),(480,269),(480,450),(550,450)],"monitor"),
        connector([(690,268),(690,372),(760,372),(760,450)],"observe"),
        connector([(995,268),(995,386),(940,386),(940,450)],"monitor"),
        connector([(705,565),(705,650)],"monitor"),
        connector([(860,565),(860,617),(1065,617),(1065,650)],"monitor"),
        connector([(850,710),(915,710)],"monitor"),
        connector([(940,510),(1350,510),(1350,607),(1510,607),(1510,650)],"ai"),
        connector([(1430,740),(1370,740),(1370,785),(1270,785),(1270,706),(1230,706)],"ai"),
        connector([(1065,762),(1065,783),(750,783),(750,805)],"monitor"),
        connector([(905,870),(1100,870)],"data"),
        connector([(350,863),(465,863),(465,846),(590,846)],"monitor"),
        connector([(995,268),(1310,268),(1310,448),(1430,448)],"monitor",True),
        connector([(1630,517),(1630,650)],"ai"),
    ]
    p += [
        label(475,322,"health 10 s","monitor"),
        label(716,355,"p95 · 5xx · RPS","observe"),
        label(1320,775,"score","ai"),
        label(963,782,"incidentes","monitor"),
        label(1334,417,"pregunta","monitor"),
    ]
    p += [
        block(75,205,275,130,"NGINX → App API","login · balance · transfers","app","route","health endpoints"),
        block(435,205,255,130,"Prometheus","métricas agregadas","observe","chart","1 minuto"),
        block(750,205,245,130,"Dashboard web","API + JWT / permisos","monitor","web","operadores"),
        block(550,450,390,115,"MonitoringService","scheduler, llamadas y estado reciente","monitor","clock","sin rondas solapadas"),
        block(550,650,300,112,"MetricWindowService","últimos 60 s · mínimo 3 checks","monitor","chart"),
        block(915,650,315,112,"Detection + State","reglas + señal de IA","monitor","shield"),
        small_block(1430,405,275,112,"AssistantService","pregunta bajo permiso","ai","user"),
        small_block(1430,650,275,112,"Monitoring AI","análisis / respuesta","ai","brain"),
        small_block(75,805,275,112,"API Controllers","servicios, alertas, auth","monitor","code"),
        block(590,805,315,135,"Incidents + Alerts","abrir · escalar · resolver","monitor","bell","uno activo / servicio"),
        block(1100,805,275,135,"PostgreSQL","schema monitoring","data","db","Prisma"),
        small_block(1420,855,285,112,"Redis","health ping · colas previstas","data","db"),
    ]
    return base("Backend de monitoreo", "NestJS modular · el estado final se decide aquí, no en la IA", "02 / 03", p,
        "Estados: OPERATIONAL → DEGRADED → UNAVAILABLE → RECOVERING · Persistencia: Incident, Alert y acceso de empleados")


def ai_view():
    p = [
        txt(73,168,"RUTA AUTOMÁTICA · ANOMALÍAS TÉCNICAS",18,"#56378F",700,"start"),
        txt(73,534,"RUTA DE CONSULTA · ASISTENTE",18,"#56378F",700,"start"),
        connector([(338,266),(405,266)],"ai"),
        connector([(695,266),(760,266)],"ai"),
        connector([(1050,266),(1120,266)],"ai"),
        connector([(1420,266),(1480,266)],"ai"),
        connector([(930,372),(930,435),(1230,435),(1230,372)],"ai",True),
        connector([(340,626),(405,626)],"ai"),
        connector([(695,626),(760,626)],"ai"),
        connector([(1050,626),(1120,626)],"ai",True),
        connector([(1420,626),(1480,626)],"ai"),
        connector([(1050,665),(1080,665),(1080,752),(1460,752),(1460,665),(1480,665)],"ai"),
        connector([(345,868),(450,868),(450,835),(560,835)],"data"),
        connector([(880,868),(1020,868),(1020,435),(1120,435)],"data",True),
    ]
    p += [
        label(377,246,"JSON","ai"),
        label(727,246,"≥ 3 checks","ai"),
        label(1084,246,"score","ai"),
        label(1280,417,"modelo futuro","ai"),
        label(385,608,"evidencia","ai"),
        label(1084,606,"opcional","ai"),
        label(1305,745,"sin proveedor","ai"),
        label(1008,855,"artefacto validado","data"),
    ]
    p += [
        block(75,207,263,132,"/v1/anomalies","analyze · FastAPI","ai","code","ventana agregada"),
        block(405,207,290,132,"Validación","Pydantic · 0–1 · tiempo","ai","shield","INSUFFICIENT_DATA"),
        block(760,207,290,132,"WindowAnalysis","latencia · errores · timeout","ai","chart","razones"),
        block(1120,207,300,132,"AnomalyService","baseline heurístico actual","ai","brain","Isolation Forest opcional"),
        small_block(1480,207,260,112,"Respuesta","score · riesgo · modo","ai","file"),
        block(75,570,265,132,"/v1/assistant","answer · FastAPI","ai","code","consulta puntual"),
        block(405,570,290,132,"Evidencia JSON","servicios + incidentes","ai","file","sin datos bancarios"),
        block(760,570,290,132,"AssistantService","resumen determinista","ai","brain","por defecto"),
        block(1120,570,300,132,"OpenAI / Gemini","opcional · clave servidor","ai","web","fallback"),
        small_block(1480,570,260,112,"Respuesta","texto + fecha + fuente","ai","file"),
        small_block(75,817,270,112,"CSV de ensayos","normal / fallo etiquetado","data","file"),
        block(560,817,320,128,"Train + Evaluate","precision · recall · falsos +","data","chart","offline / no activo"),
    ]
    p += [
        f'<rect x="69" y="962" width="1665" height="36" rx="18" fill="#F1EDFF"/>',
        txt(92,986,"ALCANCE REAL: monitorea salud de servicios · no detecta fraude · no predice aún la hora de una caída",16,"#56378F",700,"start"),
    ]
    return base("Servicio de IA", "FastAPI / Python · dos rutas independientes y un entrenamiento fuera de línea", "03 / 03", p,
        "anomalyScore ≠ probabilidad de caída · baseline por defecto · el backend NestJS toma la decisión operacional")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, svg in [
        ("01-arquitectura-global", global_view()),
        ("02-backend-monitoreo", monitor_view()),
        ("03-servicio-ia", ai_view()),
    ]:
        path = OUT / f"{name}.svg"
        path.write_text(svg, encoding="utf-8")
        print(path)


if __name__ == "__main__":
    main()
