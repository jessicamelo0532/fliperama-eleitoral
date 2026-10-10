/**
 * Pixel art do jogo: personagem, fiscais, juiz, itens e bônus.
 * Cada desenho é uma lista de linhas; cada letra aponta para uma cor da paleta.
 */

const cache = new Map();

/** Desenha um sprite em um canvas próprio, guardado em cache pela chave. */
export function sprite(chave, linhas, paleta, espelhar = false) {
  if (cache.has(chave)) return cache.get(chave);
  const altura = linhas.length;
  const largura = Math.max(...linhas.map((linha) => linha.length));
  const tela = document.createElement("canvas");
  tela.width = largura;
  tela.height = altura;
  const ctx = tela.getContext("2d");
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      const cor = paleta[linhas[y][espelhar ? largura - 1 - x : x]];
      if (!cor) continue;
      ctx.fillStyle = cor;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  cache.set(chave, tela);
  return tela;
}

/* ---------- Herdeiro Zero-Um ---------- */

const PALETA_HERDEIRO = {
  h: "#2b2118", s: "#d9a07a", S: "#b97a55", k: "#1a1410", n: "#33508c", N: "#22375f",
  w: "#f4f1ea", g: "#f2c14e", b: "#7a4a22", l: "#14161d",
};

const TRONCO_COM_NUMERO = ["..nnnwwnnn..", "..ngggnngn..", "..ngngnggnk.", "..ngngnngbbb", "..NgggNNgbgb"];

const HERDEIRO = {
  baixo: ["....hhhh....", "...hhhhhhh..", "...hsssss...", "...skssks...", "...ssSSss...", ...TRONCO_COM_NUMERO],
  lado: ["....hhhh....", "...hhhhhhh..", "...hhsssss..", "...hssksk...", "...ssssSs...", "..nnnwnnnn..", "..nnnnnnnn..", "..nnnnnnnnk.", "..nnnnnnnbbb", "..NNNNNNNbgb"],
  cima: ["....hhhh....", "...hhhhhh...", "...hhhhhh...", "...hhhhhh...", "...shhhhs...", ...TRONCO_COM_NUMERO],
  pernasA: ["...ll..ll...", "...ll..ll..."],
  pernasB: ["...ll..ll...", "..ll....ll.."],
};

/** Direções: 0 cima, 1 esquerda, 2 baixo, 3 direita. */
export function spriteHerdeiro(direcao, passo) {
  const corpo = direcao === 0 ? HERDEIRO.cima : direcao === 2 || direcao < 0 ? HERDEIRO.baixo : HERDEIRO.lado;
  const linhas = corpo.concat(passo ? HERDEIRO.pernasB : HERDEIRO.pernasA);
  return sprite(`herdeiro-${direcao}-${passo}`, linhas, PALETA_HERDEIRO, direcao === 1);
}

/* ---------- Fiscais ---------- */

/* Letras 3x5 para os crachás. */
const LETRAS = {
  P: ["111", "101", "111", "100", "100"], F: ["111", "100", "110", "100", "100"],
  M: ["101", "111", "111", "101", "101"], T: ["111", "010", "010", "010", "010"],
  V: ["101", "101", "101", "101", "010"], $: ["011", "110", "010", "011", "110"],
  z: ["000", "111", "010", "100", "111"], Z: ["111", "001", "010", "100", "111"],
};

export function spriteFiscal(fiscal, direcao, passo, sirene, suspenso, piscando) {
  const chave = ["fiscal", fiscal.id, direcao, passo, sirene, suspenso, piscando].join("-");
  if (cache.has(chave)) return cache.get(chave);
  const grade = [
    ".....ss.....", "..cccccccc..", ".cccccccccc.", "ccwwccccwwcc", "ccwwccccwwcc", "cccccccccccc",
    "cccccccccccc", "cccccccccccc", "cccccccccccc", "cccccccccccc", "dddddddddddd",
    passo ? "..dd..dd..dd" : "dd..dd..dd..",
  ].map((linha) => linha.split(""));
  if (suspenso) grade[0] = "............".split("");
  const olhos = { 0: [[2, 3], [8, 3]], 1: [[2, 4], [8, 4]], 2: [[2, 4], [9, 4]], 3: [[3, 4], [9, 4]] }[direcao < 0 ? 2 : direcao];
  olhos.forEach(([x, y]) => { grade[y][x] = "p"; });
  const rotulo = suspenso ? "zZ" : fiscal.sigla;
  const largura = rotulo.length * 4 - 1;
  const x0 = Math.round((12 - largura) / 2);
  [...rotulo].forEach((letra, k) => {
    const desenho = LETRAS[letra];
    if (!desenho) return;
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 3; x++) if (desenho[y][x] === "1") grade[5 + y][x0 + k * 4 + x] = "t";
    }
  });
  const paleta = suspenso
    ? { c: piscando ? "#f4f1ea" : "#8f9caa", d: piscando ? "#c9c2b0" : "#66727f", w: "#f4f1ea", p: "#1f2a36", t: piscando ? "#d23c28" : "#1f2a36" }
    : { c: fiscal.cor, d: fiscal.sombra, w: "#ffffff", p: "#0d1014", t: fiscal.letra, s: sirene ? "#ff4b3a" : "#3a8bff" };
  return sprite(chave, grade.map((linha) => linha.join("")), paleta);
}

