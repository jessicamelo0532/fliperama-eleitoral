/**
 * Foge, Zero-Um! — labirinto satírico com cards "Na vida real" ao fim de cada fase.
 */

import {
  el, montarMoldura, carregarConteudo, renderFontes, mostrarResultado, registrarAcao,
} from "../../assets/js/moldura.js";
import {
  LARGURA as W, ALTURA as H, TAMANHO_CASA as P, MAPAS, RITMO, POSICAO_BONUS, PORTA_FISCAIS, SALA_FISCAIS,
} from "./labirinto.js";
import { sprite, spriteHerdeiro, spriteFiscal, spriteBonus, desenharItem, PASTA, LIMINAR, JUIZ } from "./sprites.js";
import { iniciarSom, definirSom, tocarMusica, efeitos } from "./som.js";
import { PONTOS_DO_MAPA, desenharMapa } from "./mapa.js";

const TITULO = "Foge, Zero-Um!";
const CHAVE_PROGRESSO = "fliperama.foge-zero-um.v1";
const LARGURA_TELA = W * P;
const ALTURA_TELA = H * P;
const DX = [0, -1, 0, 1];
const DY = [-1, 0, 1, 0];
const oposta = (direcao) => (direcao + 2) % 4;
const MOVIMENTO_REDUZIDO = matchMedia("(prefers-reduced-motion: reduce)").matches;
const COR = { marmore: "#efe7d6", veio: "#d6ccb4", contorno: "#3d3526", sombra: "#05110b", ouro: "#f2c14e", cordao: "#d23c28" };

const FISCAIS = [
  {
    id: "PF", sigla: "PF", nome: "Polícia Federal", descricao: "vai direto atrás de você.",
    cor: "#2b313b", sombra: "#191d24", letra: "#f2c14e", canto: [W - 2, -4], casa: [9, 7],
    flagra: ["Operação deflagrada!", "A Polícia Federal bateu na porta às 6 da manhã."],
  },
  {
    id: "MP", sigla: "MP", nome: "Ministério Público", descricao: "tenta te cercar pela frente.",
    cor: "#b02a1e", sombra: "#7a1a12", letra: "#fff4e6", canto: [1, -4], casa: [9, 9],
    flagra: ["Denúncia oferecida!", "O Ministério Público juntou as provas."],
  },
  {
    id: "TV", sigla: "TV", nome: "Imprensa", descricao: "aparece de onde você não espera.",
    cor: "#7442b3", sombra: "#4e2a7d", letra: "#fff4e6", canto: [W - 1, H + 1], casa: [8, 9],
    flagra: ["Furo de reportagem!", "Sua cara vai estar no jornal de amanhã."],
  },
  {
    id: "COAF", sigla: "$", nome: "Coaf", descricao: "chega perto e recua.",
    cor: "#2f6ad6", sombra: "#1d4592", letra: "#fff4e6", canto: [0, H + 1], casa: [10, 9],
    flagra: ["Movimentação atípica!", "O Coaf achou depósitos que não fecham a conta."],
  },
];

const ANULACOES = [
  "O juiz Absolvino considerou as provas ilegais e devolveu os três mandatos ao Herdeiro.",
  "O juiz Absolvino entendeu que a investigação começou no foro errado. Tudo volta à estaca zero.",
  "O juiz Absolvino achou um erro de formatação no relatório e anulou o processo inteiro.",
  "O juiz Absolvino concedeu habeas corpus de ofício. O Herdeiro nem precisou pedir.",
  "O juiz Absolvino declarou o caso prescrito antes mesmo de ele começar.",
];

montarMoldura({ id: "foge-zero-um", titulo: TITULO });

const areaJogo = document.getElementById("area-jogo");
const tela = document.getElementById("tela");
const palco = document.getElementById("palco");
const hud = document.getElementById("hud");
const cena = document.getElementById("cena");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const sobreposicao = document.getElementById("sobreposicao");
const avisoCena = document.getElementById("aviso-cena");

/* No celular, a câmera mostra só parte do labirinto, acompanhando o Herdeiro, para tudo ficar maior. */
const VISTA_APROXIMADA = { colunas: 13, linhas: 15 };
const vista = { colunas: W, linhas: H, x: 0, y: 0 };

function ajustarVista() {
  const aproximar = window.innerWidth < 720 || window.innerHeight < 600;
  const { colunas, linhas } = aproximar ? VISTA_APROXIMADA : { colunas: W, linhas: H };
  Object.assign(vista, { colunas, linhas });
  canvas.width = colunas * P;
  canvas.height = linhas * P;
  cena.style.setProperty("--proporcao", String(colunas / linhas));
}

/* ---------- Progresso ---------- */

const PROGRESSO_INICIAL = { recorde: 0, som: true, concluidas: [], ondeEsta: 0 };

function carregarProgresso() {
  try {
    return { ...PROGRESSO_INICIAL, ...JSON.parse(localStorage.getItem(CHAVE_PROGRESSO) || "{}") };
  } catch {
    return { ...PROGRESSO_INICIAL };
  }
}

function salvarProgresso() {
  try { localStorage.setItem(CHAVE_PROGRESSO, JSON.stringify(progresso)); } catch { /* navegação privada */ }
}

const progresso = carregarProgresso();

/* ---------- Conteúdo ---------- */

let fases = [];
let cards = {};

async function carregarFases() {
  const itens = await carregarConteudo("fases.json");
  fases = itens.filter((item) => item.tipo === "fase" && MAPAS[item.id]);
  cards = Object.fromEntries(itens.filter((item) => item.tipo === "bonus").map((item) => [item.fase, item]));
}

/* ---------- Estado ---------- */

const jogo = {
  estado: "inicio", fase: 0, desviado: 0, mandatos: 3, anulacoes: 0, relogio: 0, tempoEstado: 0,
  tempoSaida: 0, onda: 0, tempoOnda: 0, tempoLiminar: 0, sequencia: 0, restantes: 0, recolhidos: 0,
  valorItem: 0, proximoBonus: 0, bonus: null, textos: [], antesDaPausa: null, tempoJuiz: 0,
};
const herdeiro = { tx: 9, ty: 15, dir: -1, proxima: -1, avanco: 0, ultima: 2, tipo: "herdeiro" };
const fiscais = FISCAIS.map((fiscal, indice) => ({
  ...fiscal, indice, tx: 0, ty: 0, dir: -1, avanco: 0, situacao: "sala", suspenso: false, tipo: "fiscal",
}));
let mapa = [];
let itens = [];
let distanciaPorta = [];
const fundo = document.createElement("canvas");
const fundoClaro = document.createElement("canvas");

const faseAtual = () => fases[jogo.fase];
const ritmoAtual = () => RITMO[faseAtual().id];

/* ---------- Formatação ---------- */

