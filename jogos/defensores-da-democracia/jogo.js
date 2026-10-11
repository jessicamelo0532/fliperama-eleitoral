/**
 * Defensores da Democracia — fluxo do jogo, telas, controles e laço principal.
 * Um trabalhador ou estudante enfrenta cinco ameaças à democracia; cada vitória abre um card "Na vida real".
 */

import { montarMoldura, carregarConteudo, el, renderFontes, mostrarResultado, registrarAcao } from "../../assets/js/moldura.js";
import { iniciarSom, definirSom, tocarMusica, pararMusica, efeitos } from "./som.js";
import {
  novaLuta, passoLuta, passoParado, passoNocaute, desenharLuta, enfurecer, comemorar, falar,
  metadeDaVida, estadoDaLuta, ligarEfeitos, iniciarFesta, retrato, recorteDoRosto, RECORTE_CORPO,
} from "./luta.js";

const TITULO = "Defensores da Democracia";
const CHAVE_PROGRESSO = "fliperama.defensores-da-democracia.v1";
const MOVIMENTO_REDUZIDO = matchMedia("(prefers-reduced-motion: reduce)").matches;
const PASSO = 1000 / 60;
const ANIMO = [
  "A democracia não desiste na primeira derrota. Levanta e tenta de novo!",
  "Respira, chama a galera e volta para a luta.",
  "Cair faz parte. Ficar no chão é que não.",
];

montarMoldura({ id: "defensores-da-democracia", titulo: TITULO });
ligarEfeitos(efeitos);

const areaJogo = document.getElementById("area-jogo");
const tela = document.getElementById("tela");
const palco = document.getElementById("palco");
const barra = document.getElementById("barra");
const cena = document.getElementById("cena");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const placar = document.getElementById("placar");
const anuncio = document.getElementById("anuncio");
const dialogo = document.getElementById("dialogo");
const sobreposicao = document.getElementById("sobreposicao");
const creditos = document.getElementById("creditos");

/* ---------- Progresso salvo ---------- */

function carregarProgresso() {
  try {
    return { som: true, ...JSON.parse(localStorage.getItem(CHAVE_PROGRESSO)) };
  } catch {
    return { som: true };
  }
}

const progresso = carregarProgresso();

function salvarProgresso() {
  try { localStorage.setItem(CHAVE_PROGRESSO, JSON.stringify(progresso)); } catch { /* armazenamento indisponível */ }
}

/* ---------- Estado ---------- */

let fases = [];
let personagens = [];

const jogo = {
  estado: "inicio",
  heroi: null,
  fase: 0,
  vencidas: [],
  tempo: 0,
  aoTerminarAnuncio: null,
  meioFeito: false,
  conversa: null,
  pausadoEm: null,
};

const faseAtual = () => fases[jogo.fase];

/* ---------- Telas fora da arena ---------- */

function mostrarTela() {
  palco.hidden = true;
  tela.hidden = false;
  atualizarBotoesDaBarra();
}

function mostrarPalco() {
  tela.hidden = true;
  palco.hidden = false;
  atualizarBotoesDaBarra();
}

function telaInicio() {
  jogo.estado = "inicio";
  mostrarTela();
  atualizarBotoesDaBarra();
  tela.replaceChildren(
    el("div", { class: "ddd-inicio" },
      el("h2", { class: "ddd-inicio__titulo pixel" }, "DEFENSORES", el("span", { text: "DA DEMOCRACIA" })),
      el("p", { class: "ddd-inicio__lide", text: "Mentira no grupo da família, direito ameaçado, folga que nunca chega. As ameaças à democracia viraram monstros, e quem sai para enfrentá-los é gente comum." }),
      el("ul", { class: "ddd-herois", "aria-label": "Personagens" },
        ...personagens.map((p, i) => el("li", { class: `ddd-herois__moldura ddd-herois__moldura--${i % 2 ? "amarela" : "verde"}`, title: p.nome }, rostoDoHeroi(p.id)))),
      el("p", { class: "ddd-inicio__lide", text: `Escolha entre ${personagens.length} trabalhadores e estudantes, vença ${fases.length} lutas e descubra, a cada vitória, o que aconteceu de verdade nesta eleição.` }),
      el("p", { class: "ddd-inicio__girar ddd-so-toque" },
        el("span", { class: "ddd-inicio__girar-icone", "aria-hidden": "true", text: "⟳" }),
        "Para uma melhor experiência, vire o celular na horizontal."),
      el("button", { class: "botao", type: "button", onclick: telaEscolha, disabled: fases.length && personagens.length ? null : "" }, "Jogar"),
      comandos(),
      el("p", { class: "ddd-inicio__aviso", text: "Os vilões são ideias, não pessoas. Os fatos que aparecem depois de cada luta têm data e fonte." }))
  );
}

const COMANDOS_TECLADO = [
  [["◀", "▶"], ["A", "D"], "Andar"], [["▲"], ["W"], "Pular"], [["▼"], ["S"], "Defender"],
  [["Z"], ["J"], "Soco"], [["X"], ["K"], "Chute"], [["C"], ["L"], "Especial"],
];

