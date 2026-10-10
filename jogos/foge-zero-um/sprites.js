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
  h: "#b08850", s: "#e6b48e", S: "#c08a62", k: "#1a1410", n: "#5b8ee6", N: "#3f6fc4",
  w: "#f4f1ea", r: "#d23c28", g: "#f2c14e", b: "#7a4a22", l: "#14161d", o: "#1a1410",
};

const HERDEIRO = {
  baixo: ["...oooooo...", "..ohhhhhho..", "..ohsssss...", "...skssks...", "...ssSSss...", "..nnwrrwnn..", "..ngnrrnnn..", "..nnnrrnnnk.", "..nnnnnnnbbb", "..NNNNNNNbgb"],
  lado: ["...oooooo...", "..ohhhhhho..", "..ohhsssss..", "...hssksk...", "...ssssSs...", "..nnnwrnnn..", "..ngnnrnnn..", "..nnnnrnnnk.", "..nnnnnnnbbb", "..NNNNNNNbgb"],
  cima: ["...oooooo...", "..ohhhhhho..", "..ohhhhhho..", "...hhhhhh...", "...shhhhs...", "..nnnnnnnn..", "..nnnnnnnn..", "..nnnnnnnnk.", "..nnnnnnnbbb", "..NNNNNNNbgb"],
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

/* Cada órgão tem um boneco próprio; a última linha (pernas) alterna para dar o passo. */
const FISCAIS_DESENHO = {
  PF: {
    paleta: { b: "#3a8bff", k: "#1d2027", K: "#2e333d", s: "#d9a07a", o: "#14161d", y: "#f2c14e", l: "#14161d" },
    linhas: ["....bbbb....", "...kkkkkk...", "..kkkkkkkkk.", "...ssssss...", "...soosso...", "...ssssss...", ".kyyykyyykk.", ".kykykykkkk.", ".kyyykyykkk.", ".kykkkykkkk.", "..KKKKKKKK.."],
  },
  MP: {
    paleta: { h: "#3a2a1e", s: "#c98a62", o: "#14161d", v: "#8a1f2b", w: "#f4f1ea", r: "#d23c28", g: "#f2c14e", l: "#14161d" },
    linhas: ["............", "...hhhhhh...", "..hhhhhhhh..", "..hssssssh..", "...soosso...", "...ssssss...", "..vvvwwvvv..", ".vvvvwwvvrrr", ".vvvvvvvvrgr", ".vvvvvvvvrrr", "..vvvvvvvv.."],
  },
  TV: {
    paleta: { h: "#1a1410", s: "#e6b48e", o: "#14161d", c: "#8a8a92", m: "#22222a", r: "#ff3b30", p: "#7442b3", i: "#c9c9d1", k: "#3a3a46", w: "#f4f1ea", l: "#14161d" },
    linhas: ["............", "....hhhhhh..", "cccchhhhhhh.", "cmmcssssss..", "cmmcsossos.i", "crccssssss.i", "..pppppppp.k", ".ppppppppppk", ".pppwppppp..", ".pppppppppp.", "..pppppppp.."],
  },
  COAF: {
    paleta: { g: "#c9c9d1", G: "#8a8a92", a: "#a8dcf0", v: "#2e9e4f", h: "#7a4a22", l: "#14161d" },
    linhas: ["...gggggg...", "..gaaaaaag..", ".gaaavvaaag.", ".gaavvaaaag.", ".gaaavvaaag.", ".gaaaavvaag.", ".gaaavvaaag.", "..gaaaaaag..", "...GGGGGGh..", ".........hh.", "............"],
  },
};

const PERNAS = { PF: ["..ll....ll..", "...ll..ll..."], COAF: ["...ll..ll...", "....l..l...."] };

function emCinza(cor, piscando) {
  if (piscando) return "#f4f1ea";
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(cor.slice(i, i + 2), 16));
  const tom = Math.round(((r + g + b) / 3) * 0.6 + 70);
  return `rgb(${tom}, ${tom}, ${tom + 10})`;
}

/** Fiscal parado ou andando; com a liminar ativa, fica cinza (e pisca quando ela está acabando). */
export function spriteFiscal(fiscal, direcao, passo, sirene, suspenso, piscando) {
  const chave = ["fiscal", fiscal.id, passo, sirene, suspenso, piscando].join("-");
  if (cache.has(chave)) return cache.get(chave);
  const desenho = FISCAIS_DESENHO[fiscal.id];
  const pernas = PERNAS[fiscal.id] ?? PERNAS.PF;
  const linhas = [...desenho.linhas, pernas[passo ? 1 : 0]];
  let paleta = { ...desenho.paleta };
  if (fiscal.id === "PF") paleta.b = sirene ? "#ff4b3a" : "#3a8bff";
  if (suspenso) paleta = Object.fromEntries(Object.entries(paleta).map(([letra, cor]) => [letra, emCinza(cor, piscando)]));
  return sprite(chave, linhas, paleta);
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

/* Itens de 4x4 px com contorno escuro, para se destacarem do piso. (x, y) é o canto da casa. */
const DESENHO_ITENS = {
  moeda: { paleta: { o: "#3a2a05", a: "#f2c14e", l: "#fff1a8" }, linhas: [".oo.", "oalo", "oaao", ".oo."] },
  bombom: { paleta: { o: "#2a0f18", p: "#ff6fae", c: "#5b3216", w: "#ffffff" }, linhas: ["p..p", "ocwo", "occo", "p..p"] },
  cedula: { paleta: { o: "#0c2a14", v: "#5fd07a", l: "#c9f5d3" }, linhas: ["oooo", "vlvv", "vvlv", "oooo"] },
  caneta: { paleta: { o: "#14161d", w: "#ffffff", r: "#ff4b3a" }, linhas: ["..rr", ".wwr", "oww.", "oo.."] },
};

export function desenharItem(ctx, tipo, x, y) {
  const item = DESENHO_ITENS[tipo];
  ctx.drawImage(sprite(`item-${tipo}`, item.linhas, item.paleta), x + 2, y + 2);
}

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
