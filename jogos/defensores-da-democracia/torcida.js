/**
 * Torcida ao fundo das lutas: o grupo fixo de vermelho, cidadãos comuns de cada lugar, faixas e placas.
 * Cada pessoa tem uns 16 px de altura, com os pés na linha de base do cenário.
 */

import { W, px, larguraTexto, escrever, sorteador } from "./cenarios.js";

const VERMELHO = "#d0202a";
const VERMELHO_ESCURO = "#a01820";
const PELES = ["#f0c9a0", "#e0b08a", "#d9a27a", "#a86b3c", "#8d5524", "#6b4423", "#c68642"];
const CABELOS = ["#1a1009", "#3a2414", "#111111", "#7a4a1a", "#c98a3a"];
const CALCAS = ["#2a2a3a", "#2b3a55", "#4a3a2a", "#3a3550", "#1c1c28"];

/**
 * Torcida de cada cenário.
 * comuns: tipos sorteados para os lugares livres; especiais: pessoas fixas em uma posição.
 */
const TORCIDAS = {
  centro: {
    base: 120, grade: "#e8c547", semente: 5,
    cores: ["#2f63d6", "#ffd23f", "#22a84f", "#ff8a1f", "#f4f4f6", "#9b59b6"],
    comuns: ["celular", "celular", "celular", "sacola", "comum", "comum"],
    especiais: [{ tipo: "ambulante", x: 248 }],
    faixa: { texto: "CHECA ANTES DE ENVIAR", x: 160 },
    placas: ["FONTE?", "CHECA!", "É FAKE"],
  },
  quintal: {
    base: 124, grade: "#f4f1ea", semente: 8,
    cores: ["#2f63d6", "#ffd23f", "#22a84f", "#ff8a1f", "#f4f4f6", "#e85a9b"],
    comuns: ["celular", "celular", "prato", "comum", "familia"],
    especiais: [{ tipo: "avo", x: 232 }, { tipo: "correndo", x: 120, ate: 190 }, { tipo: "correndo", x: 150, ate: 210 }],
    faixa: { texto: "DOMINGO É DIA DE VOTAR", x: 160 },
    placas: ["BORA VOTAR", "MEU VOTO CONTA"],
  },
  escola: {
    base: 122, semente: 3, mulheres: true,
    cores: ["#2f63d6", "#ffd23f", "#22a84f", "#ff8a1f", "#f4f4f6", "#e85a9b", "#9b59b6"],
    comuns: ["livro", "mochila", "mochila", "titulo", "titulo", "comum"],
    especiais: [{ tipo: "mesaria", x: 186 }],
    faixa: { texto: "NENHUM DIREITO A MENOS", x: 160 },
    placas: ["MULHER VOTA", "VOTO É NOSSO", "TODAS NA URNA"],
  },
  fabrica: {
    base: 118, semente: 17,
    cores: ["#2f63d6", "#ff8a1f", "#22a84f", "#f4f4f6"],
    comuns: ["operario", "operario", "caixa", "entregador", "entregador"],
    especiais: [],
    faixa: { texto: "VIDA ALÉM DO TRABALHO", x: 160 },
    placas: ["FOLGA É DIREITO", "MAIS TEMPO"],
  },
  tres: {
    base: 120, grade: "#cfcfd8", semente: 21,
    cores: ["#22a84f", "#ffd23f", "#f4f4f6", "#2f63d6"],
    comuns: ["comum", "familia", "ombros", "comum", "bandeira"],
    especiais: [],
    faixa: { texto: "DEMOCRACIA SEMPRE", x: 160 },
    placas: ["VOTO LIVRE", "CONSTITUIÇÃO"],
  },
};

/* Torcedores de vermelho espalhados pela arena, nas mesmas posições em todos os cenários. */
const GRUPO_FIXO = [16, 44, 90, 234, 266, 300];
const POSICAO_DESTAQUE = 70;

/* ---------- Geração ---------- */

const CACHE = {};

function sortearPessoa(r, config, extra = {}) {
  const sorteio = (lista) => lista[Math.floor(r() * lista.length)];
  const mulher = config.mulheres || r() < 0.5;
  return {
    pele: sorteio(PELES),
    cabelo: sorteio(CABELOS),
    camisa: sorteio(config.cores),
    calca: sorteio(CALCAS),
    mulher,
    cabeloLongo: mulher && r() < 0.7,
    saia: mulher && r() < 0.4,
    fase: Math.floor(r() * 60),
    ...extra,
  };
}