const formatar = (valor) => `R$ ${Math.round(valor).toLocaleString("pt-BR")}`;
function formatarCurto(valor) {
  if (valor >= 1e6) return `R$ ${(valor / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} MI`;
  if (valor >= 1000) return `R$ ${Math.round(valor / 1000).toLocaleString("pt-BR")} MIL`;
  return `R$ ${Math.round(valor)}`;
}
const numeroProcesso = (n) => String(n).padStart(4, "0");

/* ---------- Labirinto ---------- */

function casa(c, r) {
  if (r < 0 || r >= H) return "#";
  return mapa[r][(c + W) % W];
}

function podeEntrar(c, r, quem) {
  const tipo = casa(c, r);
  if (tipo === "#") return false;
  if (tipo === "-" || tipo === "G") return quem.tipo === "fiscal" && quem.situacao !== "ativo";
  return true;
}

/* Distância de cada casa até a porta da sala, para o fiscal arquivado voltar pelo caminho mais curto. */
function calcularDistancias() {
  distanciaPorta = Array.from({ length: H }, () => Array(W).fill(Infinity));
  const [pc, pr] = PORTA_FISCAIS;
  const fila = [[pc, pr]];
  distanciaPorta[pr][pc] = 0;
  while (fila.length) {
    const [c, r] = fila.shift();
    for (let k = 0; k < 4; k++) {
      const nc = (c + DX[k] + W) % W;
      const nr = r + DY[k];
      if (nr < 0 || nr >= H || "#-G".includes(mapa[nr][nc])) continue;
      if (distanciaPorta[nr][nc] > distanciaPorta[r][c] + 1) {
        distanciaPorta[nr][nc] = distanciaPorta[r][c] + 1;
        fila.push([nc, nr]);
      }
    }
  }
}

function carregarFase(indice) {
  jogo.fase = indice;
  const fase = faseAtual();
  const ritmo = ritmoAtual();
  mapa = MAPAS[fase.id].map((linha) => linha.split(""));
  itens = mapa.map((linha) => linha.slice());
  itens[ritmo.inicio[1]][ritmo.inicio[0]] = " ";
  const totalItens = itens.flat().filter((tipo) => tipo === ".").length;
  jogo.restantes = itens.flat().filter((tipo) => tipo === "." || tipo === "o").length;
  jogo.valorItem = fase.meta ? fase.meta / totalItens : fase.valorItem;
  jogo.recolhidos = 0;
  jogo.proximoBonus = 0;
  jogo.bonus = null;
  calcularDistancias();
  desenharFundo();
  recomecarRodada();
  atualizarHud();
}

function recomecarRodada() {
  const ritmo = ritmoAtual();
  Object.assign(herdeiro, { tx: ritmo.inicio[0], ty: ritmo.inicio[1], dir: -1, proxima: -1, avanco: 0, ultima: 2 });
  fiscais.forEach((fiscal, i) => Object.assign(fiscal, {
    tx: fiscal.casa[0], ty: fiscal.casa[1], dir: i === 0 ? 1 : -1, avanco: 0, suspenso: false,
    situacao: i === 0 ? "ativo" : "sala",
  }));
  Object.assign(jogo, { tempoSaida: 0, onda: 0, tempoOnda: ritmo.ondas[0], tempoLiminar: 0, sequencia: 0, textos: [] });
}

/* ---------- Movimento ---------- */

function posicao(quem) {
  return quem.dir >= 0 ? [quem.tx + DX[quem.dir] * quem.avanco, quem.ty + DY[quem.dir] * quem.avanco] : [quem.tx, quem.ty];
}

function inverter(quem) {
  if (quem.dir < 0) return;
  if (quem.avanco > 0) {
    quem.tx = (quem.tx + DX[quem.dir] + W) % W;
    quem.ty += DY[quem.dir];
    quem.avanco = 1 - quem.avanco;
  }
  quem.dir = oposta(quem.dir);
}

function avancar(quem, distancia) {
  let passos = 0;
  while (distancia > 1e-6 && passos++ < 8) {
    if (quem.avanco === 0) {
      if (quem.tipo === "herdeiro") decidirHerdeiro(quem); else decidirFiscal(quem);
      if (quem.dir < 0) return;
      if (!podeEntrar(quem.tx + DX[quem.dir], quem.ty + DY[quem.dir], quem)) {
        if (quem.tipo === "herdeiro") quem.dir = -1;
        return;
      }
    }
    const falta = 1 - quem.avanco;
    if (distancia < falta) { quem.avanco += distancia; return; }
    distancia -= falta;
    quem.avanco = 0;
    quem.tx = (quem.tx + DX[quem.dir] + W) % W;
    quem.ty += DY[quem.dir];
    if (quem.tipo === "herdeiro") {
      chegou();
      if (jogo.estado !== "jogando") return;
    }
  }
}

function decidirHerdeiro(h) {
  if (h.proxima >= 0 && podeEntrar(h.tx + DX[h.proxima], h.ty + DY[h.proxima], h)) h.dir = h.proxima;
  else if (h.dir >= 0 && !podeEntrar(h.tx + DX[h.dir], h.ty + DY[h.dir], h)) h.dir = -1;
  if (h.dir >= 0) h.ultima = h.dir;
}

const dispersando = () => jogo.onda < ritmoAtual().ondas.length && jogo.onda % 2 === 0;

/* Cada fiscal mira um ponto diferente: é isso que dá a cada um o seu jeito de perseguir. */
function alvoDoFiscal(fiscal) {
  if (dispersando()) return fiscal.canto;
  const direcao = herdeiro.dir >= 0 ? herdeiro.dir : herdeiro.ultima;
  switch (fiscal.id) {
    case "PF": return [herdeiro.tx, herdeiro.ty];
    case "MP": return [herdeiro.tx + 4 * DX[direcao], herdeiro.ty + 4 * DY[direcao]];
    case "TV": {
      const ax = herdeiro.tx + 2 * DX[direcao];
      const ay = herdeiro.ty + 2 * DY[direcao];
      return [2 * ax - fiscais[0].tx, 2 * ay - fiscais[0].ty];
    }
    default: {
      const distancia2 = (fiscal.tx - herdeiro.tx) ** 2 + (fiscal.ty - herdeiro.ty) ** 2;
      return distancia2 > 64 ? [herdeiro.tx, herdeiro.ty] : fiscal.canto;
    }
  }
}

