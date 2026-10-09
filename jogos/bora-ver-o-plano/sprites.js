/**
 * Pixel art do jogo, desenhada a partir de matrizes de caracteres.
 * Cada caractere corresponde a uma cor da paleta informada; "." é transparente.
 */

import { LARGURA_BLOCO, SOLIDOS, PORTAS, PLANTAS } from "./fases.js";

const PELE = { a: "#C68642", b: "#8D5524" };

const PERSONAGEM_CORPO = [
  "................",
  ".....hhhhhh.....",
  "....hhhhhhhh....",
  "....hssssssh....",
  "....sksssksh....",
  "....ssssssss....",
  ".....ssmmss.....",
  "......ssss......",
  "....rrrrrrrr....",
  "...srrrrrrrrs...",
  "...srrrrrrrrs...",
  "....rrrrrrrr....",
  "....cccccccc....",
];
const PERNAS_A = ["....cc....cc....", "....cc....cc....", "...ppp....ppp..."];
const PERNAS_B = [".....cc..cc.....", ".....cc..cc.....", "....ppp..ppp...."];

const CABELO_LONGO = [
  "................",
  ".....hhhhhh.....",
  "....hhhhhhhh....",
  "...hhssssssh....",
  "...hsksssksh....",
  "...hssssssss....",
  "...hhssmmss.....",
  "...hh.ssss......",
];

export const JOGADORAS = {
  cidada: {
    nome: "Cidadã",
    cabeloLongo: true,
    cores: { h: "#2B1B10", s: PELE.a, k: "#1A1A1A", m: "#B5523B", r: "#FFDF00", c: "#2E4A8B", p: "#3A2A1A" },
  },
  cidadao: {
    nome: "Cidadão",
    cabeloLongo: false,
    cores: { h: "#141414", s: PELE.b, k: "#0B0B0B", m: "#6E2E1F", r: "#009C3B", c: "#2E4A8B", p: "#3A2A1A" },
  },
};

const PALETAS_MORADORES = [
  { h: "#3B2416", s: "#E0AC69", r: "#FFFFFF", c: "#5B6C8F" },
  { h: "#1E1E1E", s: "#8D5524", r: "#E67E22", c: "#34495E" },
  { h: "#3B2A1A", s: "#F1C27D", r: "#8E44AD", c: "#2C3E50" },
  { h: "#5A3A1A", s: "#C68642", r: "#16A085", c: "#3D3D3D" },
  { h: "#111111", s: "#6B3E26", r: "#C0392B", c: "#2B4C7E" },
];

const ESTRELA = [
  "...yy...",
  "...yy...",
  "yyyyyyyy",
  ".yyyyyy.",
  "..yyyy..",
  ".yy..yy.",
  "yy....yy",
];

const BALAO = [
  ".wwwwww.",
  "wwkwkwkw",
  "wwwwwwww",
  ".wwwwww.",
  "..ww....",
  ".w......",
];

const MARCA_X = [
  "rr..........rr",
  "rrr........rrr",
  ".rrr......rrr.",
  "..rrr....rrr..",
  "...rrr..rrr...",
  "....rrrrrr....",
  ".....rrrr.....",
  ".....rrrr.....",
  "....rrrrrr....",
  "...rrr..rrr...",
  "..rrr....rrr..",
  ".rrr......rrr.",
  "rrr........rrr",
  "rr..........rr",
];

const BRILHO_A = ["...w....", "...w....", ".wwyww..", "...w....", "...w....", "........"];
const BRILHO_B = ["........", ".w...w..", "..wyw...", ".w...w..", "........", "........"];