function montarTorcida(id) {
  const config = TORCIDAS[id];
  const r = sorteador(config.semente);
  const pessoas = [];
  const larguraFaixa = larguraTexto(config.faixa.texto) + 10;
  const pontasDaFaixa = [config.faixa.x - larguraFaixa / 2, config.faixa.x + larguraFaixa / 2].map(Math.round);
  const fixos = [...GRUPO_FIXO, POSICAO_DESTAQUE];
  const ocupado = (x) => config.especiais.some((e) => Math.abs(e.x - x) < 10 && e.tipo !== "correndo")
    || pontasDaFaixa.some((p) => Math.abs(p - x) < 7)
    || fixos.some((f) => Math.abs(f - x) < 7);

  for (let x = 6; x < W - 4; x += 11 + Math.floor(r() * 4)) {
    if (ocupado(x)) continue;
    pessoas.push({ x, ...sortearPessoa(r, config), tipo: config.comuns[Math.floor(r() * config.comuns.length)] });
  }

  const comuns = pessoas.filter((p) => p.tipo !== "ombros" && p.tipo !== "familia" && (p.x < pontasDaFaixa[0] - 8 || p.x > pontasDaFaixa[1] + 8) && fixos.every((f) => Math.abs(f - p.x) > 16));
  comuns.filter((_, i) => i % 5 === 2).forEach((p, i) => { p.placa = config.placas[i % config.placas.length]; });
  comuns.filter((_, i) => i % 7 === 4).slice(0, 2).forEach((p) => { p.placa = null; p.tipo = "bandeira-vermelha"; });

  for (const p of pessoas) {
    const sobFaixa = p.x > pontasDaFaixa[0] - 12 && p.x < pontasDaFaixa[1] + 4;
    if (sobFaixa && ["bandeira", "ombros"].includes(p.tipo)) p.tipo = "comum";
  }
  for (const especial of config.especiais) pessoas.push({ ...sortearPessoa(r, config), ...especial });
  const segurando = pontasDaFaixa.map((x) => ({ x, ...sortearPessoa(r, config), tipo: "faixa" }));
  const grupo = GRUPO_FIXO.map((x) => ({ x, ...sortearPessoa(r, config), camisa: VERMELHO, tipo: "bandeira-brasil" }));

  pessoas.sort((a, b) => a.x - b.x);
  return { config, pessoas, segurando, grupo, pontasDaFaixa };
}

/* ---------- Desenho das pessoas ---------- */

function bracos(c, x, y, p, modo, t) {
  const manga = p.camisa;
  const ombro = (lado) => px(c, lado, y - 11, 1, 1, manga);
  const baixo = (lado) => { px(c, lado, y - 11, 1, 5, manga); px(c, lado, y - 6, 1, 1, p.pele); };
  const cima = (lado, onda = 0) => { ombro(lado); px(c, lado + onda, y - 17, 1, 6, p.pele); };
  const aceno = Math.round(Math.sin((t + p.fase) * 0.2));
  if (modo === "cima") { cima(x - 4); cima(x + 3); }
  else if (modo === "aceno") { baixo(x - 4); cima(x + 3, aceno); }
  else if (modo === "frente") { ombro(x - 4); ombro(x + 3); px(c, x - 3, y - 9, 6, 1, p.pele); }
  else { baixo(x - 4); baixo(x + 3); }
}

function corpo(c, x, y, p, modo, t) {
  if (p.saia) {
    px(c, x - 3, y - 6, 6, 3, p.calca);
    px(c, x - 2, y - 3, 1, 3, p.pele);
    px(c, x + 1, y - 3, 1, 3, p.pele);
  } else {
    px(c, x - 2, y - 4, 2, 4, p.calca);
    px(c, x + 1, y - 4, 2, 4, p.calca);
  }
  px(c, x - 3, y - 11, 6, p.saia ? 5 : 7, p.camisa);
  bracos(c, x, y, p, modo, t);
  px(c, x - 2, y - 15, 4, 4, p.pele);
  px(c, x - 2, y - 16, 4, 1, p.cabelo);
  px(c, x - 3, y - 15, 1, 1, p.cabelo);
  px(c, x + 2, y - 15, 1, 1, p.cabelo);
  if (p.cabeloLongo) {
    px(c, x - 3, y - 14, 1, 4, p.cabelo);
    px(c, x + 2, y - 14, 1, 4, p.cabelo);
  }
}