function decidirFiscal(fiscal) {
  const [porta, salaY] = [PORTA_FISCAIS, SALA_FISCAIS[1]];
  if (fiscal.situacao === "saindo") {
    if (fiscal.ty === salaY && fiscal.tx !== porta[0]) { fiscal.dir = fiscal.tx < porta[0] ? 3 : 1; return; }
    if (fiscal.tx === porta[0] && fiscal.ty > porta[1]) { fiscal.dir = 0; return; }
    if (fiscal.tx === porta[0] && fiscal.ty === porta[1]) { fiscal.situacao = "ativo"; fiscal.dir = -1; }
  }
  if (fiscal.situacao === "arquivado") {
    if (fiscal.tx === SALA_FISCAIS[0] && fiscal.ty === salaY) { fiscal.situacao = "saindo"; fiscal.suspenso = false; fiscal.dir = 0; return; }
    if (fiscal.tx === porta[0] && fiscal.ty >= porta[1] && fiscal.ty < salaY) { fiscal.dir = 2; return; }
    let melhor = -1;
    let menor = Infinity;
    for (let k = 0; k < 4; k++) {
      const nc = (fiscal.tx + DX[k] + W) % W;
      const nr = fiscal.ty + DY[k];
      if (nr < 0 || nr >= H) continue;
      if (distanciaPorta[nr][nc] < menor) { menor = distanciaPorta[nr][nc]; melhor = k; }
    }
    fiscal.dir = melhor;
    return;
  }
  if (fiscal.situacao !== "ativo") return;
  const opcoes = [];
  for (let k = 0; k < 4; k++) {
    if (fiscal.dir >= 0 && k === oposta(fiscal.dir)) continue;
    if (podeEntrar(fiscal.tx + DX[k], fiscal.ty + DY[k], fiscal)) opcoes.push(k);
  }
  if (!opcoes.length) { fiscal.dir = fiscal.dir >= 0 ? oposta(fiscal.dir) : -1; return; }
  if (fiscal.suspenso) { fiscal.dir = opcoes[Math.floor(Math.random() * opcoes.length)]; return; }
  const [ax, ay] = alvoDoFiscal(fiscal);
  let melhor = opcoes[0];
  let menor = Infinity;
  for (const k of opcoes) {
    const distancia2 = (fiscal.tx + DX[k] - ax) ** 2 + (fiscal.ty + DY[k] - ay) ** 2;
    if (distancia2 < menor) { menor = distancia2; melhor = k; }
  }
  fiscal.dir = melhor;
}

/* ---------- Regras ---------- */

function chegou() {
  const fase = faseAtual();
  const ritmo = ritmoAtual();
  const tipo = itens[herdeiro.ty][herdeiro.tx];
  if (tipo === "." || tipo === "o") {
    itens[herdeiro.ty][herdeiro.tx] = " ";
    jogo.restantes--;
    jogo.recolhidos++;
    if (tipo === ".") { somar(jogo.valorItem); efeitos.item(); } else ativarLiminar();
    if (jogo.proximoBonus < ritmo.bonusEm.length && jogo.recolhidos >= ritmo.bonusEm[jogo.proximoBonus]) {
      jogo.proximoBonus++;
      jogo.bonus = { tempo: 9 };
    }
    if (jogo.restantes <= 0) { faseLimpa(); return; }
  }
  if (jogo.bonus && herdeiro.tx === POSICAO_BONUS[0] && herdeiro.ty === POSICAO_BONUS[1]) {
    jogo.bonus = null;
    efeitos.bonus();
    if (fase.bonus.valor) {
      somar(fase.bonus.valor);
      mostrarTexto(`+${formatarCurto(fase.bonus.valor).replace("R$ ", "")}`, POSICAO_BONUS[0], POSICAO_BONUS[1]);
    }
    if (cards[fase.id]) abrirCardBonus(cards[fase.id]);
  }
}

function somar(valor) {
  jogo.desviado += valor;
  atualizarHud();
}

function mostrarTexto(texto, x, y) {
  jogo.textos.push({ texto, x, y, tempo: 0 });
}

function ativarLiminar() {
  jogo.tempoLiminar = ritmoAtual().liminar;
  jogo.sequencia = 0;
  fiscais.forEach((fiscal) => {
    if (fiscal.situacao === "arquivado") return;
    fiscal.suspenso = true;
    if (fiscal.situacao === "ativo") inverter(fiscal);
  });
  mostrarTexto("LIMINAR!", herdeiro.tx, herdeiro.ty);
  efeitos.liminar();
}

function verificarEncontros() {
  const [hx, hy] = posicao(herdeiro);
  for (const fiscal of fiscais) {
    if (fiscal.situacao === "sala" || fiscal.situacao === "arquivado") continue;
    const [fx, fy] = posicao(fiscal);
    let dx = Math.abs(hx - fx);
    dx = Math.min(dx, W - dx);
    if (dx >= 0.5 || Math.abs(hy - fy) >= 0.5) continue;
    if (fiscal.suspenso) arquivar(fiscal);
    else { flagrado(fiscal); return; }
  }
}

function arquivar(fiscal) {
  fiscal.suspenso = false;
  fiscal.situacao = "arquivado";
  jogo.sequencia++;
  const valor = 20000 * 2 ** (jogo.sequencia - 1);
  somar(valor);
  const [x, y] = posicao(fiscal);
  mostrarTexto(`+${formatarCurto(valor).replace("R$ ", "")}`, x, y);
  efeitos.arquivar();
}

function flagrado(fiscal) {
  jogo.estado = "flagrado";
  jogo.tempoEstado = 4.2;
  mostrarAviso(fiscal.flagra[0], fiscal.flagra[1], true);
  efeitos.pego();
}

function depoisDoFlagra() {
  esconderAviso();
  if (faseAtual().juizAnulaSempre) { anularProcesso(); return; }
  jogo.mandatos--;
  atualizarHud();
  if (jogo.mandatos <= 0) { anularProcesso(); return; }
  recomecarRodada();
  sessaoAberta("De volta", faseAtual().nome);
}

function faseLimpa() {
  jogo.estado = "limpa";
  jogo.tempoEstado = 1.8;
  guardarRecorde();
  efeitos.vitoria();
}

function sessaoAberta(titulo, subtitulo) {
  jogo.estado = "pronto";
  jogo.tempoEstado = 1.7;
  mostrarAviso(titulo, subtitulo, false);
  efeitos.martelo();
}

function guardarRecorde() {
  if (jogo.desviado <= progresso.recorde) return;
  progresso.recorde = jogo.desviado;
  salvarProgresso();
}

/* ---------- Cartões sobre o labirinto ---------- */

function abrirCartao({ rotulo, titulo, conteudo = [], botao, carimbo }) {
  const acao = el("button", { class: "botao", type: "button", onclick: botao.acao }, botao.texto);
  sobreposicao.replaceChildren(
    el("article", { class: "fzu-cartao", role: "dialog", "aria-modal": "true", "aria-label": titulo },
      el("div", { class: "fzu-cartao__topo" },
        el("span", { class: "fzu-cartao__rotulo", text: rotulo }),
        carimbo && el("span", { class: "fzu-carimbo pixel", text: carimbo })),
      el("h2", { class: "fzu-cartao__titulo pixel", text: titulo }),
      ...conteudo,
      acao)
  );
  sobreposicao.hidden = false;
  sobreposicao.scrollTop = 0;
  acao.focus({ preventScroll: true });
}