export const OBJETOS = {
  praca: [
    "................",
    "................",
    "................",
    ".gggggggggggggg.",
    ".gyyyyyyyyyyyyg.",
    ".gyybbyyyyyyyyg.",
    ".gyybbyyyyyyyyg.",
    ".gggggggggggggg.",
    ".gwwwwwwwwwwwwg.",
    ".gwkkkkkwwkkkwg.",
    ".gwwwwwwwwwwwwg.",
    ".gggggggggggggg.",
  ],
  centro: [
    "................",
    "...bbbbbbbbbb...",
    "...bwwwwwwwwb...",
    "...bbbbbbbbbb...",
    "...bbbbbbbbbb...",
    "...bbyyyyyybb...",
    "...bbyybbyybb...",
    "...bbyyyyyybb...",
    "...bbbbbbbbbb...",
    "...bbwwwwwwbb...",
    "...bbbbbbbbbb...",
    "...bbbbbbbbbb...",
    "...bbbbbbbbbb...",
  ],
  saude: [
    "................",
    "......kkkk......",
    ".....kwwwwk.....",
    "....kwwwwwwk....",
    "....kwwrrwwk....",
    "....kwrrrrwk....",
    "....kwwrrwwk....",
    "....kwwwwwwk....",
    "....kggggggk....",
    "....kggggggk....",
    "....kggggggk....",
    "....kwwwwwwk....",
    ".....kkkkkk.....",
  ],
  seguranca: [
    "................",
    "...ppppppppppw..",
    "..pPPPPPPPPPpw..",
    "..pPwwwwwwwPpw..",
    "..pPPPPPPPPPpw..",
    "..pPwwwwwPPPpw..",
    "..pPPPPPPPPPpw..",
    "..pPPPPPPPPPpw..",
    "..pPPPPPPPPPpw..",
    "..pPPPPPPPPPpw..",
    "..pPPPPPPPPPpw..",
    "..ppppppppppww..",
  ],
  saber: [
    "......rr........",
    ".....r..r.......",
    "....r....r......",
    "...r......r.....",
    "..wwwwwwwwwwww..",
    "..wggggggggggw..",
    "..wgkkgwwwwwgw..",
    "..wgkkgwkkkwgw..",
    "..wggggwwwwwgw..",
    "..wgwkkkkkkwgw..",
    "..wggggggggggw..",
    "..wwwwwwwwwwww..",
  ],
  "vila-conquista": [
    "................",
    "...yyyy.........",
    "..yyyyyy........",
    "..yy..yy........",
    "..yy..yy........",
    "..yyyyyy........",
    "...yyyyyyyyyyyy.",
    "...yyyy.....y.y.",
    "............y.y.",
  ],
  campo: [
    "................",
    "................",
    "....oooooooo....",
    "...ollllllllo...",
    "..olgggrrrrllo..",
    "..olgggrrryllo..",
    "..olllyyyyyllo..",
    "...ollllllllo...",
    "....oooooooo....",
  ],
};

const CORES_OBJETOS = {
  g: "#009C3B", y: "#FFDF00", b: "#2E4A8B", w: "#FFFFFF", k: "#1A1A1A", r: "#E10600",
  p: "#5B2C83", P: "#8E44AD", o: "#D9D9D9", l: "#F4F4F4",
};

function pintar(contexto, matriz, cores, deslocX = 0, deslocY = 0, escala = 1) {
  matriz.forEach((linha, y) => {
    [...linha].forEach((caractere, x) => {
      const cor = cores[caractere];
      if (!cor) return;
      contexto.fillStyle = cor;
      contexto.fillRect((deslocX + x) * escala, (deslocY + y) * escala, escala, escala);
    });
  });
}

function criarTela(largura, altura) {
  const tela = document.createElement("canvas");
  tela.width = largura;
  tela.height = altura;
  return tela;
}

/** Converte uma ou mais matrizes (quadros lado a lado) em imagem PNG. */
export function imagemDeMatrizes(quadros, cores, largura = 16, altura = 16, escala = 1) {
  const tela = criarTela(largura * quadros.length * escala, altura * escala);
  const contexto = tela.getContext("2d");
  quadros.forEach((matriz, indice) => pintar(contexto, matriz, cores, indice * largura, 0, escala));
  return tela.toDataURL();
}

function quadrosPersonagem(cores, cabeloLongo) {
  const topo = cabeloLongo ? [...CABELO_LONGO, ...PERSONAGEM_CORPO.slice(CABELO_LONGO.length)] : PERSONAGEM_CORPO;
  return [[...topo, ...PERNAS_A], [...topo, ...PERNAS_B]];
}

export function imagemJogadora(id, escala = 1) {
  const { cores, cabeloLongo } = JOGADORAS[id];
  return imagemDeMatrizes(quadrosPersonagem(cores, cabeloLongo), cores, 16, 16, escala);
}