function crianca(c, x, y, p, pernas = 0) {
  px(c, x - 1 - pernas, y - 3, 1, 3, p.calca);
  px(c, x + 1 + pernas, y - 3, 1, 3, p.calca);
  px(c, x - 2, y - 8, 4, 5, p.camisa);
  px(c, x - 2, y - 11, 3, 3, p.pele);
  px(c, x - 2, y - 12, 3, 1, p.cabelo);
}

function bandeirinhaDoBrasil(c, x, y, t, fase) {
  const onda = Math.round(Math.sin((t + fase) * 0.15));
  px(c, x, y, 1, 10, "#8a6a4a");
  const [fx, fy] = [x + 1, y + onda];
  px(c, fx, fy, 8, 6, "#1f9a48");
  px(c, fx + 3, fy + 1, 2, 1, "#ffd23f");
  px(c, fx + 1, fy + 2, 6, 2, "#ffd23f");
  px(c, fx + 3, fy + 4, 2, 1, "#ffd23f");
  px(c, fx + 3, fy + 2, 2, 2, "#2343a3");
}

function bandeirinhaVermelha(c, x, y, t, fase) {
  px(c, x, y, 1, 10, "#8a6a4a");
  for (let i = 0; i < 8; i++) {
    const onda = Math.round(Math.sin((t + fase) * 0.15 - i * 0.6) * (i / 7));
    px(c, x + 1 + i, y + onda, 1, 5, VERMELHO);
    px(c, x + 1 + i, y + 4 + onda, 1, 1, VERMELHO_ESCURO);
  }
}

function placa(c, x, y, texto) {
  const w = larguraTexto(texto) + 4;
  const sx = Math.max(1, Math.min(W - w - 1, x - Math.floor(w / 2)));
  px(c, x, y - 24, 1, 8, "#8a6a4a");
  px(c, sx - 1, y - 31, w + 2, 9, "#0b0b12");
  px(c, sx, y - 30, w, 7, "#fbf8ef");
  escrever(c, texto, sx + 2, y - 29, "#c81d25");
}

const ITENS = {
  celular(c, x, y, p) {
    px(c, x - 1, y - 10, 3, 1, p.pele);
    px(c, x, y - 12, 2, 3, "#14161d");
    px(c, x, y - 12, 1, 1, "#5ad1ff");
  },
  sacola(c, x, y) {
    px(c, x + 3, y - 6, 3, 3, "#e8d9a8");
    px(c, x + 4, y - 7, 1, 1, "#3f8a3c");
  },
  prato(c, x, y) {
    px(c, x - 3, y - 9, 6, 1, "#ffffff");
    px(c, x - 1, y - 10, 2, 1, "#a0522d");
  },
  livro(c, x, y, p) {
    px(c, x - 2, y - 10, 4, 3, ["#d23c28", "#2f63d6", "#22a84f"][p.fase % 3]);
    px(c, x - 2, y - 10, 1, 3, "#f4f1ea");
  },
  mochila(c, x, y, p) {
    const cor = ["#e8b923", "#d23c28", "#2f63d6"][p.fase % 3];
    px(c, x - 2, y - 11, 1, 6, cor);
    px(c, x + 1, y - 11, 1, 6, cor);
  },
  titulo(c, x, y, p, t) {
    const aceno = Math.round(Math.sin((t + p.fase) * 0.2));
    px(c, x + 3 + aceno, y - 20, 3, 3, "#f4f1ea");
    px(c, x + 3 + aceno, y - 20, 3, 1, "#22a84f");
  },
  caixa(c, x, y) {
    px(c, x, y - 10, 2, 2, "#ffffff");
  },
};