function comandos() {
  const tecla = (texto) => el("kbd", { class: "ddd-tecla-pc pixel", text: texto });
  const copiaDoBotao = (acao) => {
    const original = document.querySelector(`[data-acao="${acao}"]`);
    const copia = el("span", { class: `${original.className} ddd-golpe--mini`, "aria-hidden": "true" });
    copia.innerHTML = original.innerHTML;
    return copia;
  };
  const rotulado = (botao, rotulo, posicao) => el("span", { class: `ddd-comandos__item ddd-comandos__item--${posicao}` }, botao, el("span", { text: rotulo }));
  const copiaDoDirecional = () => {
    const copia = el("span", { class: "ddd-direcional ddd-direcional--mini", "aria-hidden": "true" });
    copia.innerHTML = document.querySelector(".ddd-controles .ddd-direcional").innerHTML;
    return copia;
  };
  return el("section", { class: "ddd-comandos", "aria-label": "Como jogar" },
    el("h3", { class: "ddd-comandos__titulo pixel", text: "Como jogar" }),
    el("table", { class: "ddd-comandos__tabela ddd-so-teclado" },
      el("thead", {}, el("tr", {}, el("th", { text: "" }), el("th", { text: "Setas + Z X C" }), el("th", { text: "W A S D + J K L" }))),
      el("tbody", {}, ...COMANDOS_TECLADO.map(([setas, letras, rotulo]) => el("tr", {},
        el("th", { scope: "row", text: rotulo }),
        el("td", {}, ...setas.map(tecla)),
        el("td", {}, ...letras.map(tecla)))))),
    el("p", { class: "ddd-comandos__nota ddd-so-teclado", text: "Esc pausa o jogo." }),
    el("div", { class: "ddd-comandos__toque ddd-so-toque" },
      el("div", { class: "ddd-comandos__direcional" },
        el("span", { class: "ddd-comandos__rotulo ddd-comandos__rotulo--cima", text: "Pular" }),
        el("span", { class: "ddd-comandos__rotulo ddd-comandos__rotulo--esquerda", text: "Andar" }),
        copiaDoDirecional(),
        el("span", { class: "ddd-comandos__rotulo ddd-comandos__rotulo--direita", text: "Andar" }),
        el("span", { class: "ddd-comandos__rotulo ddd-comandos__rotulo--baixo", text: "Defender" })),
      el("div", { class: "ddd-comandos__acoes" },
        rotulado(copiaDoBotao("especial"), "Especial", "especial"),
        rotulado(copiaDoBotao("pular"), "Pular", "pulo"),
        rotulado(copiaDoBotao("soco"), "Soco", "soco"), rotulado(copiaDoBotao("chute"), "Chute", "chute"))),
    el("p", { class: "ddd-comandos__nota", text: "Pule duas vezes seguidas para dar o pulo duplo. O especial gasta meia barra de energia, que enche quando você acerta golpes." }));
}

function atributo(rotulo, valor, maximo) {
  return el("span", { class: "ddd-atributo" },
    el("span", { text: rotulo }),
    el("i", { "aria-hidden": "true" }, el("b", { style: `width:${Math.round(Math.min(1, valor / maximo) * 100)}%` })));
}

function rostoDoHeroi(id) {
  const imagem = el("canvas", { width: "26", height: "26", "aria-hidden": "true" });
  retrato(imagem, { heroi: id, recorte: recorteDoRosto(id) });
  return imagem;
}

function corpoDoHeroi(id, largura, altura) {
  const imagem = el("canvas", { width: String(largura), height: String(altura), "aria-hidden": "true" });
  retrato(imagem, { heroi: id, recorte: RECORTE_CORPO });
  return imagem;
}

function telaEscolha() {
  jogo.estado = "escolha";
  iniciarSom(progresso.som);
  efeitos.escolha();
  mostrarTela();
  const ficha = el("div", { "aria-live": "polite" });
  const cards = personagens.map((p) => el("button", {
    class: "ddd-card", type: "button", "aria-pressed": "false",
    onclick: (evento) => {
      cards.forEach((card) => card.setAttribute("aria-pressed", String(card === evento.currentTarget)));
      efeitos.escolha();
      mostrarFicha(ficha, p);
    },
  }, corpoDoHeroi(p.id, 32, 56), el("span", {},
    el("span", { class: "ddd-card__nome pixel", text: p.nome }),
    el("span", { class: "ddd-card__profissao", text: p.profissao }))));
  tela.replaceChildren(
    el("div", { class: "ddd-escolha" },
      el("h2", { class: "ddd-escolha__titulo pixel", text: "Escolha quem vai defender a democracia" }),
      el("div", { class: "ddd-elenco" }, ...cards),
      ficha)
  );
  cards[0]?.focus({ preventScroll: true });
}

function mostrarFicha(alvo, p) {
  const lutar = el("button", { class: "botao", type: "button", onclick: () => comecarCampanha(p) }, `Lutar com ${p.nome}`);
  alvo.replaceChildren(
    el("article", { class: "ddd-ficha", "aria-label": p.nome },
      corpoDoHeroi(p.id, 32, 56),
      el("div", { class: "ddd-ficha__texto" },
        el("h3", { class: "pixel", text: p.nome }),
        el("p", { class: "ddd-ficha__profissao", text: p.profissao }),
        el("p", { class: "ddd-ficha__historia", text: p.historia })),
      el("div", { class: "ddd-ficha__dados" },
        el("div", { class: "ddd-atributos" },
          atributo("Vida", p.vida, 110), atributo("Velocidade", p.velocidade, 1.3), atributo("Força", p.forca, 1.15)),
        el("p", { class: "ddd-ficha__especial pixel", text: `★ ${p.especial.nome}` }),
        pontosFortes(p)),
      el("div", { class: "ddd-ficha__acoes" }, lutar))
  );
  alvo.scrollIntoView({ block: "nearest", behavior: MOVIMENTO_REDUZIDO ? "auto" : "smooth" });
  lutar.focus({ preventScroll: true });
}