export function imagemJogadoraParada(id, escala = 4) {
  const { cores, cabeloLongo } = JOGADORAS[id];
  return imagemDeMatrizes([quadrosPersonagem(cores, cabeloLongo)[0]], cores, 16, 16, escala);
}

/*
 * Trajes por profissão. Cada traje pode trocar a cabeça (linhas 0–2, para boné, chapéu ou coque),
 * pôr óculos, trocar o tronco (linhas 8–11), a cintura (linha 12) e o alto das pernas.
 */
export const TRAJES = {
  morador: {},
  guia: {
    tronco: ["....rvvvvvvr....", "...svvyvvyvvs...", "...svvvvvvvvs...", "....rrrrrrrr...."],
    cores: { r: "#FFFFFF", v: "#F39C12", y: "#FFF3B0" },
  },
  lider: {
    longo: true,
    tronco: ["....rrryyrrr....", "...srrrrrrqqs...", "...srrrrrrqqs...", "....rrrrrrrr...."],
    cores: { r: "#2E86AB", y: "#FFDF00", q: "#F5E6C8" },
  },
  vigia: {
    longo: false,
    cabeca: ["................", "....bbbbbbbb....", "...bbbbybbbbbb.."],
    tronco: ["....rrrrrrrr....", "...srrwrrrrrs...", "...srrrrrrrrs...", "....rrrrrrrr...."],
    cintura: "....kkkkkkkk....",
    cores: { b: "#1F2E4D", y: "#FFDF00", r: "#2C3E66", w: "#C9D3E6", c: "#1F2E4D", k: "#111111" },
  },
  farmaceutico: {
    longo: false,
    tronco: ["....wwwwwwww....", "...swwgwwwwws...", "...swgggwwwws...", "....wwgwwwww...."],
    cintura: "....wwwwwwww....",
    pernas: "....ww....ww....",
    cores: { w: "#F4F4F4", g: "#1E9E4A", c: "#4A4A4A" },
  },
  professora: {
    longo: false,
    cabeloFixo: true,
    oculos: true,
    cabeca: ["......hhh.......", ".....hhhhhh.....", "....hhhhhhhh...."],
    tronco: ["....rrrrrrrr....", "...srrrrrrrrll..", "...srrrrrrrrll..", "....rrrrrrrr...."],
    cores: { r: "#8E44AD", l: "#C0392B", c: "#2C3E50" },
  },
  agricultora: {
    longo: true,
    cabeca: ["................", "....aaaaaaaa....", "..aaaaaaaaaaaa.."],
    cores: { a: "#E8C46A", r: "#C0392B", c: "#5B4636" },
  },
  agricultor: {
    longo: false,
    cabeca: ["................", "....aaaaaaaa....", "..aaaaaaaaaaaa.."],
    cores: { a: "#E8C46A", r: "#27AE60", c: "#5B4636" },
  },
  feirante: {
    longo: true,
    tronco: ["....rrrrrrrr....", "...sffffffffs...", "...sffffffffs...", "....ffffffff...."],
    cintura: "....ffffffff....",
    pernas: "....ff....ff....",
    cores: { r: "#16A085", f: "#E67E22", c: "#34495E" },
  },
  sindicalista: {
    longo: false,
    cabeca: ["................", "....bbbbbbbb....", "...bbbbbbbbbbb.."],
    cores: { b: "#27AE60", r: "#F5F5F5", c: "#34495E" },
  },
};

/* Cabelo comprido dos dois lados do rosto, até os ombros. */
function comCabeloComprido(corpo) {
  return corpo.map((linha, y) => (y < 3 || y > 8 ? linha : `${linha.slice(0, 3)}h${linha.slice(4, 12)}h${linha.slice(13)}`));
}

function quadroPessoa(traje, longo) {
  const corpo = longo ? comCabeloComprido(PERSONAGEM_CORPO) : [...PERSONAGEM_CORPO];
  if (traje.cabeca) traje.cabeca.forEach((linha, i) => { corpo[i] = linha; });
  if (traje.oculos) corpo[4] = corpo[4].slice(0, 4) + "kkkskkk" + corpo[4].slice(11);
  if (traje.tronco) traje.tronco.forEach((linha, i) => { corpo[8 + i] = linha; });
  if (traje.cintura) corpo[12] = traje.cintura;
  return [...corpo, traje.pernas ?? PERNAS_A[0], ...PERNAS_A.slice(1)];
}