function desenharPessoa(c, p, base, t, comemorando) {
  const pulo = comemorando ? Math.round(Math.abs(Math.sin((t + p.fase) * 0.22)) * 3) : ((t + p.fase) >> 5) & 1;
  const y = base - pulo;
  const { x } = p;
  switch (p.tipo) {
    case "ambulante": {
      px(c, x + 6, y - 22, 1, 18, "#8a8a92");
      for (let i = 0; i < 18; i += 3) px(c, x - 3 + i, y - 24, 3, 3, i % 6 ? "#ffd23f" : "#2f63d6");
      px(c, x + 2, y - 9, 14, 6, "#f4f1ea");
      px(c, x + 2, y - 9, 14, 1, "#c9c0ae");
      px(c, x + 4, y - 3, 3, 3, "#2a2a34");
      px(c, x + 12, y - 3, 3, 3, "#2a2a34");
      corpo(c, x - 4, base, { ...p, mulher: false, cabeloLongo: false, saia: false }, "aceno", t);
      return;
    }
    case "avo": {
      const balanco = Math.round(Math.sin((t + p.fase) * 0.06));
      const avo = { ...p, cabelo: "#e8e8e8", mulher: true, cabeloLongo: false, saia: false, camisa: "#9b59b6" };
      px(c, x - 5 + balanco, base - 13, 2, 10, "#7a4a22");
      px(c, x - 5, base - 1, 12, 1, "#7a4a22");
      px(c, x - 4 + balanco, base - 6, 9, 2, "#a0663a");
      px(c, x - 3 + balanco, base - 13, 6, 7, avo.camisa);
      px(c, x + 2 + balanco, base - 6, 3, 2, avo.calca);
      px(c, x + 4 + balanco, base - 5, 1, 4, avo.pele);
      px(c, x - 2 + balanco, base - 17, 4, 4, avo.pele);
      px(c, x - 2 + balanco, base - 18, 4, 1, avo.cabelo);
      px(c, x - 3 + balanco, base - 18, 1, 3, avo.cabelo);
      px(c, x + 2 + balanco, base - 11, 1, 3, avo.pele);
      return;
    }
    case "correndo": {
      const ida = p.ate - p.x;
      const passo = (t * 0.5 + p.fase * 3) % (ida * 2);
      const cx = Math.round(p.x + (passo < ida ? passo : ida * 2 - passo));
      crianca(c, cx, base, p, ((t >> 3) & 1) ? 1 : 0);
      return;
    }
    case "familia":
      corpo(c, x, y, p, "baixo", t);
      crianca(c, x + 6, y, { ...p, camisa: "#ffd23f" });
      return;
    case "ombros":
      corpo(c, x, y, p, "cima", t);
      crianca(c, x, y - 12, { ...p, camisa: "#22a84f" });
      bandeirinhaDoBrasil(c, x + 2, y - 32, t, p.fase);
      return;
    case "operario":
      corpo(c, x, y, { ...p, camisa: "#2f5fa6", cabeloLongo: false, saia: false }, comemorando ? "cima" : "baixo", t);
      px(c, x - 3, y - 17, 6, 2, "#ffd23f");
      px(c, x - 3, y - 15, 7, 1, "#e0b020");
      return;
    case "entregador": {
      const bag = ["#e8501a", "#2e9e4f", "#d23c28"][p.fase % 3];
      px(c, x - 4, y - 17, 8, 8, bag);
      corpo(c, x, y, { ...p, camisa: bag }, comemorando ? "cima" : "baixo", t);
      return;
    }
    case "caixa":
      corpo(c, x, y, { ...p, camisa: "#22a84f" }, "aceno", t);
      ITENS.caixa(c, x, y);
      return;
    case "mesaria":
      corpo(c, x, y, p, "frente", t);
      px(c, x - 3, y - 11, 2, 7, "#ff8a1f");
      px(c, x + 1, y - 11, 2, 7, "#ff8a1f");
      px(c, x, y - 10, 1, 2, "#ffffff");
      return;
    case "bandeira":
    case "bandeira-brasil":
      corpo(c, x, y, p, "aceno", t);
      bandeirinhaDoBrasil(c, x + 3, y - 26, t, p.fase);
      return;
    case "bandeira-vermelha":
      corpo(c, x, y, p, "aceno", t);
      bandeirinhaVermelha(c, x + 3, y - 26, t, p.fase);
      return;
    case "faixa":
      corpo(c, x, y, p, "cima", t);
      return;
    default: {
      const modo = p.placa || comemorando ? "cima" : ["celular", "livro", "prato"].includes(p.tipo) ? "baixo" : p.tipo === "titulo" ? "aceno" : p.fase % 3 ? "baixo" : "aceno";
      corpo(c, x, y, p, modo, t);
      if (!p.placa) ITENS[p.tipo]?.(c, x, y, p, t);
      if (p.placa) placa(c, x, y, p.placa);
    }
  }
}