function fecharCartao() {
  sobreposicao.hidden = true;
  sobreposicao.replaceChildren();
  canvas.focus({ preventScroll: true });
}

function blocoVidaReal(item) {
  const bloco = el("div", { class: "fzu-vida-real" },
    el("p", { class: "fzu-vida-real__rotulo pixel", text: "Na vida real" }),
    el("p", { text: item.vidaReal }));
  renderFontes(bloco, item.fontes);
  return bloco;
}

function apresentarFase() {
  const fase = faseAtual();
  jogo.estado = "apresentacao";
  abrirCartao({
    rotulo: `Processo nº ${numeroProcesso(jogo.fase + 1)}/2026`,
    carimbo: `FASE ${jogo.fase + 1}`,
    titulo: fase.nome,
    conteudo: [
      el("p", { class: "fzu-apresentacao", text: fase.apresentacao }),
      el("p", { class: "fzu-nesta" }, el("strong", { text: "Nesta fase: " }), fase.nesta),
    ],
    botao: { texto: "Começar", acao: () => { fecharCartao(); sessaoAberta("Valendo!", `Fase ${jogo.fase + 1} · ${fase.nome}`); } },
  });
}

function abrirCardBonus(item) {
  jogo.estado = "cartao";
  abrirCartao({
    rotulo: "Bônus",
    titulo: item.nome,
    conteudo: [blocoVidaReal(item)],
    botao: { texto: "Voltar ao jogo", acao: () => { fecharCartao(); sessaoAberta("De volta", faseAtual().nome); } },
  });
}

function faseConcluida() {
  const fase = faseAtual();
  if (!progresso.concluidas.includes(fase.id)) progresso.concluidas.push(fase.id);
  salvarProgresso();
  const ultima = jogo.fase === fases.length - 1;
  jogo.estado = "entre-fases";
  abrirCartao({
    rotulo: `Fase ${jogo.fase + 1} concluída`,
    carimbo: "ARQUIVADO",
    titulo: fase.nome,
    conteudo: [blocoVidaReal(fase)],
    botao: {
      texto: ultima ? "Ver resultado" : "Voltar ao mapa",
      acao: () => {
        fecharCartao();
        if (ultima) terminarJogo(); else telaMapa(jogo.fase + 1);
      },
    },
  });
}

function anularProcesso() {
  jogo.anulacoes++;
  jogo.estado = "anulacao";
  jogo.tempoJuiz = 0;
  atualizarHud();
  const retrato = el("canvas", { class: "fzu-juiz", width: "16", height: "16", "aria-hidden": "true" });
  abrirCartao({
    rotulo: `Decisão do juiz nº ${numeroProcesso(jogo.anulacoes)}/2026`,
    carimbo: "ANULADO",
    titulo: "Processo anulado",
    conteudo: [
      el("div", { class: "fzu-juiz-cena" }, retrato, el("p", { text: ANULACOES[(jogo.anulacoes - 1) % ANULACOES.length] })),
      el("p", { class: "fzu-contas" }, `Mandatos devolvidos: 3 · Anulações: ${jogo.anulacoes}`),
    ],
    botao: {
      texto: faseAtual().voltar,
      acao: () => {
        jogo.mandatos = 3;
        recomecarRodada();
        atualizarHud();
        fecharCartao();
        sessaoAberta("De volta", "Como se nada tivesse acontecido");
      },
    },
  });
  efeitos.anulacao();
}

function pausar() {
  if (jogo.estado !== "jogando" && jogo.estado !== "pronto") return;
  jogo.antesDaPausa = jogo.estado;
  jogo.estado = "pausa";
  abrirCartao({
    rotulo: "Ordem do dia",
    carimbo: "SUSPENSA",
    titulo: "Sessão suspensa",
    conteudo: [el("p", { text: "O Herdeiro saiu para um cafezinho. A fiscalização também espera." })],
    botao: { texto: "Retomar", acao: retomar },
  });
}

function retomar() {
  if (jogo.estado !== "pausa") return;
  jogo.estado = jogo.antesDaPausa || "jogando";
  fecharCartao();
}

function mostrarAviso(titulo, subtitulo, alerta) {
  avisoCena.replaceChildren(el("strong", { class: "pixel", text: titulo }), el("span", { text: subtitulo }));
  avisoCena.classList.toggle("fzu-aviso--alerta", alerta);
  avisoCena.hidden = false;
}

function esconderAviso() {
  avisoCena.hidden = true;
}

/* ---------- Telas fora do labirinto ---------- */

function mostrarTela() {
  palco.hidden = true;
  tela.hidden = false;
}

function mostrarPalco() {
  tela.hidden = true;
  palco.hidden = false;
}

function iconeFiscal(fiscal) {
  const icone = el("canvas", { class: "fzu-icone", width: "12", height: "12", "aria-hidden": "true" });
  icone.getContext("2d").drawImage(spriteFiscal(fiscal, 2, 0, 1, false, false), 0, 0);
  return icone;
}

function iconeDe(linhas, paleta, chave, tamanho = 12) {
  const icone = el("canvas", { class: "fzu-icone", width: String(tamanho), height: String(tamanho), "aria-hidden": "true" });
  const imagem = sprite(chave, linhas, paleta);
  icone.getContext("2d").drawImage(imagem, Math.floor((tamanho - imagem.width) / 2), Math.floor((tamanho - imagem.height) / 2));
  return icone;
}

function telaInicio() {
  jogo.estado = "inicio";
  mostrarTela();
  const elenco = [
    ...FISCAIS.map((fiscal) => [iconeFiscal(fiscal), fiscal.nome, fiscal.descricao]),
    [iconeDe(LIMINAR.linhas, LIMINAR.paleta, "liminar"), "Liminar", "suspende a fiscalização por alguns segundos. Encoste nos fiscais para arquivar."],
    [iconeDe(JUIZ.cima, JUIZ.paleta, "juiz-cima", 16), "Juiz Absolvino", "anula o processo sempre que você perde os três mandatos."],
  ];
  tela.replaceChildren(
    el("div", { class: "fzu-inicio" },
      el("p", { class: "fzu-inicio__sobre", text: `Uma sátira em ${fases.length === 4 ? "quatro" : fases.length} fases` }),
      el("h2", { class: "fzu-inicio__titulo pixel" }, "FOGE, ", el("span", { text: "ZERO-UM!" })),
      el("p", { class: "fzu-inicio__lide", text: "Conduza o Herdeiro Zero-Um pelos corredores do poder e recolha cada centavo antes que a fiscalização chegue." }),
      el("ul", { class: "fzu-elenco" },
        ...elenco.map(([icone, nome, descricao]) => el("li", {}, icone, el("span", {}, el("strong", { text: nome }), ` ${descricao}`)))),
      el("div", { class: "fzu-inicio__acoes" },
        el("button", { class: "botao", type: "button", onclick: jogar, disabled: fases.length ? null : "" }, progresso.concluidas.length ? "Continuar" : "Jogar"),
        progresso.concluidas.length > 0 && el("button", { class: "botao botao--fantasma", type: "button", onclick: recomecar }, "Recomeçar")),
      el("p", { class: "fzu-inicio__dica fzu-so-teclado", text: "Setas para andar · Esc para pausar" }),
      el("p", { class: "fzu-inicio__dica fzu-so-toque", text: "Deslize o dedo no labirinto ou use o direcional." }),
      progresso.recorde > 0 && el("p", { class: "fzu-inicio__dica", text: `Recorde: ${formatar(progresso.recorde)}` }),
      el("p", { class: "fzu-inicio__aviso", text: "Os fatos dos cards \"Na vida real\" têm data e fonte." }))
  );
}

