/**
 * Desenho dos lutadores em pixel art, com silhueta arredondada.
 * Origem nos pés (x = 0, y = 0); y cresce para cima com valores negativos.
 */

const ALTURA_PERNA = 17;
const ALTURA_TRONCO = 14;

/* Larguras do tronco, linha a linha (do ombro à cintura/quadril). */
const TRONCO = {
  m: [9, 12, 12, 12, 12, 11, 11, 11, 10, 10, 10, 10, 10, 10],
  f: [8, 10, 10, 10, 9, 9, 8, 8, 8, 9, 10, 10, 11, 11],
};

/* Cabeça 10x10, linha a linha: masculina mais quadrada, feminina com queixo fino. */
const CABECA = {
  m: [6, 8, 10, 10, 10, 10, 10, 10, 8, 6],
  f: [6, 8, 10, 10, 10, 10, 10, 9, 8, 6],
};

export function desenharLutador(ctx, L, pose, t, facing, ox, oy) {
  const R = (x, y, w, h, cor) => {
    if (!cor || w <= 0 || h <= 0) return;
    ctx.fillStyle = cor;
    ctx.fillRect(facing === 1 ? ox + x : ox - x - w, oy + y, w, h);
  };
  const linhas = (x0, y0, larguras, cor, centro = 0) => {
    larguras.forEach((w, i) => R(x0 + centro - Math.floor(w / 2), y0 + i, w, 1, cor));
  };

  if (pose === "ko") { deitado(R, L); return; }

  const bob = pose === "idle" ? ((t >> 4) & 1) : 0;
  const inclina = { hurt: -2, kick: -1, punch: 1, special: 1 }[pose] ?? 0;
  const yQuadril = -ALTURA_PERNA + bob;
  const yOmbro = yQuadril - ALTURA_TRONCO;
  const yCabeca = yOmbro - 11;
  const cx = inclina;

  /* Cabelo de trás (fica atrás do corpo). */
  if (L.mochila) { R(cx - 9, yOmbro + 1, 5, 10, L.mochila); R(cx - 9, yOmbro + 1, 5, 1, L.mochilaEscura); R(cx - 8, yOmbro + 4, 3, 2, "#ffffff"); }
  cabeloAtras(R, L, cx, yCabeca);

  /* Braço de trás. */
  const larguraOmbro = TRONCO[L.corpo || "m"][2] + (L.jaleco ? 2 : 0);
  bracoAtras(R, L, pose, cx, yOmbro, cx - Math.floor(larguraOmbro / 2) - 2, t);

  /* Pernas. */
  pernas(R, L, pose, t, yQuadril);

  /* Tronco, saia, vestido, jaleco. */
  const larguras = TRONCO[L.corpo || "m"];
  if (L.jaleco) linhas(0, yOmbro, larguras.map((w) => w + 2), L.jaleco, cx);
  linhas(0, yOmbro, larguras, L.blusa, cx);
  R(cx - Math.floor(larguras[0] / 2), yOmbro, 2, ALTURA_TRONCO, L.blusaEscura);
  if (L.estampa) R(cx + 1, yOmbro + 4, 3, 3, L.estampa);
  if (L.codigo) {
    [[2, 0], [1, 1], [0, 2], [1, 3], [2, 4], [5, 0], [5, 1], [4, 2], [3, 3], [3, 4], [6, 0], [7, 1], [8, 2], [7, 3], [6, 4]]
      .forEach(([dx, dy]) => R(cx - 6 + dx, yOmbro + 3 + dy, 1, 1, L.codigo));
  }
  if (L.cracha) { R(cx + 1, yOmbro, 1, 4, "#f4f1ea"); R(cx, yOmbro + 4, 3, 3, "#f4f1ea"); R(cx, yOmbro + 5, 3, 1, "#d23c28"); }
  if (L.cruz) { R(cx + 1, yOmbro + 4, 3, 1, "#e5484d"); R(cx + 2, yOmbro + 3, 1, 3, "#e5484d"); }
  if (L.xadrez) { for (let i = -5; i < 6; i += 3) R(cx + i, yOmbro, 1, ALTURA_TRONCO, L.xadrez); R(cx - 5, yOmbro + 6, 11, 1, L.xadrez); }
  if (L.jaqueta) { R(cx - 5, yOmbro, 3, ALTURA_TRONCO - 1, L.jaqueta); R(cx + 2, yOmbro, 3, ALTURA_TRONCO - 1, L.jaqueta); R(cx - 6, yOmbro + 1, 1, 5, L.jaqueta); }
  if (L.jaleco) {
    R(cx - 6, yOmbro, 3, ALTURA_TRONCO + 7, L.jaleco); R(cx + 3, yOmbro, 3, ALTURA_TRONCO + 7, L.jaleco);
    R(cx - 6, yOmbro + ALTURA_TRONCO, 12, 7, L.jaleco); R(cx - 1, yOmbro + ALTURA_TRONCO, 2, 7, L.calca);
    R(cx - 6, yOmbro, 1, ALTURA_TRONCO + 7, L.jalecoEscuro);
  }
  if (L.saia) linhas(0, yQuadril, [11, 12, 12, 13, 13, 14, 14], L.saia, cx);
  if (L.vestido) linhas(0, yQuadril, [11, 12, 13, 13, 14, 14, 15, 15, 15], L.vestido, cx);
  if (L.avental) { R(cx - 3, yOmbro + 2, 6, 4, L.avental); linhas(0, yOmbro + 6, [7, 7, 8, 8, 9, 9, 10, 10, 10, 10, 10], L.avental, cx); R(cx - 1, yOmbro, 1, 2, L.avental); }
  R(cx - 5, yQuadril - 1, 10, 1, L.cinto);

  /* Pescoço e cabeça. */
  R(cx - 1, yOmbro - 1, 3, 2, L.pele);
  const feminino = L.corpo === "f";
  linhas(0, yCabeca, CABECA[feminino ? "f" : "m"], L.pele, cx);
  R(cx - 4, yCabeca + 4, 1, 2, L.peleEscura);
  if (feminino) {
    R(cx + 1, yCabeca + 4, 2, 2, "#141414");
    R(cx + 1, yCabeca + 4, 1, 1, "#ffffff");
    R(cx + 3, yCabeca + 3, 1, 1, "#141414");
    R(cx + 1, yCabeca + 2, 2, 1, L.sobrancelha || L.cabeloEscuro || L.cabelo);
    R(cx + 1, yCabeca + 8, 2, 1, pose === "hurt" ? "#3a0a0a" : (L.boca || "#c2455a"));
  } else {
    R(cx + 2, yCabeca + 4, 2, 2, "#141414");
    R(cx + 2, yCabeca + 4, 1, 1, "#ffffff");
    R(cx + 1, yCabeca + 3, 3, 1, L.sobrancelha || L.cabelo);
    R(cx + 2, yCabeca + 7, 2, 1, pose === "hurt" ? "#3a0a0a" : "#8a3a2a");
  }
  if (L.bochecha) R(cx + 3, yCabeca + 6, 1, 1, L.bochecha);
  if (L.oculos) {
    R(cx + 1, yCabeca + 3, 4, 4, L.armacao || "#1b1b1b");
    R(cx + 2, yCabeca + 4, 2, 2, "#d6ecff");
    R(cx + 3, yCabeca + 5, 1, 1, "#141414");
  }
  if (L.bigode) R(cx + 1, yCabeca + 6, 4, 1, L.bigode);
  cabeloFrente(R, L, cx, yCabeca);

  /* Braço da frente por cima. */
  bracoFrente(R, L, pose, t, cx, yOmbro);
}