const CABELO_GRISALHO = "#CFCFCF";

/**
 * Pessoa da cidade com a roupa da profissão.
 * @param {string} nomeTraje chave de TRAJES
 * @param {number} indice escolhe a paleta de pele e roupa
 * @param {{genero?: "f"|"m", idade?: "jovem"|"adulta"|"idosa"}} [aparencia] mulheres têm cabelo comprido e pessoas idosas, grisalho
 */
export function imagemPessoa(nomeTraje, indice, escala = 1, aparencia = {}) {
  const traje = TRAJES[nomeTraje] ?? TRAJES.morador;
  const paleta = PALETAS_MORADORES[indice % PALETAS_MORADORES.length];
  const grisalho = aparencia.idade === "idosa" ? { h: CABELO_GRISALHO } : {};
  const cores = { k: "#1A1A1A", m: "#7A3B2E", p: "#2A2A2A", ...paleta, ...grisalho, ...traje.cores };
  const longo = aparencia.genero && !traje.cabeloFixo ? aparencia.genero === "f" : traje.longo ?? indice % 2 === 1;
  return imagemDeMatrizes([quadroPessoa(traje, longo)], cores, 16, 16, escala);
}

/** X vermelho pintado no chão, onde o mapa rasgado aponta. */
export const imagemMarcaX = () => imagemDeMatrizes([MARCA_X], { r: "#E10600" }, 14, 14);
export const imagemEstrela = () => imagemDeMatrizes([ESTRELA], { y: "#FFDF00" }, 8, 8);
export const imagemBalao = () => imagemDeMatrizes([BALAO], { w: "#FFFFFF", k: "#1A1A1A" }, 8, 8);
export const imagemBrilho = () => imagemDeMatrizes([BRILHO_A, BRILHO_B], { w: "#FFFFFF", y: "#FFDF00" }, 8, 8);

const PORTAO_FECHADO = [
  "................",
  ".mm..........mm.",
  ".mmmmmmmmmmmmmm.",
  ".mm.m.m..m.m.mm.",
  ".mm.m.m..m.m.mm.",
  ".mmmmmmyymmmmmm.",
  ".mm.m.yKKy.m.mm.",
  ".mm.m.yyyy.m.mm.",
  ".mm.m.yyyy.m.mm.",
  ".mmmmmmmmmmmmmm.",
  ".mm.m.m..m.m.mm.",
  ".mm.m.m..m.m.mm.",
  ".mm.m.m..m.m.mm.",
  ".mmmmmmmmmmmmmm.",
  ".mm..........mm.",
  "................",
];
const PORTAO_ABERTO = [
  "................",
  ".mm..........mm.",
  ".mmm........mmm.",
  ".mm.m......m.mm.",
  ".mm.m......m.mm.",
  ".mmm........mmm.",
  ".mm.m......m.mm.",
  ".mm.m......m.mm.",
  ".mm.m......m.mm.",
  ".mmm........mmm.",
  ".mm.m......m.mm.",
  ".mm.m......m.mm.",
  ".mm.m......m.mm.",
  ".mmm........mmm.",
  ".mm..........mm.",
  "................",
];
const CORES_PORTAO = { m: "#5D4037", y: "#FFDF00", K: "#1A1A1A" };
export const imagemPortao = () => imagemDeMatrizes([PORTAO_FECHADO, PORTAO_ABERTO], CORES_PORTAO);

/**
 * Mapa da cidade com os bairros ligados por ruas, na ordem das fases.
 * @param {{x: number, y: number, cor: string}[]} pontos posições em fração (0–1)
 */