function jogar() {
  registrarAcao("inicio");
  iniciarSom(progresso.som);
  tocarMusica();
  Object.assign(jogo, { desviado: 0, anulacoes: 0 });
  if (!emTelaCheia()) alternarTelaCheia();
  areaJogo.scrollIntoView({ block: "start", behavior: MOVIMENTO_REDUZIDO ? "auto" : "smooth" });
  telaMapa(primeiraPendente());
}

/** Apaga as fases concluídas (recorde e som ficam) e volta ao início. */
function recomecar() {
  Object.assign(progresso, { concluidas: [], ondeEsta: 0 });
  salvarProgresso();
  telaInicio();
}

const liberada = (indice) => indice === 0 || progresso.concluidas.includes(fases[indice - 1]?.id);
const primeiraPendente = () => {
  const indice = fases.findIndex((fase) => !progresso.concluidas.includes(fase.id));
  return indice < 0 ? fases.length - 1 : indice;
};

function entrarNaFase(indice) {
  jogo.mandatos = 3;
  mostrarPalco();
  montarHud();
  ajustarVista();
  carregarFase(indice);
  apresentarFase();
}

/* ---------- Mapa das fases ---------- */

let caminhada = null;

function telaMapa(destino) {
  jogo.estado = "mapa";
  mostrarTela();
  const fundoMapa = el("canvas", { class: "fzu-mapa__fundo", width: "160", height: "120", role: "img", "aria-label": "Mapa da campanha com as fases ligadas por uma estrada" });
  desenharMapa(fundoMapa, fases.map((fase) => fase.id));
  const boneco = el("canvas", { class: "fzu-mapa__boneco", width: "12", height: "12", "aria-hidden": "true" });
  const painel = el("div", { class: "fzu-painel", "aria-live": "polite" });
  const pontos = fases.map((fase, indice) => {
    const concluida = progresso.concluidas.includes(fase.id);
    const [x, y] = PONTOS_DO_MAPA[indice];
    return el("button", {
      class: `fzu-ponto${concluida ? " fzu-ponto--concluida" : ""}${liberada(indice) ? "" : " fzu-ponto--bloqueada"}`,
      type: "button", style: `left:${x * 100}%;top:${y * 100}%`,
      "aria-label": `${indice + 1}. ${fase.nome}: ${concluida ? "concluída" : liberada(indice) ? "liberada" : "bloqueada"}`,
      onclick: () => (liberada(indice) ? caminharAte(indice) : mostrarPainel(indice)),
    }, el("span", { class: "pixel", text: concluida ? "✓" : liberada(indice) ? String(indice + 1) : "🔒" }));
  });

  function posicionarBoneco(x, y, direcao, passo) {
    boneco.style.left = `${x * 100}%`;
    boneco.style.top = `${y * 100}%`;
    const pincel = boneco.getContext("2d");
    pincel.clearRect(0, 0, 12, 12);
    pincel.drawImage(spriteHerdeiro(direcao, passo), 0, 0);
  }

  function mostrarPainel(indice) {
    const fase = fases[indice];
    const concluida = progresso.concluidas.includes(fase.id);
    const situacao = concluida ? "Concluída. Dá para jogar de novo." : liberada(indice) ? "Liberada" : "Bloqueada: conclua a fase anterior";
    painel.replaceChildren(
      el("p", { class: "fzu-painel__nome pixel", text: `${indice + 1}. ${fase.nome}` }),
      el("p", { class: "fzu-painel__situacao", text: situacao }),
      el("button", {
        class: "botao", type: "button", disabled: liberada(indice) && progresso.ondeEsta === indice ? null : "",
        onclick: () => entrarNaFase(indice),
      }, "Entrar"));
    pontos.forEach((ponto, i) => ponto.setAttribute("aria-current", String(i === indice)));
  }

  /* O Herdeiro anda pela estrada, ponto a ponto, até a fase escolhida. */
  function caminharAte(indice) {
    if (caminhada) cancelAnimationFrame(caminhada);
    const inicio = progresso.ondeEsta;
    if (inicio === indice) { mostrarPainel(indice); return; }
    const passoIndice = indice > inicio ? 1 : -1;
    const trechos = [];
    for (let i = inicio; i !== indice; i += passoIndice) trechos.push([PONTOS_DO_MAPA[i], PONTOS_DO_MAPA[i + passoIndice]]);
    let trecho = 0;
    let comeco = null;
    mostrarPainel(indice);
    painel.querySelector(".botao").disabled = true;
    const DURACAO = MOVIMENTO_REDUZIDO ? 1 : 700;
    function andar(agora) {
      comeco ??= agora;
      const t = Math.min(1, (agora - comeco) / DURACAO);
      const [[x1, y1], [x2, y2]] = trechos[trecho];
      const direcao = Math.abs(x2 - x1) > Math.abs(y2 - y1) ? (x2 > x1 ? 3 : 1) : (y2 > y1 ? 2 : 0);
      posicionarBoneco(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, direcao, Math.floor(agora / 150) % 2);
      if (t < 1) { caminhada = requestAnimationFrame(andar); return; }
      trecho++;
      comeco = null;
      if (trecho < trechos.length) { caminhada = requestAnimationFrame(andar); return; }
      caminhada = null;
      progresso.ondeEsta = indice;
      salvarProgresso();
      posicionarBoneco(x2, y2, 2, 0);
      mostrarPainel(indice);
    }
    caminhada = requestAnimationFrame(andar);
  }

  tela.replaceChildren(
    el("div", { class: "fzu-mapa" },
      el("div", { class: "fzu-mapa__topo" },
        el("p", { class: "fzu-mapa__rotulo pixel", text: "Mapa da campanha" }),
        el("span", { class: "fzu-hud__botoes" }, botaoTelaCheia(), botaoSom())),
      el("div", { class: "fzu-mapa__quadro" }, fundoMapa, ...pontos, boneco),
      painel,
      el("div", { class: "fzu-inicio__acoes" },
        el("button", { class: "botao botao--fantasma", type: "button", onclick: telaInicio }, "Início"))));
  const [x, y] = PONTOS_DO_MAPA[progresso.ondeEsta] ?? PONTOS_DO_MAPA[0];
  posicionarBoneco(x, y, 2, 0);
  if (destino !== undefined && destino !== progresso.ondeEsta && liberada(destino)) caminharAte(destino);
  else mostrarPainel(progresso.ondeEsta);
}