function manga(L) { return L.jaleco || L.jaqueta || L.blusa; }

/* O braço de trás fica do lado de fora do tronco, para aparecer mesmo atrás do corpo. */
function bracoAtras(R, L, pose, cx, y, x, t) {
  const cor = L.mangaEscura || L.blusaEscura;
  if (pose === "block") { R(cx + 1, y - 4, 3, 7, cor); R(cx + 1, y - 6, 3, 2, L.peleEscura); return; }
  if (pose === "special") { R(cx + 2, y + 5, 9, 3, cor); R(cx + 11, y + 5, 3, 3, L.peleEscura); return; }
  if (pose === "win") { R(x, y - 9, 3, 10, cor); R(x, y - 12, 3, 3, L.peleEscura); return; }
  const balanco = pose === "walk" ? -Math.round(Math.sin(t * 0.3) * 1.5) : 0;
  R(x + balanco, y + 1, 3, 9, cor);
  R(x + balanco, y + 10, 3, 3, L.peleEscura);
}

function bracoFrente(R, L, pose, t, cx, y) {
  const cor = manga(L);
  const balanco = pose === "walk" ? Math.round(Math.sin(t * 0.3) * 1.5) : 0;
  switch (pose) {
    case "punch": R(cx + 3, y + 2, 8, 3, cor); R(cx + 11, y + 1, 4, 4, L.pele); break;
    case "block": R(cx + 4, y - 5, 3, 8, cor); R(cx + 4, y - 7, 3, 2, L.pele); break;
    case "special": R(cx + 3, y + 2, 9, 3, cor); R(cx + 12, y + 1, 4, 4, L.pele); break;
    case "kick": R(cx + 3, y + 2, 6, 3, cor); R(cx + 9, y + 2, 3, 3, L.pele); break;
    case "hurt": R(cx + 4, y - 3, 3, 7, cor); R(cx + 4, y - 5, 3, 2, L.pele); break;
    case "jump": R(cx + 3, y - 2, 3, 6, cor); R(cx + 3, y - 4, 3, 2, L.pele); break;
    default:
      R(cx + 3 + balanco, y + 1, 3, 9, cor);
      R(cx + 3 + balanco, y + 10, 3, 3, L.pele);
  }
}

