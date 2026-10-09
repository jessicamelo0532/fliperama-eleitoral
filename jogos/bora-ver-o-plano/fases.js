/**
 * Bairros do jogo, na ordem de desbloqueio.
 *
 * Legenda dos mapas (20 × 15 blocos de 16 px):
 *   .  grama          ,  calçada          =  rua
 *   #  prédio         T  árvore           b  arbusto
 *   ~  água           f  flores           c  cerca
 *   h  horta          P  início da personagem
 *   1–4  personagens com propostas        H  personagem da pista
 *   O  objeto perdido        G  portão com senha        R  responsável pelo desafio
 *   Q  guarita               L  balcão da farmácia      K  quadro-negro
 *   u v w x y z  portas das casas (Vila Conquista); detalhes de cada casa em `casas`
 *   m j r n  plantações: milho, feijão, arroz e mandioca (Campo Verde)
 */

export const FASES = [
  {
    id: "praca",
    naCidade: { x: 0.18, y: 0.18 },
    nome: "Praça Central",
    topicos: [1, 2],
    area: "Democracia e combate às desigualdades",
    destaque: "#E10600",
    mapa: [
      "TTTTTTTTTTTTTTTTTTTT",
      "T##..###....###..##T",
      "T##..###....###..##T",
      "T...,,,,,,,,,,,,...T",
      "T.1.,ffff,,,,fff,..T",
      "T...,f,,,,,,,,,f,..T",
      "T==================T",
      "T...,f,,,,,,,,,f,..T",
      "T.2.,ffff,~~,fff,..T",
      "T...,,,,,,~~,,,,,R.T",
      "T##.........4..cGc.T",
      "T##..TT........cOc.T",
      "T.3..TT....PH..ccc.T",
      "T..................T",
      "TTTTTTTTTTTTTTTTTTTT",
    ],
  },
  {
    id: "saber",
    naCidade: { x: 0.5, y: 0.12 },
    nome: "Vale do Saber",
    topicos: [4, 6],
    area: "Educação, cultura e esporte",
    destaque: "#9B59B6",
    mapa: [
      "TTTTTTTTTTTTTTTTTTTT",
      "T#######....######.T",
      "T#######....######.T",
      "T,,,,,,,,,,,,,,,,,.T",
      "T.1..,........,.2..T",
      "T....,........,....T",
      "T====,========,====T",
      "T....,........,.RK.T",
      "T.cccccccc....cGc..T",
      "T.c......c....cOc..T",
      "T.c..3...c....ccc..T",
      "T.cccc.ccc.........T",
      "T..........PH...4..T",
      "T..T...T.......T...T",
      "TTTTTTTTTTTTTTTTTTTT",
    ],
  },
  {
    id: "saude",
    naCidade: { x: 0.82, y: 0.2 },
    nome: "Vila Saúde",
    topicos: [5],
    area: "Saúde",
    destaque: "#2ECC71",
    mapa: [
      "TTTTTTTTTTTTTTTTTTTT",
      "T.#####....#####..cT",
      "T.#####....#####.cOT",
      "T.,,,,,,,,,,,,,,,.GT",
      "T.,..1..,,,..2..LR.T",
      "T.,,,,,,,,,,,,,,,..T",
      "T.......ffff.......T",
      "T..TT...f~~f...TT..T",
      "T..TT...f~~f...TT..T",
      "T.......ffff.......T",
      "T====,=========,===T",
      "T.###.3.,,,..4.###.T",
      "T.###...,PH....###.T",
      "T.......,,,........T",
      "TTTTTTTTTTTTTTTTTTTT",
    ],
  },
  {
    id: "vila-conquista",
    naCidade: { x: 0.82, y: 0.8 },
    nome: "Vila Conquista",
    topicos: [7],
    area: "Direito à cidade",
    destaque: "#F2B705",
    casas: {
      u: { numero: 1, cor: 0, varal: true, cachorro: false, vaso: false },
      v: { numero: 2, cor: 1, varal: true, cachorro: false, vaso: true },
      w: { numero: 3, cor: 1, varal: false, cachorro: true, vaso: false },
      x: { numero: 4, cor: 3, varal: true, cachorro: false, vaso: true },
      y: { numero: 5, cor: 0, varal: true, cachorro: true, vaso: true },
      z: { numero: 6, cor: 2, varal: false, cachorro: false, vaso: true },
    },
    mapa: [
      "TTTTTTTTTTTTTTTTTTTT",
      "T##.##.##.##.##.##.T",
      "T##.##.##.##.##.##.T",
      "T,,,,,,,,,,,,,,,,,,T",
      "T.1..............2.T",
      "T==================T",
      "T,,,,,,,,,,,,,,,,,,T",
      "T##.##.##..##.##.##T",
      "T#u.#v.#w..#x.#y.#zT",
      "T,,,,,,,,,,,,,,,,,,T",
      "T.3..............4.T",
      "T==================T",
      "T,,,,,,,,,,PH,,,,,,T",
      "TTT..T....T....b.bTT",
      "TTTTTTTTTTTTTTTTTTTT",
    ],
  },
  {
    id: "campo",
    naCidade: { x: 0.5, y: 0.86 },
    nome: "Campo Verde",
    topicos: [9, 10, 11],
    area: "Alimentação, energia e meio ambiente",
    destaque: "#009C3B",
    mapa: [
      "TTTTTTTTTTTTTTTTTTTT",
      "T...TT......~~~~...T",
      "T.1.TT..2...~~~~...T",
      "T...........~~~~...T",
      "Thhhhhh.........TT.T",
      "Thhhhhh..##.....TT.T",
      "Thhhhhh..##........T",
      "T..................T",
      "T.3....cccccccc....T",
      "T......cmhjhrnc..4.T",
      "T......chhhhhhc....T",
      "T......ccc..ccc....T",
      "T..TT......PH....bbT",
      "T..TT..............T",
      "TTTTTTTTTTTTTTTTTTTT",
    ],
  },
  {
    id: "seguranca",
    naCidade: { x: 0.18, y: 0.8 },
    nome: "Jardim Seguro",
    topicos: [3],
    area: "Segurança pública",
    destaque: "#3D7BE0",
    mapa: [
      "TTTTTTTTTTTTTTTTTTTT",
      "T##.###.##..##.###.T",
      "T##.###.##..##.###.T",
      "T,,,,,,,,,,,,,,,,,,T",
      "T=========,========T",
      "T,,,,,,,,,,,,,,,,,,T",
      "T.1...cccc,cccc..2.T",
      "T.....c..f,f..c....T",
      "T.....c.ff,ff.c....T",
      "T.....c.....O.c....T",
      "T.3...cccc.cccc..4.T",
      "T..........,.......T",
      "T.bT......,PH......T",
      "T.bT.......,.....TTT",
      "TTTTTTTTTTTTTTTTTTTT",
    ],
  },
  {
    id: "centro",
    naCidade: { x: 0.5, y: 0.46 },
    nome: "Centro",
    topicos: [8, 12, 13],
    area: "Economia, trabalho e soberania",
    destaque: "#FFDF00",
    mapa: [
      "TTTTTTTTTTTTTTTTTTTT",
      "T###.####..####.###T",
      "T###.####..####.###T",
      "T,,,,,,,,,,,,,,,,,,T",
      "T.1..,........,..2.T",
      "T====,=========,===T",
      "T,,,,,,,,,,,,,,,,R,T",
      "T###.###.,,.###.#QGT",
      "T###.###.,,.###.##OT",
      "T........,,.......cT",
      "T.3......,,......4.T",
      "T====,=========,===T",
      "T,,,,,,,,,PH,,,,,,,T",
      "T..T...T......T..T.T",
      "TTTTTTTTTTTTTTTTTTTT",
    ],
  },
];

