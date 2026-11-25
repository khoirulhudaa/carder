import { useMemo } from 'react';

/**
 * Ilustrasi kartu minimalis: permukaan gelap, satu warna aksen elemen,
 * garis tipis geometris + glyph di tengah. Unik per kartu (seed dari id).
 * Jika kartu punya `img` (URL), gambar itu dipakai menggantikan glyph.
 */

function seeded(seed) {
  let s = 0;
  for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export default function CardArt({ card: c, el }) {
  const g = useMemo(() => {
    const r = seeded(c.id + c.element);
    const cx = 50 + (r() - 0.5) * 14;
    const cy = 30 + (r() - 0.5) * 8;
    const rings = 3 + Math.floor(r() * 3);
    const dots = Array.from({ length: 4 + Math.floor(r() * 4) }, () => ({
      a: r() * Math.PI * 2,
      ring: Math.floor(r() * rings),
      s: 0.5 + r() * 0.8,
    }));
    return { cx, cy, rings, dots };
  }, [c.id, c.element]);

  const t = c.type;
  const col = el.color;

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0a0d13]">
      <div className="absolute inset-0" style={{ background: `radial-gradient(90% 85% at 50% 35%, ${col}38, transparent 70%)` }} />

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <g fill="none" stroke={col}>
          {Array.from({ length: g.rings }, (_, i) => (
            <circle
              key={i}
              cx={g.cx}
              cy={g.cy}
              r={11 + i * 9}
              strokeWidth=".3"
              opacity={0.42 - i * 0.07}
              strokeDasharray={i % 2 ? '1.2 2' : undefined}
              className={i === 1 && (t === 'spell' || t === 'trap') ? 'art-spin' : undefined}
            />
          ))}
          {t === 'trap' && <polygon points={`${g.cx},${g.cy - 17} ${g.cx + 15},${g.cy + 9} ${g.cx - 15},${g.cy + 9}`} strokeWidth=".35" opacity=".5" className="art-spin-rev" />}
          {t === 'relic' && <rect x={g.cx - 11} y={g.cy - 11} width="22" height="22" strokeWidth=".35" opacity=".5" transform={`rotate(45 ${g.cx} ${g.cy})`} />}
          {t === 'field' && <line x1="0" x2="100" y1="42" y2="42" strokeWidth=".35" opacity=".6" />}
        </g>
        {g.dots.map((d, i) => (
          <circle key={i} cx={g.cx + Math.cos(d.a) * (11 + d.ring * 9)} cy={g.cy + Math.sin(d.a) * (11 + d.ring * 9)} r={d.s} fill={col} opacity=".9" />
        ))}
        <rect y="40" width="100" height="20" fill="url(#fade)" />
        <defs>
          <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0a0d13" stopOpacity="0" />
            <stop offset="1" stopColor="#0a0d13" stopOpacity=".75" />
          </linearGradient>
        </defs>
      </svg>

      {c.img ? (
        <img src={c.img} alt={c.name} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="art-float leading-none" style={{ fontSize: '2.9em', filter: `saturate(.85) drop-shadow(0 0 0.35em ${col}99) drop-shadow(0 0.1em 0.12em rgba(0,0,0,.6))` }}>
            {c.icon}
          </span>
        </div>
      )}
    </div>
  );
}