function pontosFortes(p) {
  const nomes = p.pontosFortes.map((id) => fases.find((f) => f.id === id)?.nome).filter(Boolean);
  if (!nomes.length) return null;
  return el("p", { class: "ddd-ficha__forte" },
    el("strong", { text: `Ponto forte: contra ${listaComE(nomes)}. ` }),
    "Nessas lutas, a energia do especial enche mais rápido e os ataques de longe do vilão machucam menos.");
}

const listaComE = (nomes) => (nomes.length > 1 ? `${nomes.slice(0, -1).join(", ")} e ${nomes.at(-1)}` : nomes[0]);

function comecarCampanha(heroi) {
  registrarAcao("inicio");
  jogo.heroi = heroi;
  jogo.fase = 0;
  jogo.vencidas = [];
  tocarMusica();
  areaJogo.scrollIntoView({ block: "start", behavior: MOVIMENTO_REDUZIDO ? "auto" : "smooth" });
  mostrarPalco();
  apresentarFase();
}

/* ---------- Cartões sobre a arena ---------- */

function abrirCartao({ rotulo, titulo, alerta = false, conteudo = [], botoes }) {
  const acoes = botoes.map(([texto, acao, fantasma]) =>
    el("button", { class: fantasma ? "botao botao--fantasma" : "botao", type: "button", onclick: acao }, texto));
  sobreposicao.replaceChildren(
    el("article", { class: "ddd-cartao", role: "dialog", "aria-modal": "true", "aria-label": titulo },
      rotulo && el("p", { class: "ddd-cartao__rotulo pixel", text: rotulo }),
      el("h2", { class: `ddd-cartao__titulo pixel${alerta ? " ddd-cartao__titulo--alerta" : ""}`, text: titulo }),
      ...conteudo,
      el("div", { class: "ddd-cartao__acoes" }, ...acoes))
  );
  sobreposicao.hidden = false;
  sobreposicao.scrollTop = 0;
  acoes[0].focus({ preventScroll: true });
}

function fecharCartao() {
  sobreposicao.hidden = true;
  sobreposicao.replaceChildren();
  canvas.focus({ preventScroll: true });
}

/** Trilha de cada fase; a da Sombra é a do chefão. */
const MUSICA_DA_FASE = { "fake-news": "luta", desanimo: "preguica", retrocesso: "antiga", escala: "relogio", desmonte: "chefe" };

function apresentarFase() {
  const fase = faseAtual();
  novaLuta(jogo.heroi, fase);
  jogo.meioFeito = false;
  jogo.estado = "cartao";
  placar.hidden = true;
  atualizarBarra();
  const chefao = jogo.fase === fases.length - 1;
  tocarMusica(MUSICA_DA_FASE[fase.id] || "luta");
  const rosto = el("canvas", { width: "36", height: "36", "aria-hidden": "true" });
  retrato(rosto, { vilaoId: fase.id, recorte: recorteDoRosto(null, fase.id) });
  const comecar = () => {
    fecharCartao();
    iniciarAnuncio(chefao ? "CHEFÃO FINAL" : `FASE ${jogo.fase + 1}`, `${jogo.heroi.curto} VS ${fase.curto}`, 150, () => conversar(roteiro("inicio"), prontoParaLutar), chefao);
    if (chefao) efeitos.alerta();
  };
  abrirCartao({
    rotulo: chefao ? "Alerta: chefão final" : `Fase ${jogo.fase + 1} de ${fases.length}`,
    alerta: chefao,
    titulo: fase.nome,
    conteudo: [el("div", { class: "ddd-cartao__vilao" }, rosto, el("p", { text: fase.apresentacao }))],
    botoes: [["Lutar", comecar]],
  });
}

function prontoParaLutar() {
  iniciarAnuncio("LUTE!", "", 70, () => {
    soltarTudo();
    jogo.estado = "luta";
    falar(estadoDaLuta().vilao, faseAtual().gritos[0]);
  });
  efeitos.escolha();
}

function blocoVidaReal(fase) {
  const bloco = el("div", { class: "ddd-vida-real" },
    el("p", { class: "ddd-vida-real__rotulo pixel", text: "Na vida real" }),
    el("p", { text: fase.vidaReal }));
  renderFontes(bloco, fase.fontes);
  return bloco;
}

function mostrarVidaReal() {
  const fase = faseAtual();
  const ultima = jogo.fase === fases.length - 1;
  jogo.estado = "cartao";
  placar.hidden = true;
  jogo.vencidas.push(fase);
  abrirCartao({
    rotulo: `Fase ${jogo.fase + 1} vencida`,
    titulo: `${fase.nome} ${fase.nome.startsWith("O ") ? "foi derrotado" : "foi derrotada"}`,
    conteudo: [blocoVidaReal(fase)],
    botoes: [[ultima ? "Ver o final" : "Próxima fase", () => {
      fecharCartao();
      if (ultima) mostrarCreditos();
      else { jogo.fase++; apresentarFase(); }
    }]],
  });
}

