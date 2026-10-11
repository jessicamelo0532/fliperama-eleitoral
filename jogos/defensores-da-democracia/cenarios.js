/**
 * Cenários das lutas e fonte pixelada usada dentro do canvas.
 * Tudo é desenhado em 320x180 px e ampliado sem suavização.
 */

export const W = 320;
export const H = 180;

export function px(c, x, y, w, h, cor) {
  c.fillStyle = cor;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function circulo(c, cx, cy, r, cor) {
  c.fillStyle = cor;
  cx = Math.round(cx);
  cy = Math.round(cy);
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(Math.max(0, r * r - y * y + r * 0.6)));
    c.fillRect(cx - w, cy + y, w * 2 + 1, 1);
  }
}

function faixas(c, y0, y1, cores) {
  const altura = (y1 - y0) / cores.length;
  cores.forEach((cor, i) => {
    const ya = Math.round(y0 + i * altura);
    const yb = Math.round(y0 + (i + 1) * altura);
    c.fillStyle = cor;
    c.fillRect(0, ya, W, yb - ya);
    if (i > 0) for (let x = i % 2; x < W; x += 2) c.fillRect(x, ya - 1, 1, 1);
  });
}

/** Gerador pseudoaleatório com semente, para o cenário sair igual a cada vez. */
export function sorteador(semente) {
  let s = (Math.imul(semente | 0, 2654435761) >>> 0) || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ---------- Fonte 3x5 ---------- */

const FONTE = {
  A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111",
  F: "111100110100100", G: "011100101101011", H: "101101111101101", I: "111010010010111", J: "001001001101010",
  K: "101101110101101", L: "100100100100111", M: "101111111101101", N: "110101101101101", O: "010101101101010",
  P: "110101110100100", Q: "010101101110011", R: "110101110101101", S: "011100010001110", T: "111010010010010",
  U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101", Y: "101101010010010",
  Z: "111001010100111",
  0: "111101101101111", 1: "010110010010111", 2: "110001010100111", 3: "110001010001110", 4: "101101111001001",
  5: "111100110001110", 6: "011100111101111", 7: "111001010010010", 8: "111101111101111", 9: "111101111001110",
  $: "011110111011110", "!": "010010010000010", "?": "110001010000010", ".": "000000000000010", "-": "000000111000000",
  "/": "001001010100100", "%": "101001010100101", ",": "000000000010100", ":": "000010000010000", "º": "111101111000000",
};

const semAcento = (texto) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();

export const larguraTexto = (texto, k = 1) => Math.max(0, (texto.length * 4 - 1) * k);

export function escrever(c, texto, x, y, cor, k = 1) {
  c.fillStyle = cor;
  let cx = Math.round(x);
  for (const letra of semAcento(texto)) {
    const glifo = FONTE[letra];
    if (glifo) for (let i = 0; i < 15; i++) if (glifo[i] === "1") c.fillRect(cx + (i % 3) * k, Math.round(y) + Math.floor(i / 3) * k, k, k);
    cx += 4 * k;
  }
}

export function escreverComContorno(c, texto, x, y, cor, k = 1) {
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) escrever(c, texto, x + dx, y + dy, "#0b0b12", k);
  escrever(c, texto, x, y, cor, k);
}

/* ---------- Elementos ---------- */

function nuvem(c, x, y) {
  circulo(c, x, y, 5, "#ffffff");
  circulo(c, x + 7, y - 3, 7, "#ffffff");
  circulo(c, x + 15, y, 5, "#ffffff");
  px(c, x - 5, y, 26, 5, "#ffffff");
  px(c, x - 5, y + 5, 26, 1, "#cfe6f7");
}

function arvore(c, x, y) {
  px(c, x - 3, y + 8, 6, 112 - y - 8, "#5a3a22");
  px(c, x - 3, y + 8, 2, 112 - y - 8, "#432a18");
  circulo(c, x - 13, y + 6, 15, "#24582a");
  circulo(c, x + 13, y + 5, 15, "#24582a");
  circulo(c, x, y, 22, "#2d6a2f");
  circulo(c, x - 6, y - 6, 12, "#3f8a3c");
  circulo(c, x + 9, y - 1, 8, "#4f9e45");
  const r = sorteador(x);
  for (let i = 0; i < 7; i++) px(c, x - 16 + Math.floor(r() * 32), y - 8 + Math.floor(r() * 22), 2, 2, "#f2a33a");
}