function pernas(R, L, pose, t, yQuadril) {
  const perna = (x, cor, frente) => {
    R(x, yQuadril, 4, ALTURA_PERNA - 2, cor);
    R(x, -2, frente ? 6 : 5, 2, L.sapato);
    if (L.coturno) R(x, -5, 4, 3, L.sapato);
    if (L.estrelas) for (const dy of [3, 9]) estrela(R, x + 1, yQuadril + dy + (x & 1) * 2, L.estrelas);
  };
  const corTras = L.meia || L.calcaEscura;
  const corFrente = L.meia || L.calca;
  switch (pose) {
    case "walk": { const s = Math.round(Math.sin(t * 0.3) * 2.5); perna(-4 + s, corTras, false); perna(-s, corFrente, true); break; }
    case "kick": perna(-5, corTras, false); R(0, yQuadril + 1, 14, 4, corFrente); R(14, yQuadril, 3, 6, L.sapato); break;
    case "jump": R(-5, yQuadril, 4, 9, corTras); R(-5, yQuadril + 9, 5, 2, L.sapato); R(0, yQuadril, 6, 4, corFrente); R(3, yQuadril + 4, 4, 6, corFrente); R(3, yQuadril + 10, 6, 2, L.sapato); break;
    default: perna(-5, corTras, false); perna(0, corFrente, true);
  }
}

function estrela(R, x, y, cor) {
  R(x + 1, y, 1, 3, cor);
  R(x, y + 1, 3, 1, cor);
}

function cabeloAtras(R, L, cx, y) {
  const c = L.cabelo;
  switch (L.cabeloEstilo) {
    case "cachos":
      CACHOS_ATRAS.forEach(([de, ate], i) => mecha(R, L, cx + de, y - 1 + i, ate - de + 1));
      break;
    case "longo":
      R(cx - 6, y, 8, 22, c); R(cx - 7, y + 3, 1, 20, c);
      R(cx - 6, y + 22, 7, 2, c); R(cx - 5, y + 24, 2, 1, c); R(cx - 2, y + 24, 2, 1, c);
      R(cx - 4, y + 6, 1, 15, L.cabeloClaro || c);
      break;
    case "rock": R(cx - 7, y - 1, 10, 10, c); break;
    case "rabo": R(cx - 9, y + 2, 4, 3, c); R(cx - 10, y + 4, 3, 9, c); break;
    case "coque": R(cx - 8, y - 1, 4, 4, c); break;
    case "bob": R(cx - 6, y, 9, 10, c); break;
    default:
  }
}