function terminarJogo() {
  guardarRecorde();
  jogo.estado = "fim";
  mostrarTela();
  const n = jogo.anulacoes;
  const cardsNaOrdem = fases.flatMap((fase) => (cards[fase.id] ? [fase, cards[fase.id]] : [fase]));
  const ajuda = n === 0 ? "sem precisar do juiz Absolvino" : `graças a ${n} ${n === 1 ? "anulação" : "anulações"} do juiz Absolvino`;
  const resultado = mostrarResultado({
    alvo: tela,
    titulo: "Fim de campanha",
    texto: `O Herdeiro terminou a campanha sem nenhuma condenação, ${ajuda}. Desviado: ${formatar(jogo.desviado)}. Recorde: ${formatar(progresso.recorde)}.`,
    fontes: cardsNaOrdem.flatMap((item) => item.fontes),
    textoCompartilhar: `Fugi da fiscalização em ${TITULO} e o juiz anulou meu processo ${n} ${n === 1 ? "vez" : "vezes"}. Na vida real, os fatos têm fonte:`,
    aoJogarDeNovo: () => { Object.assign(progresso, { concluidas: [], ondeEsta: 0 }); salvarProgresso(); jogar(); },
  });
  if (emTelaCheia()) {
    const sair = el("button", { class: "botao botao--fantasma", type: "button", onclick: async () => { await alternarTelaCheia(); sair.remove(); } }, "Sair da tela cheia");
    resultado.querySelector(".resultado__acoes").append(sair);
  }
  resultado.querySelector(".resultado__texto").after(
    el("p", { class: "fzu-esperanca pixel", text: "O fim dessa história quem escreve é você. 25 de outubro: vote Lula, 13." }));
  const resumo = el("section", { class: "fzu-resumo", "aria-label": "Na vida real" },
    el("p", { class: "fzu-vida-real__rotulo pixel", text: "Na vida real" }),
    el("dl", {}, ...cardsNaOrdem.flatMap((item) => [el("dt", { text: item.nome }), el("dd", { text: item.vidaReal })])));
  resultado.querySelector(".resultado__acoes").after(resumo);
}

/* ---------- Placar ---------- */

const campos = {};

function montarHud() {
  const dado = (rotulo, chave) => el("div", { class: "fzu-dado" },
    el("span", { class: "fzu-dado__rotulo", text: rotulo }),
    campos[chave] = el("span", { class: "fzu-dado__valor pixel" }));
  hud.replaceChildren(
    el("div", { class: "fzu-hud__dados" },
      dado("Desviado", "desviado"), dado("Fase", "fase"), dado("Mandatos", "mandatos"), dado("Anulações", "anulacoes")),
    el("div", { class: "fzu-hud__botoes" }, botaoSom(), botaoTelaCheia(), el("button", {
      class: "fzu-botao pixel", type: "button", "aria-label": "Pausar", onclick: () => (jogo.estado === "pausa" ? retomar() : pausar()),
    }, "PAUSA")));
}

function atualizarHud() {
  if (!campos.desviado) return;
  campos.desviado.textContent = formatarCurto(jogo.desviado);
  campos.fase.textContent = `${jogo.fase + 1}/${fases.length}`;
  campos.anulacoes.textContent = String(jogo.anulacoes);
  campos.mandatos.replaceChildren(...Array.from({ length: Math.max(0, jogo.mandatos) }, () => el("span", { class: "fzu-mandato" })));
  campos.mandatos.setAttribute("aria-label", `${jogo.mandatos} ${jogo.mandatos === 1 ? "mandato" : "mandatos"}`);
}

function botaoSom() {
  const rotulo = () => (progresso.som ? "♪ SOM" : "♪ MUDO");
  const botao = el("button", {
    class: "fzu-botao pixel", type: "button", "aria-pressed": String(progresso.som), "aria-label": "Som",
    onclick: () => {
      progresso.som = !progresso.som;
      salvarProgresso();
      definirSom(progresso.som);
      botao.textContent = rotulo();
      botao.setAttribute("aria-pressed", String(progresso.som));
    },
  }, rotulo());
  return botao;
}

/* ---------- Tela cheia e celular deitado ---------- */

const CELULAR_DEITADO = window.matchMedia("(orientation: landscape) and (max-height: 520px) and (pointer: coarse)");
const emTelaCheia = () => Boolean(document.fullscreenElement || document.webkitFullscreenElement || areaJogo.classList.contains("fzu-imersivo"));

function atualizarModoDeTela() {
  areaJogo.classList.toggle("fzu-cheio", emTelaCheia());
  areaJogo.classList.toggle("fzu-deitado", CELULAR_DEITADO.matches);
  document.querySelectorAll("[data-tela-cheia]").forEach((botao) => {
    botao.textContent = emTelaCheia() ? "SAIR" : "TELA CHEIA";
    botao.setAttribute("aria-label", emTelaCheia() ? "Sair da tela cheia" : "Tela cheia");
  });
}

async function alternarTelaCheia() {
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    await (document.exitFullscreen?.() ?? document.webkitExitFullscreen?.());
  } else if (areaJogo.classList.contains("fzu-imersivo")) {
    areaJogo.classList.remove("fzu-imersivo");
  } else {
    const pedir = areaJogo.requestFullscreen?.bind(areaJogo) ?? areaJogo.webkitRequestFullscreen?.bind(areaJogo);
    try {
      if (!pedir) throw new Error("sem tela cheia");
      await pedir();
    } catch {
      areaJogo.classList.add("fzu-imersivo");
    }
  }
  atualizarModoDeTela();
  canvas.focus({ preventScroll: true });
}

function botaoTelaCheia() {
  return el("button", {
    class: "fzu-botao pixel", type: "button", "data-tela-cheia": "",
    "aria-label": emTelaCheia() ? "Sair da tela cheia" : "Tela cheia", onclick: alternarTelaCheia,
  }, emTelaCheia() ? "SAIR" : "TELA CHEIA");
}

/* ---------- Atualização ---------- */