/* Fiscal arquivado volta para a sala como uma pasta de processo. */
export const PASTA = {
  paleta: { T: "#c9a96a", Y: "#e2c88f", r: "#d23c28", O: "#a8874d" },
  linhas: ["..TTTT......", ".TTTTTTTTTT.", ".YYYYYYYYYY.", ".YYYYYYYYYY.", ".YYrrrrrrYY.", ".YYYYYYYYYY.", ".YYYYYYYYYY.", ".OOOOOOOOOO."],
};

export const LIMINAR = {
  paleta: { w: "#f3ead3", F: "#c9b98f", L: "#9b8b66", R: "#d23c28" },
  linhas: ["wwwwwF.", "wwwwwFF", "wLLLLww", "wwwwwww", "wLLLwww", "wwwwRww", "wwwRRRw", "wwwwRww"],
};

/* ---------- Juiz Absolvino ---------- */

export const JUIZ = {
  paleta: { H: "#d6d1c4", s: "#e3ad85", S: "#b97a55", k: "#1a1410", T: "#1d1d24", t: "#3a3a46", w: "#f4f1ea", b: "#8a5a2b", B: "#5e3b1a", g: "#f2c14e" },
  cima: ["................", ".....HHHHHH.....", "....HHHHHHHH....", "....HssssssH.bbb", "....skssssks.bbb", "....ssssssss..B.", "....ssSSSSss..B.", ".....ssssss...B.", "...TTTwwwwTTTsB.", "..TTTTTwwTTTTTs.", "..TTtTTTTTTtTTT.", "..TTtTTTTTTtTT..", "..TTtTTggTTtTT..", "..TTTTTTTTTTTT..", "..TTTTTTTTTTTT..", "................"],
  baixo: ["................", ".....HHHHHH.....", "....HHHHHHHH....", "....HssssssH....", "....skssssks....", "....ssssssss....", "....ssSSSSss....", ".....ssssss.....", "...TTTwwwwTTT...", "..TTTTTwwTTTTTs.", "..TTtTTTTTTtTTbb", "..TTtTTTTTTtTBbb", "..TTtTTggTTtTT..", "..TTTTTTTTTTTT..", "..TTTTTTTTTTTT..", "................"],
};

/* ---------- Itens de cada fase (desenhados dentro de uma casa de 8 px) ---------- */

export const ITENS = {
  moeda: (ctx, x, y) => {
    ctx.fillStyle = "#9a6d0f"; ctx.fillRect(x, y + 1, 2, 2);
    ctx.fillStyle = "#f2c14e"; ctx.fillRect(x, y, 2, 2);
  },
  bombom: (ctx, x, y) => {
    ctx.fillStyle = "#5b3216"; ctx.fillRect(x - 1, y, 3, 3);
    ctx.fillStyle = "#c98a4b"; ctx.fillRect(x - 1, y, 1, 1);
  },
  cedula: (ctx, x, y) => {
    ctx.fillStyle = "#2f7d4a"; ctx.fillRect(x - 1, y, 4, 2);
    ctx.fillStyle = "#9cc7a8"; ctx.fillRect(x, y, 2, 1);
  },
  caneta: (ctx, x, y) => {
    ctx.fillStyle = "#2f6ad6"; ctx.fillRect(x, y - 1, 1, 3);
    ctx.fillStyle = "#f2c14e"; ctx.fillRect(x, y - 1, 1, 1);
    ctx.fillStyle = "#14161d"; ctx.fillRect(x, y + 2, 1, 1);
  },
};

/* ---------- Bônus ---------- */

export const BONUS = {
  contracheque: {
    paleta: { w: "#fbf7ec", A: "#b9a983", G: "#2f7d4a" }, oy: 2,
    linhas: ["AwwwwwwwwwwA", "wAwwwwwwwwAw", "wwAwwwwwwAww", "wwwAwwwwAwww", "wwwwAwwAwwww", "wwwwwAAwwwww", "wwwwwwwwwwww", "wwGGGGGGwwww", "AAAAAAAAAAAA"],
  },
  mansao: {
    paleta: { R: "#a63a22", w: "#f4f1ea", b: "#41a7d1", d: "#7a4a22", G: "#3f8a3a" }, oy: 1,
    linhas: ["....RRRR....", "..RRRRRRRR..", "RRRRRRRRRRRR", ".wwwwwwwwww.", ".wbwwddwwbw.", ".wbwwddwwbw.", ".wwwwddwwww.", ".wwwwddwwww.", "GGGGGGGGGGGG"],
  },
  claquete: {
    paleta: { k: "#1a1a1f", w: "#f4f1ea" }, oy: 2,
    linhas: ["kwkwkwkwkwk.", ".kwkwkwkwkwk", "kkkkkkkkkkkk", "kwwwwwwwwwwk", "kwkkkwwkkkwk", "kwwwwwwwwwwk", "kwkkwwwwwwwk", "kkkkkkkkkkkk"],
  },
  decreto: {
    paleta: { w: "#fbf7ec", L: "#9b8b66", R: "#d23c28" }, ox: 1,
    linhas: ["wwwwwwwwww", "wLLLLLLLLw", "wwwwwwwwww", "wLLLLLLLww", "wwwwwwwwww", "wLLLLLwwww", "wwwwwwwRRw", "wwwwwwRRRR", "wwwwwwwRRw", "wwwwwwwwww"],
  },
};

export function spriteBonus(tipo) {
  const bonus = BONUS[tipo];
  return { imagem: sprite(`bonus-${tipo}`, bonus.linhas, bonus.paleta), dx: bonus.ox || 0, dy: bonus.oy || 0 };
}