function cabeloFrente(R, L, cx, y) {
  const c = L.cabelo;
  switch (L.cabeloEstilo) {
    case "cachos":
      CACHOS_FRENTE.forEach(([de, ate], i) => mecha(R, L, cx + de, y - 1 + i, ate - de + 1));
      mecha(R, L, cx + 4, y + 3, 2); mecha(R, L, cx + 5, y + 5, 1); mecha(R, L, cx + 4, y + 6, 2); mecha(R, L, cx + 5, y + 8, 1);
      break;
    case "longo":
      R(cx - 5, y - 1, 10, 3, c); R(cx + 4, y + 1, 1, 2, c); R(cx - 5, y + 2, 3, 3, c);
      R(cx - 7, y + 5, 4, 18, c); R(cx - 6, y + 23, 3, 2, c);
      R(cx - 5, y + 7, 1, 14, L.cabeloClaro || c);
      break;
    case "rock": R(cx - 5, y - 2, 10, 3, c); R(cx + 2, y + 1, 4, 2, c); R(cx - 5, y + 1, 3, 4, c); break;
    case "rabo": R(cx - 5, y - 1, 10, 3, c); R(cx - 5, y + 2, 2, 2, c); break;
    case "coque": R(cx - 5, y - 1, 10, 3, c); R(cx - 5, y + 2, 2, 3, c); break;
    case "curto": R(cx - 5, y - 1, 10, 2, c); R(cx - 5, y + 1, 2, 3, c); break;
    case "bob": R(cx - 5, y - 1, 10, 3, c); R(cx - 5, y + 2, 3, 5, c); R(cx + 4, y + 1, 1, 2, c); break;
    case "boina": R(cx - 5, y + 2, 2, 4, c); R(cx - 6, y - 2, 11, 3, L.boina); R(cx + 4, y, 3, 1, L.boina); break;
    case "bone": R(cx - 5, y + 2, 2, 3, c); R(cx - 5, y - 2, 10, 3, L.bone); R(cx + 4, y + 1, 4, 1, L.boneEscuro); R(cx - 2, y - 1, 3, 1, "#ffffff"); break;
    case "chapeu": R(cx - 5, y + 2, 2, 3, c); R(cx - 8, y, 16, 2, "#c9a14a"); R(cx - 5, y - 4, 10, 4, "#e2c473"); R(cx - 5, y - 1, 10, 1, "#7a4a22"); break;
    case "penteado": R(cx - 5, y - 1, 10, 2, c); R(cx - 5, y + 1, 2, 3, c); R(cx - 1, y - 2, 4, 1, c); break;
    default:
  }
}

/* Cachos soltos: rente no alto da cabeça e caindo em ondas até abaixo dos ombros. */
const CACHOS_ATRAS = [
  [-4, 3], [-6, 4], [-6, 5], [-7, 5], [-7, 3], [-7, 2], [-7, 1], [-8, 1], [-8, 0], [-7, 0],
  [-8, 0], [-8, -1], [-9, -1], [-8, -2], [-9, -2], [-9, -2], [-8, -3], [-9, -3], [-8, -4], [-9, -5],
];
const CACHOS_FRENTE = [[-4, 3], [-6, 4], [-6, 5], [-6, 0], [-6, -3], [-6, -4], [-6, -4]];

function corDoCacho(L, x, y) {
  const onda = [0, 1, 1, 0, -1, -1][((y % 6) + 6) % 6];
  const fase = (((x + onda) % 5) + 5) % 5;
  return fase === 0 ? L.cabeloClaro : fase === 4 ? L.cabeloEscuro : L.cabelo;
}

function mecha(R, L, x0, y, largura) {
  for (let x = x0; x < x0 + largura; x++) R(x, y, 1, 1, corDoCacho(L, x, y));
}

function deitado(R, L) {
  R(-24, -10, 10, 9, L.pele); R(-25, -11, 10, 3, L.cabelo);
  R(-14, -9, 15, 7, L.vestido || L.jaleco || L.blusa);
  R(1, -7, 13, 5, L.saia || L.vestido || L.calca); R(14, -8, 3, 6, L.sapato);
}

/* ---------- Vilões (maiores que os heróis) ---------- */

/**
 * Desenha um vilão com os pés em (ox, oy).
 * @param {"idle"|"walk"|"golpe"|"hurt"} pose
 */