function atualizar(dt) {
  jogo.relogio += dt;
  jogo.tempoJuiz += dt;
  for (const texto of jogo.textos) { texto.tempo += dt; texto.y -= dt * 1.1; }
  jogo.textos = jogo.textos.filter((texto) => texto.tempo < 1.2);

  if (jogo.estado === "pronto") {
    jogo.tempoEstado -= dt;
    if (jogo.tempoEstado <= 0) { jogo.estado = "jogando"; esconderAviso(); }
    return;
  }
  if (jogo.estado === "flagrado") { jogo.tempoEstado -= dt; if (jogo.tempoEstado <= 0) depoisDoFlagra(); return; }
  if (jogo.estado === "limpa") { jogo.tempoEstado -= dt; if (jogo.tempoEstado <= 0) faseConcluida(); return; }
  if (jogo.estado !== "jogando") return;

  const ritmo = ritmoAtual();
  jogo.tempoSaida += dt;
  fiscais.forEach((fiscal, i) => {
    if (fiscal.situacao === "sala" && jogo.tempoSaida >= ritmo.saida[i]) Object.assign(fiscal, { situacao: "saindo", dir: -1, avanco: 0 });
  });

  if (jogo.tempoLiminar > 0) {
    jogo.tempoLiminar -= dt;
    if (jogo.tempoLiminar <= 0) {
      jogo.tempoLiminar = 0;
      fiscais.forEach((fiscal) => { fiscal.suspenso = false; });
    }
  } else {
    jogo.tempoOnda -= dt;
    if (jogo.tempoOnda <= 0) {
      jogo.onda++;
      jogo.tempoOnda = jogo.onda < ritmo.ondas.length ? ritmo.ondas[jogo.onda] : Infinity;
      fiscais.forEach((fiscal) => { if (fiscal.situacao === "ativo") inverter(fiscal); });
    }
  }

  if (herdeiro.dir >= 0 && herdeiro.proxima === oposta(herdeiro.dir)) inverter(herdeiro);
  avancar(herdeiro, ritmo.velocidade * (jogo.tempoLiminar > 0 ? 1.1 : 1) * dt);
  if (jogo.estado !== "jogando") return;

  for (const fiscal of fiscais) {
    if (fiscal.situacao === "sala") continue;
    let velocidade = ritmo.fiscalizacao;
    if (fiscal.situacao === "arquivado") velocidade *= 2.3;
    else if (fiscal.situacao === "saindo" || fiscal.suspenso) velocidade *= 0.55;
    if (fiscal.situacao === "ativo" && fiscal.ty === 9 && (fiscal.tx <= 3 || fiscal.tx >= 15)) velocidade *= 0.5;
    avancar(fiscal, velocidade * dt);
  }
  verificarEncontros();
  if (jogo.bonus) {
    jogo.bonus.tempo -= dt;
    if (jogo.bonus.tempo <= 0) jogo.bonus = null;
  }
}

/* ---------- Desenho ---------- */

function desenharFundo() {
  const parede = (c, r) => r >= 0 && r < H && c >= 0 && c < W && mapa[r][c] === "#";
  const pintar = (alvo, corParede, corContorno) => {
    alvo.width = LARGURA_TELA;
    alvo.height = ALTURA_TELA;
    const b = alvo.getContext("2d");
    b.fillStyle = ritmoAtual().chao;
    b.fillRect(0, 0, LARGURA_TELA, ALTURA_TELA);
    b.fillStyle = "rgba(255,255,255,0.06)";
    for (let y = 0; y < ALTURA_TELA; y += 4) for (let x = y % 8 === 0 ? 0 : 2; x < LARGURA_TELA; x += 4) b.fillRect(x, y, 1, 1);
    const forma = (cor, expandir, deslocamento) => {
      b.fillStyle = cor;
      for (let r = 0; r < H; r++) {
        for (let c = 0; c < W; c++) {
          if (!parede(c, r)) continue;
          const x = c * P + 3 - expandir;
          const y = r * P + 3 - expandir + deslocamento;
          const lado = 2 + 2 * expandir;
          b.fillRect(x, y, lado, lado);
          if (parede(c + 1, r)) b.fillRect(x, y, P + lado, lado);
          if (parede(c, r + 1)) b.fillRect(x, y, lado, P + lado);
          if (parede(c + 1, r) && parede(c, r + 1) && parede(c + 1, r + 1)) b.fillRect(x, y, P + lado, P + lado);
        }
      }
    };
    forma(COR.sombra, 1, 2);
    forma(corContorno, 1, 0);
    forma(corParede, 0, 0);
    if (corParede === COR.marmore) {
      b.fillStyle = COR.veio;
      for (let r = 0; r < H; r++) {
        for (let c = 0; c < W; c++) {
          if (parede(c, r) && parede(c + 1, r) && parede(c, r + 1) && parede(c + 1, r + 1) && (c * 7 + r * 13) % 5 === 0) {
            b.fillRect(c * P + 5, r * P + 6, 3, 1);
            b.fillRect(c * P + 8, r * P + 7, 2, 1);
          }
        }
      }
    }
    b.fillStyle = COR.cordao;
    b.fillRect(9 * P - 2, 8 * P + 3, P + 4, 2);
    b.fillStyle = COR.ouro;
    b.fillRect(9 * P - 3, 8 * P + 2, 1, 4);
    b.fillRect(10 * P + 2, 8 * P + 2, 1, 4);
  };
  pintar(fundo, COR.marmore, COR.contorno);
  pintar(fundoClaro, "#ffffff", COR.ouro);
}

function desenharItens() {
  const tipoItem = faseAtual().item;
  const liminarVisivel = MOVIMENTO_REDUZIDO || Math.floor(jogo.relogio * 4) % 2 === 0;
  const imagemLiminar = sprite("liminar", LIMINAR.linhas, LIMINAR.paleta);
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const tipo = itens[r][c];
      if (tipo === ".") desenharItem(ctx, tipoItem, c * P, r * P);
      else if (tipo === "o" && liminarVisivel) ctx.drawImage(imagemLiminar, c * P + 1, r * P);
    }
  }
}

function desenharTexto(texto, cx, cy) {
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const largura = Math.ceil(ctx.measureText(texto).width);
  const x = Math.max(vista.x + 1, Math.min(vista.x + vista.colunas * P - largura - 1, Math.round(cx - largura / 2)));
  const y = Math.round(cy - 4);
  ctx.fillStyle = "#06120c";
  [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]].forEach(([dx, dy]) => ctx.fillText(texto, x + dx, y + dy));
  ctx.fillStyle = COR.ouro;
  ctx.fillText(texto, x, y);
}

/* Quem atravessa o túnel lateral aparece dos dois lados ao mesmo tempo. */
function desenharComTunel(x, desenhar) {
  desenhar(x);
  if (x > W - 1) desenhar(x - W);
  if (x < 0) desenhar(x + W);
}