export function imagemCidade(pontos, largura = 320, altura = 240) {
  const tela = criarTela(largura, altura);
  const c = tela.getContext("2d");
  c.fillStyle = "#3E8E41";
  c.fillRect(0, 0, largura, altura);
  for (let i = 0; i < 140; i++) {
    const x = (i * 97) % largura;
    const y = (i * 61 + (i % 7) * 13) % altura;
    c.fillStyle = i % 3 ? "#4FA552" : "#2E6B30";
    c.fillRect(x, y, i % 3 ? 2 : 6, i % 3 ? 3 : 6);
  }
  c.fillStyle = "#2874A6";
  for (let x = 0; x < largura; x += 4) {
    const y = altura * 0.58 + Math.sin(x / 26) * 10;
    c.fillRect(x, y, 4, 10);
  }
  const emPx = (ponto) => [Math.round(ponto.x * largura), Math.round(ponto.y * altura)];
  c.lineCap = "square";
  for (let i = 0; i < pontos.length - 1; i++) {
    const [x1, y1] = emPx(pontos[i]);
    const [x2, y2] = emPx(pontos[i + 1]);
    c.strokeStyle = "#3B3B44"; c.lineWidth = 10;
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1, y2); c.lineTo(x2, y2); c.stroke();
    c.strokeStyle = "#FFDF00"; c.lineWidth = 1; c.setLineDash([4, 4]);
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1, y2); c.lineTo(x2, y2); c.stroke();
    c.setLineDash([]);
  }
  pontos.forEach((ponto) => {
    const [x, y] = emPx(ponto);
    c.fillStyle = "#C9C2B5"; c.fillRect(x - 16, y - 12, 32, 24);
    c.fillStyle = ponto.cor; c.fillRect(x - 14, y - 10, 12, 8); c.fillRect(x + 2, y - 10, 12, 8);
    c.fillStyle = "#E8E1D3"; c.fillRect(x - 14, y - 2, 12, 10); c.fillRect(x + 2, y - 2, 12, 10);
  });
  return tela.toDataURL();
}

export function imagemObjeto(fase, escala = 1) {
  return imagemDeMatrizes([OBJETOS[fase]], CORES_OBJETOS, 16, 16, escala);
}