/* Torcedor inspirado no Lula (D28): maior que os outros, cabelo e barba grisalhos, camisa vermelha, braços para cima. */
function desenharDestaque(c, base, t) {
  const pulo = Math.round(Math.abs(Math.sin(t * 0.12)) * 2);
  const aceno = Math.round(Math.sin(t * 0.2));
  const [x, y] = [POSICAO_DESTAQUE, base + 4 - pulo];
  const [pele, branco, barba, olho] = ["#e0ac84", "#ececec", "#c4c4c4", "#2a2a34"];
  px(c, x - 3, y - 5, 3, 5, "#2a2a3a");
  px(c, x + 1, y - 5, 3, 5, "#2a2a3a");
  px(c, x - 3, y - 1, 3, 1, "#14141a");
  px(c, x + 1, y - 1, 3, 1, "#14141a");
  px(c, x - 4, y - 14, 8, 9, VERMELHO);
  px(c, x - 4, y - 14, 1, 9, VERMELHO_ESCURO);
  for (const [lado, onda] of [[x - 6, -aceno], [x + 4, aceno]]) {
    px(c, lado, y - 16, 2, 3, VERMELHO);
    px(c, lado + onda, y - 23, 2, 7, pele);
  }
  px(c, x - 1, y - 15, 2, 1, pele);
  px(c, x - 3, y - 21, 6, 6, pele);
  px(c, x - 3, y - 22, 6, 1, branco);
  px(c, x - 4, y - 21, 1, 4, branco);
  px(c, x + 3, y - 21, 1, 4, branco);
  px(c, x - 2, y - 19, 1, 1, olho);
  px(c, x + 1, y - 19, 1, 1, olho);
  px(c, x - 3, y - 17, 6, 2, barba);
  px(c, x - 2, y - 15, 4, 1, barba);
  px(c, x - 1, y - 17, 2, 1, "#8a3a2a");
}

/* A faixa fica bem acima da torcida, para os lutadores e as bandeiras não cobrirem o texto. */
function desenharFaixa(c, [xa, xb], base, texto, t) {
  const balanco = ((t >> 5) & 1);
  const topo = base - 62 - balanco;
  px(c, xa, topo, 1, base - 17 - topo, "#8a6a4a");
  px(c, xb, topo, 1, base - 17 - topo, "#8a6a4a");
  px(c, xa + 1, topo, xb - xa - 1, 9, "#0b0b12");
  px(c, xa + 2, topo + 1, xb - xa - 3, 7, "#fbf8ef");
  escrever(c, texto, Math.round((xa + xb) / 2 - larguraTexto(texto) / 2), topo + 2, "#c81d25");
}

/** Desenha a torcida do cenário. */
export function desenharTorcida(c, id, t, comemorando) {
  if (!TORCIDAS[id]) return;
  const torcida = CACHE[id] || (CACHE[id] = montarTorcida(id));
  const { config, pessoas, segurando, grupo, pontasDaFaixa } = torcida;
  for (const p of pessoas) desenharPessoa(c, p, config.base, t, comemorando);
  for (const p of segurando) desenharPessoa(c, p, config.base, t, comemorando);
  desenharFaixa(c, pontasDaFaixa, config.base, config.faixa.texto, t);
  for (const p of grupo) desenharPessoa(c, p, config.base + 1, t, true);
  desenharDestaque(c, config.base, t);
  if (config.grade) {
    const [cor, by] = [config.grade, config.base];
    px(c, 0, by - 5, W, 1, cor);
    px(c, 0, by - 1, W, 2, cor);
    for (let x = 4; x < W; x += 18) px(c, x, by - 6, 2, 8, cor);
  }
}