const BANDEIRA = (() => {
  const tela = document.createElement("canvas");
  tela.width = 24;
  tela.height = 16;
  const c = tela.getContext("2d");
  px(c, 0, 0, 24, 16, "#1f9a48");
  for (let y = 2; y < 14; y++) {
    const meia = Math.round(10 * (1 - Math.abs(y - 7.5) / 6));
    px(c, 12 - meia, y, meia * 2, 1, "#ffd23f");
  }
  circulo(c, 12, 8, 4, "#2343a3");
  px(c, 9, 7, 7, 1, "#ffffff");
  return tela;
})();

function bandeira(c, x, y, t) {
  for (let i = 0; i < 24; i++) {
    const deslocamento = Math.round(Math.sin(t * 0.1 - i * 0.4) * 1.4 * (i / 23));
    c.drawImage(BANDEIRA, i, 0, 1, 16, x + i, y + deslocamento, 1, 16);
  }
}

/* ---------- Cenários ---------- */

const CENARIOS = {
  centro: {
    ceu(c) {
      faixas(c, 0, 110, ["#24163f", "#3a1f5c", "#5e2a72", "#8f3a78", "#c45470", "#ec7a62", "#f6a463"]);
      circulo(c, 58, 94, 10, "#ffcf7a");
    },
    fundo(c) {
      const r = sorteador(7);
      let x = -4;
      while (x < W) {
        const w = 22 + Math.floor(r() * 20);
        const h = 40 + Math.floor(r() * 50);
        const topo = 108 - h;
        px(c, x, topo, w, h, ["#252a45", "#2d3354", "#20243b"][Math.floor(r() * 3)]);
        px(c, x, topo, w, 2, "#3a4170");
        for (let jy = topo + 5; jy < 104; jy += 5) for (let jx = x + 3; jx < x + w - 3; jx += 4) px(c, jx, jy, 2, 3, r() < 0.35 ? "#ffd27a" : "#161a2e");
        x += w + 1;
      }
      px(c, 104, 20, 112, 88, "#1a1e34");
      px(c, 104, 20, 112, 2, "#3a4170");
      px(c, 110, 28, 100, 48, "#0b0b12");
      px(c, 0, 108, W, 12, "#5f5f6e");
      for (let i = 0; i < W; i += 16) px(c, i, 108, 1, 12, "#4f4f5c");
      px(c, 0, 120, W, 3, "#a0a0ae");
      px(c, 0, 123, W, 57, "#34343e");
      for (let i = 6; i < W; i += 34) px(c, i, 170, 16, 2, "#e8c547");
      for (const lx of [40]) {
        px(c, lx, 58, 2, 50, "#15151c");
        px(c, lx - 6, 56, 12, 3, "#15151c");
        px(c, lx - 4, 59, 8, 2, "#ffe9a8");
      }
      px(c, 248, 76, 56, 4, "#2a7a4a");
      px(c, 250, 80, 2, 28, "#8a8a92");
      px(c, 300, 80, 2, 28, "#8a8a92");
      px(c, 254, 82, 42, 18, "rgba(191,227,255,.35)");
      px(c, 256, 100, 38, 3, "#5a3a22");
      px(c, 306, 64, 2, 44, "#8a8a92");
      px(c, 302, 58, 12, 8, "#2a7a4a");
      escrever(c, "BUS", 303, 59, "#ffffff");
    },
    animado(c, t) {
      const [sx, sy, sw, sh] = [114, 33, 92, 38];
      px(c, sx, sy, sw, sh, "#0b1d3a");
      const mensagens = [["URGENTE!", "#ff5a5a"], ["COMPARTILHA", "#ffd23f"], ["100% REAL", "#77ccff"], ["SERA?", "#ffffff"]];
      const fase = Math.floor(t / 100) % mensagens.length;
      const [texto, cor] = mensagens[fase];
      if (fase !== 0 || (t >> 4) & 1) escrever(c, texto, sx + Math.round((sw - larguraTexto(texto, 2)) / 2), sy + 14, cor, 2);
      c.fillStyle = "rgba(0,0,0,.28)";
      for (let y = sy; y < sy + sh; y += 2) c.fillRect(sx, y, sw, 1);
    },
  },

  quintal: {
    ceu(c) {
      faixas(c, 0, 112, ["#5db3ee", "#72bff2", "#8ccbf5", "#a8d8f8", "#c6e6fb"]);
      circulo(c, 40, 20, 10, "#fff6c4");
    },
    atras(c, t) {
      nuvem(c, (t * 0.06) % 380 - 40, 18);
      nuvem(c, (t * 0.04 + 200) % 380 - 40, 34);
    },
    fundo(c) {
      px(c, 96, 38, 150, 74, "#f2d9a0");
      px(c, 96, 38, 150, 3, "#d9b878");
      for (let i = 0; i < 16; i++) px(c, 90 + i, 37 - i, 162 - 2 * i, 1, i % 4 === 0 ? "#a8452a" : "#c4583a");
      px(c, 112, 56, 26, 20, "#7a4a22");
      px(c, 114, 58, 22, 16, "#9fd6f2");
      px(c, 124, 58, 2, 16, "#7a4a22");
      px(c, 196, 60, 22, 52, "#7a4a22");
      px(c, 198, 62, 18, 50, "#a0663a");
      px(c, 212, 86, 2, 2, "#f2c14e");
      px(c, 152, 52, 1, 60, "#8a8a92");
      for (let x = 150; x < 190; x += 6) {
        px(c, x, 66, 5, 8, ["#e85a9b", "#2f63d6", "#ffd23f", "#f4f4f6"][(x / 6) % 4 | 0]);
        px(c, x + 2, 64, 1, 2, "#8a8a92");
      }
      px(c, 146, 64, 50, 1, "#8a8a92");
      arvore(c, 40, 54);
      arvore(c, 286, 58);
      px(c, 0, 112, W, 68, "#4f9e45");
      px(c, 0, 112, W, 2, "#6fbf5a");
      const r = sorteador(4);
      for (let i = 0; i < 160; i++) px(c, Math.floor(r() * W), 114 + Math.floor(r() * 66), 1, 2, "#3f8a3c");
      px(c, 250, 96, 30, 4, "#5a3a22");
      px(c, 252, 100, 26, 10, "#3a3a46");
      px(c, 254, 110, 2, 6, "#3a3a46");
      px(c, 274, 110, 2, 6, "#3a3a46");
      for (let x = 254; x < 278; x += 3) px(c, x, 95, 2, 1, "#d23c28");
    },
    animado(c, t) {
      for (let i = 0; i < 4; i++) {
        const subida = (t * 0.3 + i * 9) % 36;
        px(c, 262 + Math.round(Math.sin((t + i * 20) * 0.08) * 3), 92 - subida, 3, 2, `rgba(230,230,235,${(1 - subida / 36) * 0.7})`);
      }
    },
  },

  escola: {
    ceu(c) {
      faixas(c, 0, 112, ["#4aa8ea", "#5db3ee", "#72bff2", "#8ccbf5", "#a8d8f8"]);
    },
    atras(c, t) {
      nuvem(c, (t * 0.07) % 380 - 40, 16);
      nuvem(c, (t * 0.05 + 180) % 380 - 40, 30);
    },
    fundo(c) {
      px(c, 30, 30, 260, 82, "#f1e8d4");
      px(c, 30, 30, 260, 6, "#2f63d6");
      px(c, 30, 72, 260, 3, "#2f63d6");
      for (let x = 42; x < 280; x += 30) {
        if (x > 140 && x < 180) continue;
        px(c, x, 42, 18, 22, "#5a7a9a");
        px(c, x + 2, 44, 14, 18, "#bfe3ff");
        px(c, x + 8, 44, 2, 18, "#5a7a9a");
        px(c, x, 80, 18, 20, "#5a7a9a");
        px(c, x + 2, 82, 14, 16, "#bfe3ff");
      }
      px(c, 146, 40, 28, 12, "#2f63d6");
      escrever(c, "ESCOLA", 149, 44, "#ffffff");
      px(c, 146, 76, 28, 36, "#7a4a22");
      px(c, 148, 78, 24, 34, "#a0663a");
      px(c, 159, 78, 2, 34, "#7a4a22");
      px(c, 178, 40, 40, 13, "#ffffff");
      px(c, 178, 52, 40, 1, "#c9c0ae");
      escrever(c, "SEÇÃO", 188, 41, "#2149a8");
      escrever(c, "ELEITORAL", 180, 47, "#2149a8");
      px(c, 0, 112, W, 68, "#d8d0c4");
      for (let y = 118; y < H; y += 10) px(c, 0, y, W, 1, "#c2b9ab");
      for (let x = 0; x < W; x += 20) px(c, x, 112, 1, 68, "#c9c0b2");
      px(c, 14, 20, 2, 92, "#d0d0d8");
    },
    animado(c, t) {
      bandeira(c, 16, 22, t);
    },
  },

  fabrica: {
    ceu(c) {
      px(c, 0, 0, W, H, "#2a2420");
    },
    fundo(c) {
      for (let y = 0; y < 112; y += 8) for (let x = (y / 8) % 2 ? 0 : 8; x < W; x += 16) px(c, x, y, 15, 7, "#3a302a");
      for (const jx of [24, 248]) {
        px(c, jx, 14, 48, 30, "#141210");
        for (let i = 0; i < 4; i++) px(c, jx + 2 + i * 12, 16, 10, 26, "#4f5f6a");
      }
      px(c, 132, 16, 56, 56, "#8a8a92");
      px(c, 136, 20, 48, 48, "#f4f1ea");
      for (const [x, y] of [[159, 21], [159, 63], [137, 43], [181, 43]]) px(c, x, y, 2, 2, "#1a1a1f");
      px(c, 140, 76, 40, 30, "#5c5c66");
      px(c, 146, 82, 28, 4, "#1a1a1f");
      escrever(c, "PONTO", 151, 92, "#ffdf00");
      px(c, 0, 106, W, 6, "#4a4a55");
      for (let x = 0; x < W; x += 12) px(c, x, 107, 6, 4, "#2a2a34");
      px(c, 0, 112, W, 68, "#3a3a42");
      for (let x = 0; x < W; x += 24) px(c, x, 112, 1, 68, "#2e2e36");
      for (let x = 0; x < W; x += 40) {
        px(c, x, 112, 20, 3, "#ffdf00");
        px(c, x + 20, 112, 20, 3, "#1a1a1f");
      }
    },
    animado(c, t) {
      const angulo = (t / 30) % (Math.PI * 2);
      for (let i = 1; i < 18; i++) px(c, 160 + Math.round(Math.cos(angulo) * i) - 1, 44 + Math.round(Math.sin(angulo) * i) - 1, 2, 2, "#d23c28");
      for (let i = 1; i < 12; i++) px(c, 159, 44 - i, 2, 1, "#1a1a1f");
      px(c, 158, 42, 4, 4, "#1a1a1f");
    },
  },

  tres: {
    ceu(c) {
      faixas(c, 0, 108, ["#141a44", "#23245e", "#3f2a74", "#6e2f7a", "#a33b72", "#d6566a", "#f07e56", "#f8a856"]);
      const r = sorteador(13);
      for (let i = 0; i < 24; i++) px(c, Math.floor(r() * W), Math.floor(r() * 30), 1, 1, "#ffffff");
      circulo(c, 160, 96, 16, "#ffcf6e");
      circulo(c, 160, 96, 12, "#ffe39a");
    },
    fundo(c) {
      const [B, S, D] = ["#efe6ee", "#c9bcd2", "#9a8cae"];
      px(c, 147, 30, 11, 62, B);
      px(c, 162, 30, 11, 62, B);
      px(c, 147, 30, 2, 62, S);
      px(c, 162, 30, 2, 62, S);
      for (let y = 33; y < 90; y += 3) {
        px(c, 149, y, 8, 1, D);
        px(c, 164, y, 8, 1, D);
      }
      px(c, 158, 46, 4, 6, B);
      for (let i = 0; i < 9; i++) {
        const w = 16 + i * 3;
        px(c, 100 - w / 2, 91 - i, w, 1, i === 8 ? S : B);
      }
      for (let y = -10; y <= 0; y++) {
        const w = Math.floor(Math.sqrt(100 - y * y));
        px(c, 220 - w, 91 + y, 2 * w + 1, 1, y < -7 ? S : B);
      }
      px(c, 56, 92, 208, 10, B);
      px(c, 56, 100, 208, 2, S);
      px(c, 56, 102, 208, 2, D);
      for (let x = 64; x < 260; x += 8) px(c, x, 94, 1, 6, S);
      px(c, 0, 104, W, 76, "#d8d0c4");
      for (let y = 112; y < H; y += 12) px(c, 0, y, W, 1, "#c2b9ab");
      for (let x = 0; x < W; x += 24) px(c, x, 104, 1, 76, "#c9c0b2");
      px(c, 292, 20, 2, 92, "#d0d0d8");
    },
    animado(c, t) {
      bandeira(c, 294, 22, t);
    },
  },
};

const CAMADAS = {};

function camada(id, nome) {
  const chave = `${id}:${nome}`;
  if (!CAMADAS[chave]) {
    const tela = document.createElement("canvas");
    tela.width = W;
    tela.height = H;
    CENARIOS[id][nome](tela.getContext("2d"));
    CAMADAS[chave] = tela;
  }
  return CAMADAS[chave];
}

/** Desenha o céu, o fundo e as partes animadas do cenário. */
export function desenharCenario(c, id, t) {
  const cenario = CENARIOS[id];
  c.drawImage(camada(id, "ceu"), 0, 0);
  cenario.atras?.(c, t);
  c.drawImage(camada(id, "fundo"), 0, 0);
  cenario.animado?.(c, t);
}