export const LARGURA_BLOCO = 16;
export const PORTAS = ["u", "v", "w", "x", "y", "z"];
export const PLANTAS = ["m", "j", "r", "n"];
export const SOLIDOS = new Set(["#", "T", "b", "~", "c", "Q", "L", "K", ...PORTAS]);

/** Posições, em blocos, dos marcadores de um mapa. */
export function lerMarcadores(mapa) {
  const marcadores = { personagens: {}, pista: null, responsavel: null, objeto: null, portao: null, inicio: null, portas: {}, plantas: {} };
  mapa.forEach((linha, y) => {
    [...linha].forEach((caractere, x) => {
      if ("1234".includes(caractere)) marcadores.personagens[Number(caractere)] = { x, y };
      else if (caractere === "H") marcadores.pista = { x, y };
      else if (caractere === "R") marcadores.responsavel = { x, y };
      else if (caractere === "O") marcadores.objeto = { x, y };
      else if (caractere === "G") marcadores.portao = { x, y };
      else if (PORTAS.includes(caractere)) marcadores.portas[caractere] = { x, y };
      else if (PLANTAS.includes(caractere)) marcadores.plantas[caractere] = { x, y };
      else if (caractere === "P") marcadores.inicio = { x, y };
    });
  });
  return marcadores;
}