function dicaDePersonagem(fase) {
  if (jogo.heroi.pontosFortes.includes(fase.id)) return null;
  const nomes = personagens.filter((p) => p.pontosFortes.includes(fase.id)).map((p) => p.nome);
  if (!nomes.length) return null;
  return el("p", { class: "ddd-cartao__dica" }, el("strong", { text: "Dica: " }), `${listaComE(nomes)} ${nomes.length > 1 ? "se dão" : "se dá"} bem contra ${fase.nome}.`);
}

function mostrarDerrota() {
  const fase = faseAtual();
  jogo.estado = "cartao";
  placar.hidden = true;
  efeitos.derrota();
  abrirCartao({
    titulo: "Você caiu!",
    alerta: true,
    conteudo: [
      el("p", { class: "ddd-cartao__fala", text: `${fase.nome}: "${fase.provocacao}"` }),
      el("p", { text: ANIMO[Math.floor(Math.random() * ANIMO.length)] }),
      dicaDePersonagem(fase),
    ],
    botoes: [
      ["Tentar de novo", () => { fecharCartao(); apresentarFase(); }],
      ["Trocar personagem", () => { fecharCartao(); telaEscolha(); }, true],
    ],
  });
}

function pausar() {
  if (!["luta", "pronto", "anuncio", "dialogo"].includes(jogo.estado)) return;
  jogo.pausadoEm = jogo.estado;
  jogo.estado = "pausa";
  soltarTudo();
  abrirCartao({
    titulo: "Pausa",
    conteudo: [el("p", { text: "A democracia espera por você." })],
    botoes: [["Continuar", retomar], ["Sair da luta", () => { fecharCartao(); sairDaLuta(); }, true]],
  });
}

function retomar() {
  if (jogo.estado !== "pausa") return;
  jogo.estado = jogo.pausadoEm;
  fecharCartao();
}

function sairDaLuta() {
  jogo.conversa = null;
  palco.classList.remove("ddd-palco--dialogo");
  dialogo.hidden = true;
  anuncio.hidden = true;
  telaEscolha();
}

/* ---------- Anúncios e diálogos ---------- */

function iniciarAnuncio(grande, sub, quadros, depois, alerta = false) {
  jogo.estado = "anuncio";
  jogo.tempo = quadros;
  jogo.aoTerminarAnuncio = depois;
  placar.hidden = false;
  anuncio.classList.toggle("ddd-anuncio--alerta", alerta);
  anuncio.replaceChildren(
    el("div", { class: "ddd-anuncio__grande", text: grande }),
    sub && el("div", { class: "ddd-anuncio__sub", text: sub }));
  anuncio.hidden = false;
}

/**
 * Monta as falas de um momento da luta: o vilão abre, o herói responde com a fala da sua história
 * e, no início, o vilão ainda devolve.
 * @param {"inicio"|"meio"|"fim"} momento
 */
function roteiro(momento) {
  const fase = faseAtual();
  const [primeira, ultima] = fase.dialogos[momento];
  const indice = { inicio: 0, meio: 1, fim: 2 }[momento];
  const falas = [["V", primeira], ["H", fase.falas[jogo.heroi.id][indice]]];
  if (ultima) falas.push(["V", ultima]);
  return falas;
}

function conversar(falas, depois, vilaoFerido = false) {
  jogo.estado = "dialogo";
  jogo.conversa = { falas, indice: 0, mostrado: 0, depois, vilaoFerido };
  palco.classList.add("ddd-palco--dialogo");
  dialogo.hidden = false;
  abrirFala();
}

function abrirFala() {
  const { falas, indice } = jogo.conversa;
  const [quem, texto] = falas[indice];
  const ehHeroi = quem === "H";
  const fase = faseAtual();
  const rosto = el("canvas", { width: ehHeroi ? "26" : "36", height: ehHeroi ? "26" : "36", "aria-hidden": "true" });
  retrato(rosto, ehHeroi
    ? { heroi: jogo.heroi.id, recorte: recorteDoRosto(jogo.heroi.id) }
    : { vilaoId: fase.id, ferido: jogo.conversa.vilaoFerido, recorte: recorteDoRosto(null, fase.id) });
  jogo.conversa.texto = texto;
  jogo.conversa.mostrado = 0;
  jogo.conversa.abertaEm = performance.now();
  jogo.conversa.campo = el("p", { class: "ddd-dialogo__texto" });
  jogo.conversa.seguir = el("p", { class: "ddd-dialogo__seguir pixel", text: "TOQUE AQUI OU ENTER ▶" });
  dialogo.replaceChildren(rosto, el("div", {},
    el("p", { class: `ddd-dialogo__nome pixel ddd-dialogo__nome--${ehHeroi ? "heroi" : "vilao"}`, text: ehHeroi ? jogo.heroi.nome : fase.nome }),
    jogo.conversa.campo, jogo.conversa.seguir));
  dialogo.setAttribute("aria-label", `${ehHeroi ? jogo.heroi.nome : fase.nome}: ${texto}`);
}

