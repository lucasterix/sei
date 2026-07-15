/**
 * Positions-Sparkline (Server-Komponente, reines SVG).
 * Google-Positionen: kleinere Zahl = besser, daher invertierte y-Achse.
 * Specs: 2px-Linie mit runden Enden, Endpunkt ≥8px mit 2px Surface-Ring.
 * Werte stehen zusätzlich als Text in der Tabelle — die Grafik ist Ergänzung.
 */
export function Sparkline({ values, width = 110, height = 30 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) {
    return <span className="text-xs text-muted">–</span>;
  }
  const pad = 5;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => pad + (i * (width - 2 * pad)) / (values.length - 1);
  // invertiert: beste Position (kleinster Wert) oben
  const y = (v: number) => pad + ((v - min) / span) * (height - 2 * pad);
  const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const lastX = x(values.length - 1);
  const lastY = y(values[values.length - 1]);
  const title = `Positionsverlauf: ${values.join(" → ")}`;

  return (
    <svg width={width} height={height} role="img" aria-label={title} className="shrink-0">
      <title>{title}</title>
      <polyline
        points={points}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="4" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
    </svg>
  );
}