function desenharBloco(contexto, caractere, x, y, mapa, destaque, casas) {
  const px = x * LARGURA_BLOCO;
  const py = y * LARGURA_BLOCO;
  const ret = (cor, dx, dy, l, a) => { contexto.fillStyle = cor; contexto.fillRect(px + dx, py + dy, l, a); };

  const naCalcada = mapa[y]?.[x - 1] === "," || mapa[y]?.[x + 1] === ",";
  const base = "GRQLK".includes(caractere) ? (naCalcada ? "," : ".") : PLANTAS.includes(caractere) ? "h" : caractere;
  const chao = { ",": "#C9C2B5", "=": "#3B3B44", h: "#6B4423" }[base] ?? "#3E8E41";
  ret(chao, 0, 0, 16, 16);

  switch (caractere) {
    case ".":
    case "1": case "2": case "3": case "4": case "H": case "O": case "P": case "R":
      if (base === ",") break;
      if ((x * 7 + y * 3) % 5 === 0) { ret("#4FA552", 3, 5, 1, 2); ret("#4FA552", 5, 4, 1, 3); }
      if ((x * 3 + y * 5) % 7 === 0) { ret("#4FA552", 11, 10, 1, 2); ret("#4FA552", 13, 11, 1, 2); }
      break;
    case ",":
      ret("#1A1A1A", 0, 7, 4, 2); ret("#1A1A1A", 4, 5, 4, 2); ret("#1A1A1A", 8, 7, 4, 2); ret("#1A1A1A", 12, 9, 4, 2);
      break;
    case "=":
      if (x % 2 === 0) ret("#FFDF00", 2, 7, 10, 2);
      break;
    case "#": {
      const topo = mapa[y - 1]?.[x] !== "#";
      ret("#E8E1D3", 0, 0, 16, 16);
      if (topo) { ret(destaque, 0, 0, 16, 5); ret("#00000040", 0, 5, 16, 1); }
      ret("#5DADE2", 3, topo ? 8 : 4, 4, 4); ret("#5DADE2", 9, topo ? 8 : 4, 4, 4);
      ret("#1A1A1A20", 15, 0, 1, 16);
      break;
    }
    case "u": case "v": case "w": case "x": case "y": case "z": {
      const casa = casas?.[caractere] ?? { numero: PORTAS.indexOf(caractere) + 1, cor: PORTAS.indexOf(caractere) % CORES_PORTAS.length };
      ret("#E8E1D3", 0, 0, 16, 16);
      ret(CORES_PORTAS[casa.cor], 4, 4, 8, 12);
      ret("#1A1A1A", 10, 10, 1, 1);
      ret("#FFFFFF", 5, 0, 6, 4);
      pintar(contexto, DIGITOS[casa.numero - 1], { k: "#1A1A1A" }, x * LARGURA_BLOCO + 7, y * LARGURA_BLOCO - 1);
      break;
    }
    case "T":
      ret("#2E6B30", 0, 0, 16, 16);
      ret("#1F4D21", 2, 2, 12, 10); ret("#3E8E41", 4, 3, 5, 4); ret("#6B4423", 7, 12, 2, 4);
      break;
    case "b":
      ret("#2E7D32", 1, 4, 14, 11); ret("#43A047", 3, 5, 5, 4); ret("#1B5E20", 9, 9, 5, 5);
      break;
    case "~":
      ret("#2874A6", 0, 0, 16, 16); ret("#5DADE2", 2, 4, 5, 1); ret("#5DADE2", 9, 10, 5, 1);
      break;
    case "f":
      ret("#E10600", 3, 4, 2, 2); ret("#FFDF00", 10, 3, 2, 2); ret("#FFFFFF", 6, 10, 2, 2); ret("#F2B705", 12, 11, 2, 2);
      break;
    case "c":
      ret("#8B5A2B", 0, 6, 16, 2); ret("#8B5A2B", 0, 11, 16, 2); ret("#A0522D", 2, 3, 2, 12); ret("#A0522D", 12, 3, 2, 12);
      break;
    case "E": {
      const meio = mapa[y][x - 1] === "E" && mapa[y][x + 1] === "E" && (mapa[y][x - 2] !== "E" || mapa[y][x + 2] !== "E");
      ret("#F3E3B5", 0, 2, 16, 14); ret("#C0392B", 0, 0, 16, 4); ret("#00000030", 0, 4, 16, 1);
      if (meio && mapa[y][x - 2] !== "E") { ret("#8B5A2B", 9, 8, 7, 8); ret("#1A1A1A", 14, 12, 1, 1); }
      else if (meio) { ret("#8B5A2B", 0, 8, 7, 8); ret("#1A1A1A", 1, 12, 1, 1); }
      else { ret("#5DADE2", 4, 7, 8, 5); ret("#FFFFFF", 7, 7, 1, 5); }
      break;
    }
    case "Q":
      ret("#1F2E4D", 1, 0, 14, 3); ret("#5A6B8C", 2, 3, 12, 12); ret("#5DADE2", 4, 5, 8, 5); ret("#C9D3E6", 4, 11, 8, 1);
      break;
    case "L":
      ret("#DCEFE2", 0, 3, 16, 3); ret("#1E9E4A", 0, 6, 16, 9); ret("#FFFFFF", 7, 7, 2, 7); ret("#FFFFFF", 5, 9, 6, 2);
      break;
    case "K":
      ret("#8B5A2B", 1, 1, 14, 10); ret("#1F4D2E", 2, 2, 12, 8); ret("#FFFFFF", 4, 4, 5, 1); ret("#FFFFFF", 4, 7, 7, 1);
      ret("#8B5A2B", 3, 11, 2, 5); ret("#8B5A2B", 11, 11, 2, 5);
      break;
    case "h":
      ret("#4E342E", 0, 0, 16, 16); ret("#66BB6A", 2, 3, 3, 3); ret("#66BB6A", 10, 3, 3, 3); ret("#66BB6A", 6, 10, 3, 3);
      break;
    default:
      break;
  }
  if (SOLIDOS.has(caractere) && caractere !== "#") ret("#00000018", 0, 15, 16, 1);
}

export const CORES_PORTAS = ["#C0392B", "#2E86DE", "#27AE60", "#F1C40F"];

