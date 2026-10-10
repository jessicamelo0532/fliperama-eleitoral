/**
 * Mapa da campanha: estrada que liga as fases, com um prédio para cada uma.
 * Desenhado em 160x120 px e ampliado sem suavização.
 */

/** Posição de cada fase no mapa, em fração da largura e da altura. */
export const PONTOS_DO_MAPA = [[0.16, 0.76], [0.38, 0.38], [0.64, 0.7], [0.86, 0.32]];

const LARGURA = 160;
const ALTURA = 120;

function retangulo(ctx, cor, x, y, l, a) {
  ctx.fillStyle = cor;
  ctx.fillRect(Math.round(x), Math.round(y), l, a);
}

/* Prédios desenhados acima de cada ponto: (x, y) é a base central. */
const PREDIOS = {
  rachadinha(ctx, x, y) {
    retangulo(ctx, "#efe7d6", x - 12, y - 14, 24, 10);
    retangulo(ctx, "#c9bfa8", x - 12, y - 5, 24, 1);
    retangulo(ctx, "#efe7d6", x - 5, y - 19, 10, 5);
    retangulo(ctx, "#efe7d6", x - 3, y - 21, 6, 2);
    for (let i = -9; i <= 9; i += 4) retangulo(ctx, "#8f8366", x + i, y - 12, 1, 7);
  },
  chocolateria(ctx, x, y) {
    retangulo(ctx, "#f4f1ea", x - 10, y - 13, 20, 9);
    for (let i = -10; i < 10; i += 4) retangulo(ctx, i % 8 === 0 ? "#ff6fae" : "#ffffff", x + i, y - 16, 4, 3);
    retangulo(ctx, "#5b3216", x - 2, y - 9, 4, 5);
    retangulo(ctx, "#41a7d1", x - 8, y - 11, 4, 3);
    retangulo(ctx, "#41a7d1", x + 4, y - 11, 4, 3);
  },
  patrocinio(ctx, x, y) {
    retangulo(ctx, "#2b313b", x - 11, y - 15, 22, 11);
    retangulo(ctx, "#f2c14e", x - 9, y - 13, 18, 2);
    retangulo(ctx, "#f4f1ea", x - 4, y - 21, 8, 5);
    for (let i = -4; i < 4; i += 2) retangulo(ctx, "#1a1a1f", x + i, y - 21, 1, 2);
    retangulo(ctx, "#5b3216", x - 2, y - 9, 4, 5);
  },
  indulto(ctx, x, y) {
    retangulo(ctx, "#7a4a22", x - 12, y - 8, 24, 4);
    retangulo(ctx, "#5e3b1a", x - 12, y - 5, 24, 1);
    retangulo(ctx, "#f4f1ea", x - 3, y - 13, 6, 5);
    retangulo(ctx, "#8a8a92", x - 11, y - 20, 1, 12);
    retangulo(ctx, "#8a8a92", x + 10, y - 20, 1, 12);
    retangulo(ctx, "#d23c28", x - 10, y - 20, 5, 3);
    retangulo(ctx, "#f4f1ea", x + 5, y - 20, 5, 3);
  },
};

/** Desenha o chão, a estrada e os prédios das fases informadas, na ordem do mapa. */
export function desenharMapa(tela, ids) {
  const ctx = tela.getContext("2d");
  retangulo(ctx, "#1f3d2b", 0, 0, LARGURA, ALTURA);
  ctx.fillStyle = "#2a5238";
  for (let y = 0; y < ALTURA; y += 6) for (let x = (y / 6) % 2 ? 0 : 3; x < LARGURA; x += 6) ctx.fillRect(x, y, 1, 1);

  const pontos = PONTOS_DO_MAPA.slice(0, ids.length).map(([x, y]) => [x * LARGURA, y * ALTURA]);
  for (let i = 0; i < pontos.length - 1; i++) {
    const [x1, y1] = pontos[i];
    const [x2, y2] = pontos[i + 1];
    const passos = Math.ceil(Math.hypot(x2 - x1, y2 - y1));
    for (let p = 0; p <= passos; p++) {
      const x = x1 + ((x2 - x1) * p) / passos;
      const y = y1 + ((y2 - y1) * p) / passos;
      retangulo(ctx, "#3a3a46", x - 3, y - 3, 7, 7);
    }
    for (let p = 0; p <= passos; p += 6) {
      const x = x1 + ((x2 - x1) * p) / passos;
      const y = y1 + ((y2 - y1) * p) / passos;
      retangulo(ctx, "#f2c14e", x, y, 2, 1);
    }
  }
  ids.forEach((id, i) => PREDIOS[id]?.(ctx, pontos[i][0], pontos[i][1] - 13));
}