function avancarConversa() {
  const c = jogo.conversa;
  if (!c || performance.now() - c.abertaEm < 400) return;
  if (c.mostrado < c.texto.length) {
    c.mostrado = c.texto.length;
    return;
  }
  c.indice++;
  if (c.indice < c.falas.length) { abrirFala(); return; }
  jogo.conversa = null;
  dialogo.hidden = true;
  palco.classList.remove("ddd-palco--dialogo");
  c.depois();
}

function passoConversa() {
  const c = jogo.conversa;
  if (!c) return;
  if (c.mostrado < c.texto.length) {
    c.mostrado = Math.min(c.texto.length, c.mostrado + 0.9);
    if (Math.floor(c.mostrado) % 5 === 0) efeitos.letra();
  }
  c.campo.textContent = c.texto.slice(0, Math.floor(c.mostrado));
  c.seguir.classList.toggle("ddd-dialogo__seguir--ativo", c.mostrado >= c.texto.length);
}

/* ---------- Fim ---------- */

function mostrarCreditos() {
  jogo.estado = "creditos";
  placar.hidden = true;
  palco.classList.add("ddd-palco--creditos");
  iniciarFesta();
  efeitos.euforia();
  tocarMusica("festa");
  const rolo = el("div", { class: "ddd-creditos__rolo" },
    el("p", { class: "ddd-creditos__titulo pixel", text: "A democracia venceu!" }),
    el("p", { class: "ddd-creditos__texto", text: `${jogo.heroi.nome} derrotou a Fake News, o Desânimo, o Retrocesso, o Relógio e a Sombra.` }),
    ...jogo.vencidas.flatMap((fase) => [
      el("p", { class: "ddd-creditos__fase pixel", text: fase.nome }),
      el("p", { class: "ddd-creditos__texto", text: fase.vidaReal }),
    ]),
    el("p", { class: "ddd-creditos__texto", text: "Na vida real, a luta é sem soco: é com voto, informação checada e participação." }),
    el("p", { class: "ddd-creditos__final pixel", text: "O fim dessa história quem escreve é você. 25 de outubro: vote Lula, 13." }));
  const acoes = el("div", { class: "ddd-creditos__acoes", hidden: true },
    el("button", { class: "botao", type: "button", onclick: () => sairDosCreditos(terminarJogo) }, "Fontes e compartilhar"),
    el("button", { class: "botao botao--fantasma", type: "button", onclick: () => sairDosCreditos(telaEscolha) }, "Jogar de novo"));
  const pular = el("button", { class: "ddd-botao pixel ddd-creditos__pular", type: "button", onclick: () => { posicao = parar(); } }, "PULAR ▶");
  creditos.replaceChildren(rolo, acoes, pular);
  creditos.hidden = false;
  const final = rolo.lastElementChild;
  const parar = () => creditos.clientHeight / 2 - (final.offsetTop + final.offsetHeight / 2);
  let posicao = creditos.clientHeight;
  let anterior = performance.now();
  const rolar = (agora) => {
    if (jogo.estado !== "creditos") return;
    posicao = Math.max(parar(), posicao - ((agora - anterior) / 1000) * 34);
    anterior = agora;
    rolo.style.transform = `translateY(${Math.round(posicao)}px)`;
    if (posicao > parar()) { requestAnimationFrame(rolar); return; }
    pular.remove();
    acoes.hidden = false;
    acoes.querySelector("button").focus({ preventScroll: true });
  };
  requestAnimationFrame(rolar);
}

function sairDosCreditos(depois) {
  pararMusica();
  creditos.hidden = true;
  creditos.replaceChildren();
  palco.classList.remove("ddd-palco--creditos");
  depois();
}

function terminarJogo() {
  jogo.estado = "fim";
  mostrarTela();
  const resultado = mostrarResultado({
    alvo: tela,
    titulo: "A democracia venceu!",
    texto: `${jogo.heroi.nome} derrotou a Fake News, o Desânimo, o Retrocesso, o Relógio e a Sombra. Na vida real, a luta é sem soco: é com voto, informação checada e participação.`,
    fontes: jogo.vencidas.flatMap((fase) => fase.fontes),
    textoCompartilhar: "Derrotei a Fake News, o Desânimo, o Retrocesso, o Relógio e a Sombra em Defensores da Democracia. Na vida real, a luta é no voto:",
    aoJogarDeNovo: telaEscolha,
  });
  if (emTelaCheia()) {
    const sair = el("button", { class: "botao botao--fantasma", type: "button", onclick: async () => { await alternarTelaCheia(); sair.remove(); } }, "Sair da tela cheia");
    resultado.querySelector(".resultado__acoes").append(sair);
  }
  resultado.querySelector(".resultado__texto").after(
    el("p", { class: "ddd-esperanca pixel", text: "O fim dessa história quem escreve é você. 25 de outubro: vote Lula, 13." }));
  resultado.querySelector(".resultado__acoes").after(
    el("section", { class: "ddd-resumo", "aria-label": "Na vida real" },
      el("p", { class: "ddd-vida-real__rotulo pixel", text: "Na vida real" }),
      el("dl", {}, ...jogo.vencidas.flatMap((fase) => [el("dt", { text: fase.nome }), el("dd", { text: fase.vidaReal })]))));
}

/* ---------- Barra e placar ---------- */