/** Varal, vaso na janela e cachorro, desenhados ao lado da porta de cada casa. */
function desenharDetalhesDasCasas(contexto, mapa, casas) {
  if (!casas) return;
  const ret = (cor, x, y, l, a) => { contexto.fillStyle = cor; contexto.fillRect(x, y, l, a); };
  mapa.forEach((linha, y) => [...linha].forEach((caractere, x) => {
    const casa = casas[caractere];
    if (!casa) return;
    const px = (x - 1) * LARGURA_BLOCO;
    const py = y * LARGURA_BLOCO;
    if (casa.vaso) {
      ret("#A0522D", px + 3, py + 8, 6, 3);
      ret("#E10600", px + 3, py + 6, 2, 2); ret("#FFDF00", px + 5, py + 5, 2, 2); ret("#E10600", px + 7, py + 6, 2, 2);
    }
    if (casa.varal) {
      const vy = py - LARGURA_BLOCO + 6;
      ret("#5D4037", px + 1, vy, 1, 8); ret("#5D4037", px + 14, vy, 1, 8); ret("#3A3A3A", px + 1, vy, 14, 1);
      ret("#E10600", px + 3, vy + 1, 3, 4); ret("#2E86DE", px + 7, vy + 1, 3, 5); ret("#FFDF00", px + 11, vy + 1, 2, 3);
    }
    if (casa.cachorro) {
      const cx = px + 2;
      const cy = py + LARGURA_BLOCO + 6;
      ret("#8D6E63", cx + 2, cy + 2, 8, 4); ret("#8D6E63", cx + 8, cy, 4, 4); ret("#5D4037", cx + 11, cy - 1, 2, 2);
      ret("#1A1A1A", cx + 10, cy + 1, 1, 1); ret("#8D6E63", cx + 2, cy + 6, 2, 2); ret("#8D6E63", cx + 8, cy + 6, 2, 2);
      ret("#8D6E63", cx, cy + 1, 2, 2);
    }
  }));
}
export const NOMES_CORES_PORTAS = ["vermelha", "azul", "verde", "amarela"];
const DIGITOS = [
  [".k.", "kk.", ".k.", ".k.", "kkk"],
  ["kk.", "..k", ".k.", "k..", "kkk"],
  ["kk.", "..k", ".k.", "..k", "kk."],
  ["k.k", "k.k", "kkk", "..k", "..k"],
  ["kkk", "k..", "kk.", "..k", "kk."],
  [".kk", "k..", "kk.", "k.k", ".k."],
].map((linhas) => ["...", ...linhas]);

const PLANTACOES = {
  m: { nome: "milho", cores: { v: "#2E7D32", y: "#F4D03F", o: "#B7950B" }, quadros: [
    ["......vv........", ".....vyyv.......", "....vyyyyv......", "....vyoyyv......", "....vyyyyv......", "....vyyoyv....v.", ".....vyyv....vv.", "..v...vv....vv..", "...vv.vv..vv....", ".....vvvvvv.....", "......vvvv......", "......vvvv......", "......vvvv......", ".....vvvvvv.....", "................", "................"],
    ["................", "................", "................", "................", "................", "................", "................", "................", "...vv......vv...", ".....vv..vv.....", "......vvvv......", "......vvvv......", "......vvvv......", ".....vvvvvv.....", "................", "................"]] },
  j: { nome: "feijão", cores: { v: "#388E3C", m: "#6D4C41", d: "#3E2723" }, quadros: [
    ["................", "...vv......vv...", "..vvvv....vvvv..", "...vvmm..mmvv...", "....mddm.mddm...", "....mddm.mddm...", ".....mm...mm....", "...vv..vv..vv...", "..vvvv.vv.vvvv..", "...vv..vv..vv...", ".......vv.......", "......vvvv......", ".....vvvvvv.....", "................", "................", "................"],
    ["................", "................", "................", "................", "................", "................", "................", "...vv..vv..vv...", "..vvvv.vv.vvvv..", "...vv..vv..vv...", ".......vv.......", "......vvvv......", ".....vvvvvv.....", "................", "................", "................"]] },
  r: { nome: "arroz", cores: { v: "#7CB342", a: "#F5E6A8", o: "#D4AC0D" }, quadros: [
    ["..a....a....a...", ".aoa..aoa..aoa..", "..a....a....a...", ".aoa..aoa..aoa..", "..v....v....v...", "..v...vv....v...", "...v..v....v....", "...v..v...v.....", "....v.v..v......", ".....vvvv.......", ".....vvvv.......", "....vvvvvv......", "................", "................", "................", "................"],
    ["................", "................", "................", "................", "..v....v....v...", "..v...vv....v...", "...v..v....v....", "...v..v...v.....", "....v.v..v......", ".....vvvv.......", ".....vvvv.......", "....vvvvvv......", "................", "................", "................", "................"]] },
  n: { nome: "mandioca", cores: { v: "#43A047", m: "#8D6E63", b: "#EFEBE9" }, quadros: [
    ["...v...v...v....", "..vvv.vvv.vvv...", "...v...v...v....", "....v..v..v.....", ".....v.v.v......", "......vvv.......", ".......v........", "......mmm.......", ".....mbbbm......", "....mbbbbbm.....", "...mbbm.mbbm....", "...mbm...mbm....", "....m.....m.....", "................", "................", "................"],
    ["................", "................", "................", "................", "................", "................", ".......v........", "......mmm.......", "......mmm.......", "................", "................", "................", "................", "................", "................", "................"]] },
};
export const NOMES_PLANTAS = Object.fromEntries(Object.entries(PLANTACOES).map(([letra, planta]) => [letra, planta.nome]));
export function imagemPlanta(letra) {
  const { cores, quadros } = PLANTACOES[letra];
  return imagemDeMatrizes(quadros, cores);
}