export function desenharVilao(ctx, id, t, facing, ox, oy, pose = "idle") {
  const recuo = pose === "hurt" ? -2 : pose === "golpe" ? 2 : 0;
  const R = (x, y, w, h, cor) => {
    if (!cor || w <= 0 || h <= 0) return;
    ctx.fillStyle = cor;
    ctx.fillRect(facing === 1 ? ox + x + recuo : ox - x - w - recuo, oy + y, w, h);
  };
  const passo = pose === "walk" ? (t >> 3) & 1 : 0;
  VILOES[id](R, passo, t, pose);
  if (pose === "golpe" && BRACO_DO_VILAO[id]) {
    const { cor, mao, altura } = BRACO_DO_VILAO[id];
    R(10, altura, 16, 5, cor);
    R(26, altura - 1, 5, 7, mao);
  }
}

const BRACO_DO_VILAO = {
  "fake-news": { cor: "#2a2a34", mao: "#14161d", altura: -48 },
  retrocesso: { cor: "#1d1d24", mao: "#e6c9a8", altura: -38 },
  escala: { cor: "#8a8a92", mao: "#5c5c66", altura: -44 },
  desmonte: { cor: "#2a2a34", mao: "#14141a", altura: -54 },
};

const VILOES = {
  "fake-news"(R, passo, t) {
    const [corpo, borda] = ["#2a2a34", "#14161d"];
    R(-9, -14, 6, 14 + passo, corpo); R(3, -14, 6, 14 - passo + 1, corpo); R(-11, -1, 9, 2, borda); R(2, -1, 9, 2, borda);
    R(-17, -70, 34, 58, borda); R(-15, -68, 30, 54, corpo);
    R(-13, -64, 26, 44, "#e5ddd5");
    R(-13, -64, 26, 5, "#128c4a"); R(-11, -63, 3, 3, "#ffffff");
    R(-4, -68, 8, 2, borda); R(-6, -69, 3, 3, "#ff3b30"); R(3, -69, 3, 3, "#ff3b30");
    R(-12, -57, 16, 6, "#ffffff"); R(-11, -55, 2, 2, "#8a8a92"); R(-8, -55, 9, 1, "#8a8a92"); R(-8, -53, 6, 1, "#8a8a92");
    R(-4, -49, 16, 6, "#c8f7c5"); R(-3, -48, 4, 1, "#5c5c66"); R(2, -48, 2, 2, "#5c5c66"); R(-3, -46, 12, 1, "#5c5c66");
    for (const x of [6, 8]) [[4, 2], [3, 3], [2, 2], [1, 1], [0, 0]].forEach(([dx, dy]) => R(x + dx, -46 + dy, 1, 1, "#34b7f1"));
    R(-12, -41, 18, 12, "#ffffff");
    const onda = [2, 4, 6, 3, 7, 5, 2, 6, 4, 7, 3, 5, 2, 4];
    for (let i = 0; i < 14; i++) { const h = onda[(i + (t >> 2)) % onda.length]; R(-10 + i, -35 - Math.floor(h / 2), 1, h, "#1f8a44"); }
    R(-13, -24, 26, 4, "#f4f4f6"); R(8, -23, 3, 2, "#2fbf5f");
    R(-23, -52, 6, 4, corpo); R(-27, -58, 5, 9, corpo); R(17, -48, 6, 4, corpo); R(22, -48, 5, 9, corpo);
  },
  desanimo(R, passo, t, pose) {
    const [madeira, tecido, sombra, almofada] = ["#3a2414", "#8a5a3a", "#6a4226", "#b07a4a"];
    R(-20, -4, 3, 4, madeira); R(17, -4, 3, 4, madeira);
    R(-22, -16, 44, 12, "#7a4a2a"); R(-22, -16, 44, 1, sombra);
    R(-20, -21, 19, 6, almofada); R(1, -21, 19, 6, almofada); R(-1, -21, 2, 6, sombra);
    R(-20, -58, 40, 38, tecido); R(-18, -60, 36, 2, tecido); R(-20, -58, 3, 38, sombra);
    R(-27, -32, 7, 20, tecido); R(20, -32, 7, 20, tecido); R(-27, -32, 7, 2, almofada); R(20, -32, 7, 2, almofada);
    const ameaca = Math.round(Math.sin(t * 0.08));
    R(-32, -44 + ameaca, 5, 14 - ameaca, tecido); R(-32, -44 + ameaca, 2, 14 - ameaca, sombra); R(-35, -51 + ameaca, 10, 8, almofada); R(-35, -44 + ameaca, 10, 1, sombra);
    if (pose === "golpe") {
      R(27, -36, 16, 6, tecido); R(27, -31, 16, 1, sombra); R(43, -39, 10, 10, almofada); R(43, -30, 10, 1, sombra);
    } else {
      R(27, -44 - ameaca, 5, 14 + ameaca, tecido); R(30, -44 - ameaca, 2, 14 + ameaca, sombra); R(25, -51 - ameaca, 10, 8, almofada); R(25, -44 - ameaca, 10, 1, sombra);
    }
    const pisca = (t % 160) < 8 ? 3 : 2;
    for (const x of [-13, 4]) {
      R(x, -48, 9, 5, "#ffffff"); R(x, -48, 9, pisca, sombra); R(x + 3, -46 + (pisca - 2), 3, 2, "#14161d");
      R(x, -42, 9, 1, sombra);
    }
    const bocejo = 4 + Math.round((Math.sin(t * 0.05) + 1) * 2);
    R(-4, -37, 8, bocejo, "#3a1414"); R(-2, -37 + bocejo - 2, 4, 2, "#d65a8a");
    R(-31, -59 + ameaca, 4, 8, "#2a2a34"); R(-30, -58 + ameaca, 2, 1, "#ff3b30"); R(-30, -56 + ameaca, 2, 1, "#8a8a92");
    if ((t >> 5) & 1) { R(14, -66, 4, 1, "#f4f1ea"); R(16, -65, 1, 1, "#f4f1ea"); R(15, -64, 1, 1, "#f4f1ea"); R(14, -63, 4, 1, "#f4f1ea"); }
  },
  retrocesso(R, passo) {
    R(-7, -72, 14, 11, "#1d1d24"); R(-7, -64, 14, 2, "#3a3a46"); R(-12, -61, 24, 2, "#0a0a0a");
    R(-7, -59, 14, 12, "#e6c9a8"); R(2, -56, 3, 3, "#e8b923"); R(3, -55, 1, 1, "#0a0a0a"); R(-4, -55, 2, 2, "#0a0a0a"); R(-3, -50, 7, 1, "#8a8a92");
    R(-4, -47, 8, 3, "#f4f1ea");
    R(-12, -44, 24, 24, "#1d1d24"); R(-3, -44, 6, 10, "#f4f1ea"); R(-1, -44, 2, 8, "#8a1f2b");
    R(-16, -42, 4, 16, "#1d1d24"); R(-16, -26, 4, 3, "#e6c9a8"); R(12, -42, 4, 12, "#1d1d24");
    R(14, -36, 9, 12, "#ff8fb8"); R(14, -28, 9, 4, "#d65a8a"); R(14, -36, 9, 1, "#0a0a0a");
    R(-9, -20, 7, 18 + passo, "#1d1d24"); R(2, -20, 7, 19 - passo, "#1d1d24"); R(-10, -2, 9, 2, "#0a0a0a"); R(1, -2, 9, 2, "#0a0a0a");
  },
  escala(R, passo, t) {
    R(-16, -68, 32, 46, "#d23c28"); R(-16, -68, 3, 46, "#8a1f1f");
    R(-12, -64, 24, 22, "#f4f1ea"); for (const [x, y] of [[-1, -63], [-1, -45], [-11, -54], [9, -54]]) R(x, y, 2, 2, "#1a1a1f");
    const angulo = (t / 40) % (Math.PI * 2); R(-1, -54, 2, 2, "#1a1a1f");
    for (let i = 1; i < 8; i++) R(Math.round(Math.cos(angulo) * i) - 1, -54 + Math.round(Math.sin(angulo) * i), 2, 2, "#1a1a1f");
    for (let i = 1; i < 6; i++) R(-1, -54 - i, 2, 1, "#1a1a1f");
    R(-12, -38, 24, 3, "#1a1a1f"); R(-12, -35, 24, 2, "#ffdf00"); R(-12, -33, 24, 3, "#1a1a1f");
    R(-21, -50, 5, 16, "#8a8a92"); R(16, -50, 5, 16, "#8a8a92");
    R(-10, -22, 7, 20 + passo, "#8a1f1f"); R(3, -22, 7, 21 - passo, "#8a1f1f"); R(-11, -2, 9, 2, "#14161d"); R(2, -2, 9, 2, "#14161d");
  },
  desmonte(R, passo, t) {
    const [terno, escuro, camisa] = ["#2a2a34", "#1a1a22", "#d8d8e0"];
    R(-13, -28, 11, 26 + passo, escuro); R(2, -28, 11, 27 - passo, escuro); R(-15, -2, 13, 2, "#0a0a0a"); R(2, -2, 13, 2, "#0a0a0a");
    R(-20, -60, 40, 34, terno); R(-20, -60, 3, 34, escuro);
    R(-5, -60, 10, 14, camisa); R(-2, -58, 4, 18, "#b0141e"); R(-8, -60, 4, 16, escuro); R(4, -60, 4, 16, escuro);
    R(-9, -76, 18, 16, "#14141a"); R(-6, -70, 4, 2, "#ff3b30"); R(2, -70, 4, 2, "#ff3b30");
    R(-28, -72, 8, 24, terno); R(-30, -76, 10, 5, "#14141a");
    R(-34, -88, 11, 12, "#f4f1ea"); for (let y = -86; y < -78; y += 2) R(-32, y, 7, 1, "#9a9aa6");
    for (let x = -34; x < -23; x += 2) R(x, -76, 1, 1, "#f4f1ea");
    R(20, -58, 8, 20, terno);
    R(24, -46, 15, 13, "#1f9a48"); R(24, -46, 15, 1, "#146b33"); R(26, -42, 11, 2, "#ffd23f"); R(26, -38, 11, 1, "#ffd23f"); R(24, -33, 15, 2, "#f4f1ea");
    for (let i = 0; i < 3; i++) {
      const voo = (t * 0.5 + i * 23) % 60;
      R(-6 + i * 12 + Math.round(Math.sin((t + i * 40) * 0.07) * 4), -84 - voo * 0.6, 4, 5, "#f4f1ea");
    }
  },

};