const campos = {};

function montarBarra() {
  barra.replaceChildren(
    campos.fase = el("p", { class: "ddd-barra__fase pixel" }),
    el("div", { class: "ddd-barra__botoes" },
      campos.inicio = el("button", { class: "ddd-botao pixel", type: "button", "aria-label": "Voltar ao início do jogo", onclick: voltarAoInicio }, "INÍCIO"),
      campos.som = botaoSom(), campos.telaCheia = botaoTelaCheia(),
      campos.pausa = el("button", {
        class: "ddd-botao pixel", type: "button", "aria-label": "Pausar", onclick: () => (jogo.estado === "pausa" ? retomar() : pausar()),
      }, "PAUSA")));
  const lado = (classe, chave) => el("div", { class: `ddd-placar__lado ddd-placar__lado--${classe}` },
    el("div", { class: "ddd-vida" }, campos[`rastro-${chave}`] = el("b"), campos[`vida-${chave}`] = el("i")),
    campos[`nome-${chave}`] = el("div", { class: "ddd-placar__nome" }),
    chave === "heroi" && (campos.energia = el("div", { class: "ddd-energia" }, campos.nivel = el("i"))));
  placar.replaceChildren(lado("heroi", "heroi"), campos.placarFase = el("div", { class: "ddd-placar__fase" }), lado("vilao", "vilao"));
}

function atualizarBotoesDaBarra() {
  if (!campos.inicio) return;
  const naCapa = jogo.estado === "inicio";
  barra.hidden = naCapa;
  campos.inicio.hidden = naCapa;
  campos.telaCheia.hidden = naCapa;
  campos.som.hidden = palco.hidden;
  campos.pausa.hidden = palco.hidden;
  campos.fase.hidden = palco.hidden;
}

/** Sai de qualquer ponto do jogo e volta para a capa. */
function voltarAoInicio() {
  jogo.conversa = null;
  creditos.hidden = true;
  creditos.replaceChildren();
  sobreposicao.hidden = true;
  sobreposicao.replaceChildren();
  dialogo.hidden = true;
  anuncio.hidden = true;
  palco.classList.remove("ddd-palco--dialogo", "ddd-palco--creditos");
  soltarTudo();
  pararMusica();
  telaInicio();
}

const rastro = { heroi: 100, vilao: 100 };

function atualizarBarra() {
  const fase = faseAtual();
  campos.fase.textContent = `Fase ${jogo.fase + 1}/${fases.length} · ${fase.nome}`;
  campos.placarFase.textContent = `${jogo.fase + 1}/${fases.length}`;
  campos["nome-heroi"].textContent = jogo.heroi.curto;
  campos["nome-vilao"].textContent = fase.curto;
  rastro.heroi = 100;
  rastro.vilao = 100;
}

function atualizarPlacar() {
  if (placar.hidden || !campos.nivel) return;
  const { heroi, vilao, semEnergia } = estadoDaLuta();
  for (const [chave, f] of [["heroi", heroi], ["vilao", vilao]]) {
    const vida = (f.vida / f.vidaMaxima) * 100;
    rastro[chave] = rastro[chave] > vida ? Math.max(vida, rastro[chave] - 0.5) : vida;
    campos[`vida-${chave}`].style.width = `${vida}%`;
    campos[`rastro-${chave}`].style.width = `${rastro[chave]}%`;
  }
  campos.nivel.style.width = `${heroi.energia}%`;
  const pronto = heroi.energia >= 50;
  campos.energia.classList.toggle("ddd-energia--cheia", pronto);
  campos.energia.classList.toggle("ddd-energia--vazia", semEnergia > 0);
  document.querySelector(".ddd-golpe--especial")?.classList.toggle("ddd-pronto", pronto);
}

