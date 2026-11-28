    import { OPPONENTS } from './opponents.js';

    // Tiap arena: latar gradasi, warna aksen, dan partikel melayang
    export const ARENAS = [
    { id: 'meadow',  name: 'Padang Rumput',  glow: '#4ade80', edge: '#22c55e', particles: ['🍃', '🌿', '✨'],
        bg: 'radial-gradient(ellipse at 50% 0%, #1f7a4d 0%, #0e4a3a 45%, #07261f 100%)' },
    { id: 'lava',    name: 'Gunung Api',     glow: '#fb923c', edge: '#ef4444', particles: ['🔥', '✨', '🌋'],
        bg: 'radial-gradient(ellipse at 50% 100%, #b4381a 0%, #5a1a12 45%, #1c0a0a 100%)' },
    { id: 'ocean',   name: 'Dasar Laut',     glow: '#38bdf8', edge: '#0ea5e9', particles: ['🫧', '🐚', '💧'],
        bg: 'linear-gradient(180deg, #0b5e9e 0%, #083a6b 55%, #04172e 100%)' },
    { id: 'sky',     name: 'Kastil Awan',    glow: '#e0f2fe', edge: '#93c5fd', particles: ['☁️', '✨', '🌤️'],
        bg: 'linear-gradient(180deg, #5aa7e8 0%, #3a64b8 55%, #1d2a6b 100%)' },
    { id: 'desert',  name: 'Gurun Batu',     glow: '#fbbf24', edge: '#d97706', particles: ['🪨', '✨', '🌵'],
        bg: 'linear-gradient(180deg, #c58a3a 0%, #7a4a1c 55%, #2a170a 100%)' },
    { id: 'storm',   name: 'Langit Petir',   glow: '#c4b5fd', edge: '#8b5cf6', particles: ['⚡', '✨', '☁️'],
        bg: 'radial-gradient(ellipse at 50% 30%, #4a3a9a 0%, #25205a 50%, #0b0a24 100%)' },
    { id: 'crystal', name: 'Gua Kristal',    glow: '#67e8f9', edge: '#22d3ee', particles: ['💎', '✨', '❄️'],
        bg: 'radial-gradient(ellipse at 50% 60%, #1a6a8a 0%, #12385a 50%, #070f24 100%)' },
    { id: 'shadow',  name: 'Kuil Bayangan',  glow: '#f0abfc', edge: '#a21caf', particles: ['🦇', '✨', '🌑'],
        bg: 'radial-gradient(ellipse at 50% 40%, #4a1a5a 0%, #220f30 55%, #0a0510 100%)' },
    ];

    // (opsional) tentukan arena tertentu untuk lawan tertentu: { api: 'lava', ... }
    const BY_OPPONENT = {};

    const BY_ID = Object.fromEntries(ARENAS.map((a) => [a.id, a]));

    // Lawan tanpa pengaturan khusus otomatis dapat arena berbeda sesuai urutannya
    export function arenaFor(opponentId) {
    if (BY_OPPONENT[opponentId]) return BY_ID[BY_OPPONENT[opponentId]] || ARENAS[0];
    const i = Math.max(0, OPPONENTS.findIndex((o) => o.id === opponentId));
    return ARENAS[i % ARENAS.length];
    }