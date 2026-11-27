import { useEffect, useRef } from 'react';
import { ELEMENT_LIST } from '../data/elements.js';

/* Latar interaktif halaman menu.
   - Partikel warna elemen yang saling terhubung garis tipis
   - Menjauh dari kursor / jari, garis menyambung ke kursor
   - Klik / ketuk = gelombang cincin + dorongan partikel
   - Cahaya sorot mengikuti kursor
   - Prop `tint` (hex) mewarnai garis & cahaya (mis. saat elemen disentuh)
   Menghormati prefers-reduced-motion (digambar sekali, tanpa animasi). */
export default function MenuBackground({ tint = null }) {
  const canvasRef = useRef(null);
  const spotRef = useRef(null);
  const tintRef = useRef(tint);
  tintRef.current = tint;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const host = canvas.parentElement;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const colors = ELEMENT_LIST.map((e) => e.color);

    let w = 0, h = 0, raf = 0, nodes = [], rings = [], lastTint = '__';
    const ptr = { x: -9999, y: -9999, on: false };
    const spot = { x: 0, y: 0, tx: 0, ty: 0 };

    const resize = () => {
      const r = host.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(26, Math.min(90, Math.round((w * h) / 15000)));
      nodes = Array.from({ length: n }, (_, i) => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        ex: 0, ey: 0, r: 1.6 + Math.random() * 2.2, c: colors[i % colors.length],
      }));
      spot.x = spot.tx = w * 0.5;
      spot.y = spot.ty = h * 0.4;
    };

    const toLocal = (e) => {
      const r = host.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onMove = (e) => {
      const p = toLocal(e);
      ptr.x = p.x; ptr.y = p.y; ptr.on = true;
      spot.tx = p.x; spot.ty = p.y;
    };
    const onLeave = () => { ptr.on = false; ptr.x = ptr.y = -9999; };
    const onDown = (e) => {
      const p = toLocal(e);
      rings.push({ x: p.x, y: p.y, r: 6 });
      nodes.forEach((n) => {
        const dx = n.x - p.x, dy = n.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 260) { const f = (1 - d / 260) * 5; n.ex += (dx / d) * f; n.ey += (dy / d) * f; }
      });
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      const tn = tintRef.current;
      const line = tn || '#ffffff';

      // cahaya sorot
      spot.x += (spot.tx - spot.x) * 0.08;
      spot.y += (spot.ty - spot.y) * 0.08;
      const s = spotRef.current;
      if (s) {
        s.style.transform = `translate3d(${spot.x}px, ${spot.y}px, 0)`;
        if (lastTint !== tn) {
          s.style.background = `radial-gradient(circle, ${tn || '#7fd4ff'}66 0%, transparent 65%)`;
          lastTint = tn;
        }
      }

      // gerak partikel
      for (const n of nodes) {
        if (ptr.on) {
          const dx = n.x - ptr.x, dy = n.y - ptr.y;
          const d = Math.hypot(dx, dy);
          if (d < 150 && d > 0.1) {
            const f = (1 - d / 150) * 0.9;
            n.ex += (dx / d) * f; n.ey += (dy / d) * f;
          }
        }
        n.ex *= 0.92; n.ey *= 0.92;
        n.x += n.vx + n.ex; n.y += n.vy + n.ey;
        if (n.x < -10) n.x = w + 10; else if (n.x > w + 10) n.x = -10;
        if (n.y < -10) n.y = h + 10; else if (n.y > h + 10) n.y = -10;
      }

      // garis antar partikel
      ctx.lineWidth = 1;
      ctx.strokeStyle = line;
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 115) {
            ctx.globalAlpha = (1 - d / 115) * 0.3;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        // garis ke kursor
        if (ptr.on) {
          const a = nodes[i];
          const d = Math.hypot(a.x - ptr.x, a.y - ptr.y);
          if (d < 170) {
            ctx.globalAlpha = (1 - d / 170) * 0.7;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(ptr.x, ptr.y); ctx.stroke();
          }
        }
      }

      // titik partikel
      nodes.forEach((n, i) => {
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = tn && i % 2 === 0 ? tn : n.c;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.shadowBlur = 0;

      // cincin klik
      rings = rings.filter((r) => r.r < 200);
      rings.forEach((r) => {
        r.r += 4.5;
        ctx.globalAlpha = Math.max(0, 1 - r.r / 200);
        ctx.strokeStyle = line;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.globalAlpha = 1;

      if (!reduce && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const onVis = () => { if (!document.hidden && !reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } };

    resize();
    frame();
    const ro = new ResizeObserver(() => { resize(); if (reduce) frame(); });
    ro.observe(host);
    if (!reduce) {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerdown', onDown, { passive: true });
      document.addEventListener('pointerleave', onLeave);
      document.addEventListener('visibilitychange', onVis);
    }
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div
        ref={spotRef}
        className="absolute left-0 top-0 -ml-[300px] -mt-[300px] h-[600px] w-[600px] rounded-full will-change-transform"
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 45%, transparent 55%, rgba(2,12,40,.55) 100%)' }} />
    </div>
  );
}