function botaoSom() {
  const rotulo = () => (progresso.som ? "♪ SOM" : "♪ MUDO");
  const botao = el("button", {
    class: "ddd-botao pixel", type: "button", "aria-pressed": String(progresso.som), "aria-label": "Som",
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

/* ---------- Tela cheia, celular deitado e câmera ---------- */

const CELULAR_EM_PE = matchMedia("(orientation: portrait) and (max-width: 600px)");

/* Em celular de pé a arena mostra só 240 px de largura, com a câmera seguindo a luta, para os lutadores ficarem maiores. */
function ajustarArena() {
  const largura = CELULAR_EM_PE.matches ? 240 : 320;
  if (canvas.width === largura) return;
  canvas.width = largura;
  ctx.imageSmoothingEnabled = false;
  cena.style.setProperty("--proporcao", String(largura / 180));
}

const CELULAR_DEITADO = matchMedia("(orientation: landscape) and (max-height: 520px) and (pointer: coarse)");
const emTelaCheia = () => Boolean(document.fullscreenElement || document.webkitFullscreenElement || areaJogo.classList.contains("ddd-imersivo"));

function atualizarModoDeTela() {
  areaJogo.classList.toggle("ddd-cheio", emTelaCheia());
  areaJogo.classList.toggle("ddd-deitado", CELULAR_DEITADO.matches);
  document.querySelectorAll("[data-tela-cheia]").forEach((botao) => {
    botao.textContent = emTelaCheia() ? "SAIR" : "TELA CHEIA";
    botao.setAttribute("aria-label", emTelaCheia() ? "Sair da tela cheia" : "Tela cheia");
  });
}

async function alternarTelaCheia() {
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    await (document.exitFullscreen?.() ?? document.webkitExitFullscreen?.());
  } else if (areaJogo.classList.contains("ddd-imersivo")) {
    areaJogo.classList.remove("ddd-imersivo");
  } else {
    const pedir = areaJogo.requestFullscreen?.bind(areaJogo) ?? areaJogo.webkitRequestFullscreen?.bind(areaJogo);
    try {
      if (!pedir) throw new Error("sem tela cheia");
      await pedir();
    } catch {
      areaJogo.classList.add("ddd-imersivo");
    }
  }
  atualizarModoDeTela();
  if (!palco.hidden) canvas.focus({ preventScroll: true });
}

function botaoTelaCheia() {
  return el("button", {
    class: "ddd-botao pixel", type: "button", "data-tela-cheia": "",
    "aria-label": emTelaCheia() ? "Sair da tela cheia" : "Tela cheia", onclick: alternarTelaCheia,
  }, emTelaCheia() ? "SAIR" : "TELA CHEIA");
}

/* ---------- Controles ---------- */

const MANTIDAS = ["esquerda", "direita", "defender"];
const entrada = { esquerda: false, direita: false, defender: false, pular: 0, soco: 0, chute: 0, especial: 0 };
const TECLAS = {
  ArrowLeft: "esquerda", KeyA: "esquerda", ArrowRight: "direita", KeyD: "direita",
  ArrowUp: "pular", KeyW: "pular", Space: "pular", ArrowDown: "defender", KeyS: "defender",
  KeyJ: "soco", KeyZ: "soco", KeyK: "chute", KeyX: "chute", KeyL: "especial", KeyC: "especial",
};

function apertar(acao) {
  if (MANTIDAS.includes(acao)) entrada[acao] = true;
  else entrada[acao] = 8;
}

function soltar(acao) {
  if (MANTIDAS.includes(acao)) entrada[acao] = false;
}

function soltarTudo() {
  for (const chave of Object.keys(entrada)) entrada[chave] = MANTIDAS.includes(chave) ? false : 0;
  document.querySelectorAll(".ativo").forEach((botao) => botao.classList.remove("ativo"));
}

function entradaDoJogador() {
  return {
    esquerda: entrada.esquerda, direita: entrada.direita, defender: entrada.defender,
    pular: entrada.pular > 0, soco: entrada.soco > 0, chute: entrada.chute > 0, especial: entrada.especial > 0,
    consumir: (acao) => { entrada[acao] = 0; },
  };
}

/* Só o próprio diálogo e o Enter passam as falas; os botões de golpe ficam livres para a luta. */
function avancarPorToque() {
  if (jogo.estado === "dialogo") avancarConversa();
}

/*
 * Direcional circular: o manche segue o dedo dentro do círculo e a posição decide a direção,
 * inclusive nas diagonais. Subir pula (uma vez a cada subida); descer defende.
 */
function ligarDirecional() {
  const direcional = document.querySelector(".ddd-direcional");
  const manche = direcional.querySelector(".ddd-manche");
  const setas = Object.fromEntries([...direcional.querySelectorAll("[data-direcao]")].map((seta) => [seta.dataset.direcao, seta]));
  let dedo = null;
  let estavaEmCima = false;
  const aplicar = (evento) => {
    const area = direcional.getBoundingClientRect();
    let dx = ((evento.clientX - area.left) / area.width) * 2 - 1;
    let dy = ((evento.clientY - area.top) / area.height) * 2 - 1;
    const distancia = Math.hypot(dx, dy);
    if (distancia > 1) { dx /= distancia; dy /= distancia; }
    manche.style.transform = `translate(calc(-50% + ${dx * area.width * 0.32}px), calc(-50% + ${dy * area.height * 0.32}px))`;
    const direcoes = { esquerda: dx < -0.35, direita: dx > 0.35, pular: dy < -0.4, defender: dy > 0.4 && Math.abs(dx) <= 0.35 };
    for (const [acao, ativa] of Object.entries(direcoes)) setas[acao].classList.toggle("ativo", ativa);
    if (jogo.estado !== "luta") return;
    entrada.esquerda = direcoes.esquerda;
    entrada.direita = direcoes.direita;
    entrada.defender = direcoes.defender;
    if (direcoes.pular && !estavaEmCima) apertar("pular");
    estavaEmCima = direcoes.pular;
  };
  const soltarDedo = () => {
    dedo = null;
    estavaEmCima = false;
    manche.style.transform = "";
    direcional.classList.remove("ativo");
    Object.values(setas).forEach((seta) => seta.classList.remove("ativo"));
    ["esquerda", "direita", "defender"].forEach(soltar);
  };
  direcional.addEventListener("pointerdown", (evento) => {
    evento.preventDefault();
    dedo = evento.pointerId;
    try { direcional.setPointerCapture(dedo); } catch { /* captura indisponível */ }
    direcional.classList.add("ativo");
    aplicar(evento);
  });
  direcional.addEventListener("pointermove", (evento) => { if (evento.pointerId === dedo) aplicar(evento); });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((tipo) => direcional.addEventListener(tipo, (evento) => { if (evento.pointerId === dedo) soltarDedo(); }));
  direcional.addEventListener("contextmenu", (evento) => evento.preventDefault());
}

function ligarControles() {
  document.addEventListener("keydown", (evento) => {
    if (palco.hidden) return;
    if (evento.code === "Escape" || evento.code === "KeyP") {
      if (jogo.estado === "pausa") retomar();
      else if (sobreposicao.hidden) pausar();
      evento.preventDefault();
      return;
    }
    if (!sobreposicao.hidden) return;
    if (jogo.estado === "dialogo" || jogo.estado === "anuncio") {
      if (evento.code === "Enter") { avancarPorToque(); evento.preventDefault(); }
      return;
    }
    const acao = TECLAS[evento.code];
    if (!acao) return;
    evento.preventDefault();
    if (!evento.repeat) apertar(acao);
  });
  document.addEventListener("keyup", (evento) => {
    const acao = TECLAS[evento.code];
    if (acao) soltar(acao);
  });

  ligarDirecional();
  document.querySelectorAll(".ddd-acoes [data-acao]").forEach((botao) => {
    const acao = botao.dataset.acao;
    botao.addEventListener("pointerdown", (evento) => {
      evento.preventDefault();
      try { botao.setPointerCapture(evento.pointerId); } catch { /* captura indisponível */ }
      botao.classList.add("ativo");
      if (jogo.estado === "luta") apertar(acao);
    });
    const fim = () => { botao.classList.remove("ativo"); soltar(acao); };
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((tipo) => botao.addEventListener(tipo, fim));
    botao.addEventListener("contextmenu", (evento) => evento.preventDefault());
  });

  dialogo.addEventListener("click", avancarPorToque);
  window.addEventListener("blur", soltarTudo);
  document.addEventListener("visibilitychange", () => { if (document.hidden) pausar(); });
  document.addEventListener("fullscreenchange", atualizarModoDeTela);
  document.addEventListener("webkitfullscreenchange", atualizarModoDeTela);
  CELULAR_DEITADO.addEventListener?.("change", atualizarModoDeTela);
  CELULAR_EM_PE.addEventListener?.("change", ajustarArena);
  atualizarModoDeTela();
  ajustarArena();
}

/* ---------- Laço principal ---------- */

function passo() {
  for (const acao of ["pular", "soco", "chute", "especial"]) if (entrada[acao] > 0) entrada[acao]--;
  switch (jogo.estado) {
    case "anuncio":
      passoParado();
      if (--jogo.tempo <= 0) {
        anuncio.hidden = true;
        const depois = jogo.aoTerminarAnuncio;
        jogo.aoTerminarAnuncio = null;
        depois?.();
      }
      break;
    case "dialogo":
      passoConversa();
      passoParado();
      break;
    case "luta": {
      const resultado = passoLuta(entradaDoJogador());
      if (resultado) nocaute(resultado === "vitoria");
      else if (!jogo.meioFeito && metadeDaVida()) {
        jogo.meioFeito = true;
        enfurecer();
        conversar(roteiro("meio"), () => iniciarAnuncio("FÚRIA!", `${faseAtual().curto} FICOU MAIS RÁPIDO`, 70, () => { soltarTudo(); jogo.estado = "luta"; }));
      }
      break;
    }
    case "nocaute":
      passoNocaute();
      if (--jogo.tempo <= 0) depoisDoNocaute();
      break;
    case "cartao":
    case "creditos":
      passoParado();
      break;
    default:
  }
}

function nocaute(venceu) {
  jogo.estado = "nocaute";
  jogo.tempo = 110;
  jogo.venceu = venceu;
  efeitos.nocaute();
  anuncio.replaceChildren(
    el("div", { class: "ddd-anuncio__grande", text: venceu ? "K.O.!" : "NOCAUTE" }),
    venceu && el("div", { class: "ddd-anuncio__sub", text: "A DEMOCRACIA RESISTE!" }));
  anuncio.hidden = false;
}

function depoisDoNocaute() {
  anuncio.hidden = true;
  const { heroi, vilao } = estadoDaLuta();
  if (jogo.venceu) {
    comemorar(heroi);
    efeitos.vitoria();
    conversar(roteiro("fim"), mostrarVidaReal, true);
  } else {
    comemorar(vilao);
    mostrarDerrota();
  }
}

let ultimo = performance.now();
let acumulado = 0;

function quadro(agora) {
  acumulado += Math.min(250, agora - ultimo);
  ultimo = agora;
  if (!palco.hidden) {
    while (acumulado >= PASSO) {
      if (jogo.estado !== "pausa") passo();
      acumulado -= PASSO;
    }
    if (estadoDaLuta().heroi) desenharLuta(ctx, canvas.width);
    atualizarPlacar();
  } else {
    acumulado = 0;
  }
  requestAnimationFrame(quadro);
}

async function iniciar() {
  ligarControles();
  try {
    [fases, personagens] = await Promise.all([carregarConteudo("fases.json"), carregarConteudo("personagens.json")]);
  } catch {
    tela.replaceChildren(el("p", { class: "ddd-inicio__dica", text: "Não foi possível carregar o jogo. Recarregue a página." }));
    return;
  }
  ctx.imageSmoothingEnabled = false;
  montarBarra();
  telaInicio();
  requestAnimationFrame(quadro);
}

iniciar();