function telaDoMapa(mapa, destaque, casas) {
  const tela = criarTela(mapa[0].length * LARGURA_BLOCO, mapa.length * LARGURA_BLOCO);
  const contexto = tela.getContext("2d");
  mapa.forEach((linha, y) => [...linha].forEach((caractere, x) => desenharBloco(contexto, caractere, x, y, mapa, destaque, casas)));
  desenharDetalhesDasCasas(contexto, mapa, casas);
  return tela;
}

/** Desenha o mapa inteiro em uma única imagem de fundo. */
export function imagemMapa(mapa, destaque, casas) {
  return telaDoMapa(mapa, destaque, casas).toDataURL();
}

/**
 * Mapa do tesouro rasgado em quatro pedaços (superior esquerdo, superior direito,
 * inferior esquerdo, inferior direito). O X só aparece com os quatro pedaços.
 * @param {boolean[]} pedacos quais pedaços já foram encontrados
 * @param {{x: number, y: number}} alvo bloco do tesouro
 */
export function imagemTesouro(mapa, destaque, pedacos, alvo) {
  const original = telaDoMapa(mapa, destaque);
  const tela = criarTela(original.width, original.height);
  const c = tela.getContext("2d");
  const metadeL = original.width / 2;
  const metadeA = original.height / 2;
  c.fillStyle = "#2B1B10";
  c.fillRect(0, 0, tela.width, tela.height);
  pedacos.forEach((tem, indice) => {
    const x = (indice % 2) * metadeL;
    const y = Math.floor(indice / 2) * metadeA;
    if (!tem) {
      c.fillStyle = "#3A2A1A";
      c.fillRect(x + 4, y + 4, metadeL - 8, metadeA - 8);
      c.fillStyle = "#6B4C2A";
      c.font = "bold 48px monospace";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("?", x + metadeL / 2, y + metadeA / 2);
      return;
    }
    c.drawImage(original, x, y, metadeL, metadeA, x, y, metadeL, metadeA);
    c.fillStyle = "rgba(222, 184, 135, 0.45)";
    c.fillRect(x, y, metadeL, metadeA);
    c.fillStyle = "#2B1B10";
    for (let i = 0; i < metadeL; i += 8) {
      c.fillRect(x + i, y + (indice < 2 ? metadeA - 3 : 0), 4, 3);
      c.fillRect(x + (indice % 2 ? 0 : metadeL - 3), y + i * (metadeA / metadeL), 3, 4);
    }
  });
  if (pedacos.every(Boolean)) {
    const cx = alvo.x * LARGURA_BLOCO + LARGURA_BLOCO / 2;
    const cy = alvo.y * LARGURA_BLOCO + LARGURA_BLOCO / 2;
    c.strokeStyle = "#E10600";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(cx - 10, cy - 10); c.lineTo(cx + 10, cy + 10);
    c.moveTo(cx + 10, cy - 10); c.lineTo(cx - 10, cy + 10);
    c.stroke();
  }
  return tela.toDataURL();
}