function posicionarCamera() {
  const [hx, hy] = posicao(herdeiro);
  const largura = vista.colunas * P;
  const altura = vista.linhas * P;
  vista.x = Math.round(Math.max(0, Math.min(LARGURA_TELA - largura, hx * P + 4 - largura / 2)));
  vista.y = Math.round(Math.max(0, Math.min(ALTURA_TELA - altura, hy * P + 4 - altura / 2)));
}

function desenhar() {
  if (!mapa.length) return;
  ctx.imageSmoothingEnabled = false;
  posicionarCamera();
  ctx.setTransform(1, 0, 0, 1, -vista.x, -vista.y);
  const piscando = jogo.estado === "limpa" && !MOVIMENTO_REDUZIDO && Math.floor(jogo.relogio * 7) % 2 === 0;
  ctx.drawImage(piscando ? fundoClaro : fundo, 0, 0);
  desenharItens();
  if (jogo.bonus && (jogo.bonus.tempo > 2 || Math.floor(jogo.relogio * 6) % 2 === 0)) {
    const { imagem, dx, dy } = spriteBonus(faseAtual().bonus.tipo);
    ctx.drawImage(imagem, POSICAO_BONUS[0] * P - 2 + dx, POSICAO_BONUS[1] * P - 2 + dy);
  }
  const sirene = MOVIMENTO_REDUZIDO ? 1 : Math.floor(jogo.relogio * 5) % 2;
  for (const fiscal of fiscais) {
    const [x, y] = posicao(fiscal);
    let imagem;
    let dy = 0;
    if (fiscal.situacao === "arquivado") {
      imagem = sprite("pasta", PASTA.linhas, PASTA.paleta);
      dy = 2;
    } else {
      const piscando = fiscal.suspenso && jogo.tempoLiminar < 1.8 && Math.floor(jogo.relogio * 7) % 2 === 0;
      const passo = MOVIMENTO_REDUZIDO ? 0 : Math.floor(jogo.relogio * 8 + fiscal.indice) % 2;
      imagem = spriteFiscal(fiscal, fiscal.dir, passo, (sirene + fiscal.indice) % 2, fiscal.suspenso, piscando);
      if (fiscal.situacao === "sala" && !MOVIMENTO_REDUZIDO) dy = Math.round(Math.sin(jogo.relogio * 4 + fiscal.indice) * 1.5);
    }
    desenharComTunel(x, (xx) => ctx.drawImage(imagem, Math.round(xx * P) - 2, Math.round(y * P) - 2 + dy));
  }
  const [hx, hy] = posicao(herdeiro);
  if (jogo.estado !== "flagrado" || Math.floor(jogo.relogio * 8) % 2 === 0) {
    const andando = jogo.estado === "jogando" && herdeiro.dir >= 0;
    const passo = andando && !MOVIMENTO_REDUZIDO ? Math.floor(jogo.relogio * 10) % 2 : 0;
    const imagem = spriteHerdeiro(herdeiro.dir >= 0 ? herdeiro.dir : herdeiro.ultima, passo);
    desenharComTunel(hx, (xx) => ctx.drawImage(imagem, Math.round(xx * P) - 2, Math.round(hy * P) - 2));
  }
  for (const texto of jogo.textos) {
    if (texto.tempo > 0.9 && Math.floor(texto.tempo * 12) % 2) continue;
    desenharTexto(texto.texto, texto.x * P + 4, texto.y * P + 4);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function desenharJuiz() {
  const retrato = sobreposicao.querySelector(".fzu-juiz");
  if (!retrato) return;
  const pincel = retrato.getContext("2d");
  pincel.imageSmoothingEnabled = false;
  pincel.clearRect(0, 0, 16, 16);
  const levantado = MOVIMENTO_REDUZIDO || Math.floor(jogo.tempoJuiz * 3) % 2 === 0;
  pincel.drawImage(sprite(levantado ? "juiz-cima" : "juiz-baixo", levantado ? JUIZ.cima : JUIZ.baixo, JUIZ.paleta), 0, 0);
}

/* ---------- Controles ---------- */

const TECLAS = { ArrowUp: 0, KeyW: 0, ArrowLeft: 1, KeyA: 1, ArrowDown: 2, KeyS: 2, ArrowRight: 3, KeyD: 3 };

function ligarControles() {
  document.addEventListener("keydown", (evento) => {
    if (palco.hidden) return;
    if (evento.code in TECLAS && sobreposicao.hidden) {
      herdeiro.proxima = TECLAS[evento.code];
      evento.preventDefault();
    } else if (evento.code === "Escape") {
      if (jogo.estado === "pausa") retomar(); else pausar();
      evento.preventDefault();
    }
  });

  let toque = null;
  cena.addEventListener("pointerdown", (evento) => {
    if (evento.target.closest(".fzu-sobreposicao")) return;
    toque = { x: evento.clientX, y: evento.clientY, id: evento.pointerId };
  });
  cena.addEventListener("pointermove", (evento) => {
    if (!toque || evento.pointerId !== toque.id) return;
    const dx = evento.clientX - toque.x;
    const dy = evento.clientY - toque.y;
    if (Math.hypot(dx, dy) <= 16) return;
    herdeiro.proxima = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 1) : (dy > 0 ? 2 : 0);
    toque.x = evento.clientX;
    toque.y = evento.clientY;
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((tipo) => cena.addEventListener(tipo, () => { toque = null; }));

  document.querySelectorAll(".fzu-tecla").forEach((botao) => {
    const direcao = Number(botao.dataset.direcao);
    botao.addEventListener("pointerdown", (evento) => {
      evento.preventDefault();
      herdeiro.proxima = direcao;
      botao.classList.add("ativo");
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((tipo) => botao.addEventListener(tipo, () => botao.classList.remove("ativo")));
    botao.addEventListener("click", (evento) => { if (evento.detail === 0) herdeiro.proxima = direcao; });
  });

  document.addEventListener("visibilitychange", () => { if (document.hidden) pausar(); });
  document.addEventListener("fullscreenchange", atualizarModoDeTela);
  document.addEventListener("webkitfullscreenchange", atualizarModoDeTela);
  CELULAR_DEITADO.addEventListener?.("change", atualizarModoDeTela);
  window.addEventListener("resize", ajustarVista);
  atualizarModoDeTela();
}

/* ---------- Início ---------- */

let ultimoQuadro = 0;
function quadro(instante) {
  const dt = Math.min(0.033, ultimoQuadro ? (instante - ultimoQuadro) / 1000 : 0);
  ultimoQuadro = instante;
  if (!palco.hidden) {
    atualizar(dt);
    desenhar();
    desenharJuiz();
  }
  requestAnimationFrame(quadro);
}

async function iniciar() {
  ligarControles();
  try {
    await carregarFases();
  } catch {
    tela.replaceChildren(el("p", { class: "fzu-inicio__dica", text: "Não foi possível carregar o jogo. Recarregue a página." }));
    return;
  }
  telaInicio();
  requestAnimationFrame(quadro);
}

iniciar();