/* ---------- Aparência dos heróis ---------- */

const BASE = { sapato: "#141414", cinto: "#1a1a1a" };

/** Paleta e roupas de cada personagem, pelo id de personagens.json. */
export const APARENCIAS = Object.fromEntries(Object.entries({
  melo: { corpo: "f", pele: "#e8b994", peleEscura: "#c99872", bochecha: "#e79a8a", cabelo: "#c98a3a", cabeloClaro: "#f0c070", cabeloEscuro: "#7a4a1a", cabeloEstilo: "cachos", blusa: "#d23c28", blusaEscura: "#a52a1c", jaqueta: "#1c1c24", mangaEscura: "#101016", saia: "#141418", meia: "#2a2a33", calca: "#2a2a33", calcaEscura: "#22222a", coturno: true, sapato: "#0e0e12" },
  almeida: { corpo: "m", pele: "#f0c9a0", peleEscura: "#d4a87c", cabelo: "#1a1410", cabeloEstilo: "rock", blusa: "#1c1c24", blusaEscura: "#101016", estampa: "#d23c28", jaleco: "#f4f4f6", jalecoEscuro: "#c9c9d1", mangaEscura: "#c9c9d1", calca: "#2b3550", calcaEscura: "#1e2640" },
  igor: { corpo: "m", pele: "#c68642", peleEscura: "#a66a2e", cabelo: "#141414", cabeloEstilo: "curto", oculos: true, blusa: "#3a3f4a", blusaEscura: "#2a2e36", codigo: "#7ff5e8", calca: "#2b3a55", calcaEscura: "#1f2a40", sapato: "#f0f0f0" },
  jheni: { corpo: "f", pele: "#f2cfae", peleEscura: "#d6ad88", bochecha: "#eaa090", cabelo: "#141414", cabeloClaro: "#2e2e3a", cabeloEstilo: "longo", estrelas: "#f2d34e", blusa: "#7442b3", blusaEscura: "#4e2a7d", calca: "#2a2a3a", calcaEscura: "#1c1c28", mochila: "#e8b923", mochilaEscura: "#b8901a", sapato: "#f0f0f0" },
  edson: { corpo: "m", pele: "#6b4423", peleEscura: "#4f3018", cabelo: "#111111", cabeloEstilo: "curto", blusa: "#2a6f97", blusaEscura: "#1d5070", estampa: "#f4f1ea", calca: "#2a2a3a", calcaEscura: "#1c1c28", sapato: "#141414" },
  fabiana: { corpo: "f", pele: "#b87a4b", peleEscura: "#9a5f36", bochecha: "#c4704a", cabelo: "#2a1a12", cabeloEstilo: "rabo", blusa: "#e8811a", blusaEscura: "#b85f0c", cracha: true, calca: "#1c1c28", calcaEscura: "#141420", sapato: "#141414" },
  rosa: { corpo: "f", pele: "#c68642", peleEscura: "#a66a2e", bochecha: "#d98a6a", cabelo: "#3a2a1e", cabeloEstilo: "coque", blusa: "#e85a9b", blusaEscura: "#b83f78", vestido: "#e85a9b", avental: "#f4f1ea", calca: "#c68642", calcaEscura: "#a66a2e", sapato: "#5a2a1a" },
  antonio: { corpo: "m", pele: "#d9a27a", peleEscura: "#b9825a", cabelo: "#d6d1c4", sobrancelha: "#d6d1c4", cabeloEstilo: "boina", boina: "#3a3a46", bigode: "#e8e4da", blusa: "#d6d1c4", blusaEscura: "#b0aba0", jaqueta: "#7a4a22", mangaEscura: "#5e3b1a", calca: "#4a4a55", calcaEscura: "#3a3a46", sapato: "#2a1a12" },
  lucia: { corpo: "f", pele: "#a86b3c", peleEscura: "#8a532a", bochecha: "#b8603a", cabelo: "#1a1009", cabeloEstilo: "coque", oculos: true, blusa: "#2f63d6", blusaEscura: "#2149a8", calca: "#3a3550", calcaEscura: "#2a2640", sapato: "#5a2a1a" },
  cida: { corpo: "f", pele: "#8d5524", peleEscura: "#6e4019", bochecha: "#a0603a", cabelo: "#2a1a12", cabeloEstilo: "bob", blusa: "#f4f1ea", blusaEscura: "#c9c9d1", cruz: true, calca: "#f4f1ea", calcaEscura: "#c9c9d1", sapato: "#f0f0f0" },
  raimundo: { corpo: "m", pele: "#7a4a2a", peleEscura: "#5e3820", cabelo: "#3a3a3a", cabeloEstilo: "chapeu", blusa: "#3f8a3a", blusaEscura: "#2e6a2a", xadrez: "#1f4f1c", calca: "#4a3a2a", calcaEscura: "#3a2a1e", sapato: "#2a1a12" },
  josue: { corpo: "m", pele: "#a86b3c", peleEscura: "#8a532a", cabelo: "#141414", cabeloEstilo: "penteado", blusa: "#8fc3e8", blusaEscura: "#5f9ccc", calca: "#2a2a3a", calcaEscura: "#1c1c28", sapato: "#2a1a12" },
}).map(([id, aparencia]) => [id, { ...BASE, ...aparencia }]));

/** Cores do projétil do especial de cada personagem: fundo, texto e borda. */
export const CORES_DO_ESPECIAL = {
  melo: ["#f4f1ea", "#a52a1c", "#1c1c24"],
  almeida: ["#f4f4f6", "#1e2640", "#d23c28"],
  igor: ["#14161d", "#41d1c6", "#41d1c6"],
  jheni: ["#7442b3", "#f2d34e", "#4e2a7d"],
  edson: ["#2a6f97", "#ffffff", "#1d5070"],
  fabiana: ["#e8811a", "#ffffff", "#b85f0c"],
  rosa: ["#ffffff", "#b83f78", "#e85a9b"],
  antonio: ["#7a4a22", "#f4f1ea", "#3a2a1e"],
  lucia: ["#1f7a3f", "#ffdf00", "#0b3a1c"],
  cida: ["#ffffff", "#d23c28", "#5f9ccc"],
  raimundo: ["#3f8a3a", "#ffdf00", "#1f4f1c"],
  josue: ["#8fc3e8", "#ffffff", "#2149a8"],
};
