/**
 * Bora Ver o Plano — exploração dos bairros com as propostas do plano de governo.
 * Especificação: docs/jogos/bora-ver-o-plano/SPEC.md
 */

import kaplay from "https://unpkg.com/kaplay@3001.0.19/dist/kaplay.mjs";
import {
  el, montarMoldura, carregarConteudo, renderFontes, mostrarResultado, registrarAcao, compartilhar,
} from "../../assets/js/moldura.js";
import { FASES, LARGURA_BLOCO, SOLIDOS, PORTAS, lerMarcadores } from "./fases.js";
import * as arte from "./sprites.js";
import {
  carregarProgresso, salvarProgresso, apagarProgresso, faseConcluida, ultimaFaseLiberada,
} from "./estado.js";
import { definirSom, tocar, tocarMusica, pararMusica, tocarVitoria } from "./som.js";

const TITULO = "Bora Ver o Plano";
const VELOCIDADE = 72;
const ALCANCE_CONVERSA = 24;
const VISAO = { largura: 160, altura: 120 };
const TENTATIVAS_ATE_AJUDA = 2;
const ALCANCE_ESCONDIDO = 10;
const TOLERANCIA_ALINHAMENTO = 7;
const PASSO_MAXIMO = 2;
const CAIXA_JOGADORA = { x: 5, y: 10, largura: 6, altura: 6 };
const CORES_DE_PESSOAS = 5;
const COR_DA_GUIA = 4;

const tela = document.getElementById("tela");
const palco = document.getElementById("palco");
const hud = document.getElementById("hud");
const sobreposicao = document.getElementById("sobreposicao");
const canvas = document.getElementById("canvas");

const entrada = { cima: false, baixo: false, esquerda: false, direita: false };
let progresso = carregarProgresso();
let conteudo = null;
let k = null;
let faseAtual = null;
let fecharSobreposicao = null;
let abertaEm = 0;
let interagirNaCena = () => {};
let imagemCidade = null;
let moverNoMapa = () => {};
let confirmarNoMapa = () => {};
let portasTrancadasEm = null;

montarMoldura({ id: "bora-ver-o-plano", titulo: TITULO });
iniciar();

async function iniciar() {
  try {
    const [propostas, objetos] = await Promise.all([
      carregarConteudo("propostas.json"),
      carregarConteudo("objetos.json"),
    ]);
    conteudo = {
      propostasDa: (id) => propostas.filter((item) => item.fase === id),
      objetoDa: (id) => objetos.find((item) => item.fase === id) ?? null,
    };
  } catch (erro) {
    console.error(erro);
    tela.replaceChildren(el("p", { text: "Não foi possível carregar o jogo. Tente recarregar a página." }));
    return;
  }
  ligarControles();
  telaInicio();
}

/* ---------- Telas em HTML ---------- */

function mostrarTela() {
  palco.hidden = true;
  tela.hidden = false;
  tela.dataset.modo = "";
  fecharSobreposicaoAtual();
  if (k) k.go("parado");
}

/** Apaga todo o progresso (só a preferência de som fica) e volta à escolha da personagem. */
function recomecar() {
  const { som } = progresso;
  apagarProgresso();
  progresso = { ...carregarProgresso(), som };
  faseAtual = null;
  portasTrancadasEm = null;
  salvarProgresso(progresso);
  telaInicio();
}

function telaInicio() {
  mostrarTela();
  window.scrollTo({ top: 0 });
  let escolhida = progresso.jogadora ?? "cidada";
  const temProgresso = progresso.propostas.length > 0 || progresso.objetos.length > 0;

  const opcoes = Object.entries(arte.JOGADORAS).map(([id, dados]) => {
    const botao = el("button", {
      class: "bvp-escolha", type: "button", "aria-pressed": String(id === escolhida),
      onclick: () => {
        escolhida = id;
        opcoesEl.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === botao)));
      },
    },
      el("img", { src: arte.imagemJogadoraParada(id, 4), alt: "", width: 64, height: 64 }),
      el("span", { text: dados.nome }));
    return botao;
  });
  const opcoesEl = el("div", { class: "bvp-escolhas", role: "group", "aria-label": "Escolha a personagem" }, opcoes);

  const comecar = () => {
    progresso.jogadora = escolhida;
    salvarProgresso(progresso);
    definirSom(progresso.som);
    tocarMusica();
    registrarAcao("inicio");
    telaMapa();
  };

  tela.replaceChildren(
    el("div", { class: "bvp-inicio" },
      el("p", { class: "bvp-logo pixel" }, "BORA VER", el("br"), el("span", {}, "O PLANO")),
      el("p", { text: "Converse com quem mora em cada bairro, descubra as propostas do plano de governo de Lula e ache o objeto perdido." }),
      el("dl", { class: "bvp-teclas bvp-teclas--computador", "aria-label": "Controles no computador" },
        el("dt", {}, el("kbd", {}, "↑ ↓ ← →")), el("dd", {}, "andar"),
        el("dt", {}, el("kbd", {}, "Espaço")), el("dd", {}, "falar, entrar e interagir"),
        el("dt", {}, el("kbd", {}, "Esc")), el("dd", {}, "menu")),
      el("dl", { class: "bvp-teclas bvp-teclas--toque", "aria-label": "Controles no celular" },
        el("dt", {}, el("kbd", {}, "✚")), el("dd", {}, "andar com o direcional"),
        el("dt", {}, el("kbd", {}, "L")), el("dd", {}, "falar, entrar e interagir"),
        el("dt", {}, el("kbd", {}, "MENU")), el("dd", {}, "menu, mapa e caderno")),
      el("p", { class: "bvp-aviso", text: "Personagens e histórias fictícias. Propostas e fatos com fonte." }),
      el("p", { class: "bvp-rotulo pixel", text: "Escolha quem vai passear" }),
      opcoesEl,
      el("div", { class: "bvp-acoes" },
        el("button", { class: "botao", type: "button", onclick: comecar }, temProgresso ? "Continuar" : "Jogar"),
        temProgresso && el("button", {
          class: "botao botao--fantasma", type: "button",
          onclick: (evento) => {
            const botao = evento.currentTarget;
            if (botao.dataset.confirmar !== "sim") {
              botao.dataset.confirmar = "sim";
              botao.textContent = "Apagar progresso?";
              return;
            }
            recomecar();
          },
        }, "Recomeçar"))
    )
  );
  tela.querySelector(".botao").focus();
}

function situacaoDa(fase, indice, liberada) {
  const total = conteudo.propostasDa(fase.id).length;
  if (total === 0) return { texto: "EM BREVE", bloqueada: true, zerada: false };
  if (faseConcluida(progresso, fase, conteudo)) return { texto: "ZERADO", bloqueada: false, zerada: true };
  if (indice > liberada) return { texto: "BLOQUEADO", bloqueada: true, zerada: false };
  return { texto: `${contarPropostas(fase)}/${total} propostas`, bloqueada: false, zerada: false };
}

/** Pontos do trajeto entre dois bairros vizinhos, iguais às ruas desenhadas no mapa. */
function trajeto(de, para) {
  const a = FASES[de].naCidade;
  const b = FASES[para].naCidade;
  return de < para ? [a, { x: a.x, y: b.y }, b] : [a, { x: b.x, y: a.y }, b];
}

function telaMapa(selecionada) {
  mostrarTela();
  tocarMusica();
  tela.dataset.modo = "mapa";
  const liberada = ultimaFaseLiberada(progresso, FASES, conteudo);
  const acessivel = (indice) => indice <= liberada && conteudo.propostasDa(FASES[indice].id).length > 0;
  imagemCidade ??= arte.imagemCidade(FASES.map((fase) => ({ ...fase.naCidade, cor: fase.destaque })));
  let posicao = FASES.indexOf(selecionada ?? faseAtual ?? FASES[0]);
  if (!acessivel(posicao)) posicao = 0;
  let andando = false;

  const painel = el("div", { class: "bvp-painel", "aria-live": "polite" });
  const mostrarPainel = (indice) => {
    const fase = FASES[indice];
    const situacao = situacaoDa(fase, indice, liberada);
    pontos.querySelectorAll("button").forEach((b) => b.setAttribute("aria-current", String(b.dataset.fase === fase.id)));
    painel.style.setProperty("--destaque", fase.destaque);
    painel.replaceChildren(
      el("p", { class: "bvp-painel__nome pixel", text: `${indice + 1}. ${fase.nome}` }),
      el("p", { class: "bvp-painel__area", text: fase.area }),
      el("p", { class: "bvp-painel__situacao pixel", text: situacao.texto }),
      el("button", {
        class: "botao", type: "button", disabled: situacao.bloqueada || indice !== posicao,
        onclick: () => entrarBairro(fase),
      }, situacao.bloqueada ? "Bloqueado" : indice === posicao ? "Entrar no bairro" : "Vá até lá"));
  };

  const boneco = el("div", { class: "bvp-cidade__jogadora", "aria-hidden": "true" });
  boneco.style.backgroundImage = `url(${arte.imagemJogadora(progresso.jogadora ?? "cidada", 2)})`;
  const colocar = ({ x, y }) => { boneco.style.left = `${x * 100}%`; boneco.style.top = `${y * 100}%`; };
  colocar(FASES[posicao].naCidade);

  const caminhar = (destino) => {
    if (andando || destino === posicao || !acessivel(destino)) return;
    const passo = destino > posicao ? 1 : -1;
    const pontosDoCaminho = [];
    for (let i = posicao; i !== destino; i += passo) pontosDoCaminho.push(...trajeto(i, i + passo).slice(i === posicao ? 0 : 1));
    andando = true;
    painel.querySelectorAll(".botao").forEach((botao) => { botao.disabled = true; });
    boneco.classList.add("bvp-cidade__jogadora--andando");
    let trecho = 0;
    const seguir = () => {
      if (trecho >= pontosDoCaminho.length - 1) {
        andando = false;
        boneco.classList.remove("bvp-cidade__jogadora--andando");
        posicao = destino;
        faseAtual = FASES[destino];
        mostrarPainel(destino);
        painel.querySelector(".botao:not([disabled])")?.focus({ preventScroll: true });
        return;
      }
      const a = pontosDoCaminho[trecho];
      const b = pontosDoCaminho[trecho + 1];
      const duracao = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y) * 1500);
      boneco.style.transform = `translate(-50%, -100%) scaleX(${b.x < a.x ? -1 : 1})`;
      const inicio = performance.now();
      const quadro = (agora) => {
        const f = Math.min(1, (agora - inicio) / duracao);
        colocar({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f });
        if (f < 1) requestAnimationFrame(quadro);
        else { trecho++; seguir(); }
      };
      requestAnimationFrame(quadro);
    };
    seguir();
  };

  moverNoMapa = (direcao) => {
    if (andando) return;
    const vetor = { cima: [0, -1], baixo: [0, 1], esquerda: [-1, 0], direita: [1, 0] }[direcao];
    const candidatos = [posicao - 1, posicao + 1].filter((i) => i >= 0 && i < FASES.length).map((i) => {
      const [a, quina] = trajeto(posicao, i);
      const dx = quina.x - a.x || FASES[i].naCidade.x - a.x;
      const dy = quina.y - a.y || FASES[i].naCidade.y - a.y;
      const tamanho = Math.hypot(dx, dy) || 1;
      return { indice: i, alinhamento: (dx * vetor[0] + dy * vetor[1]) / tamanho };
    }).filter((c) => c.alinhamento > 0.5).sort((a, b) => b.alinhamento - a.alinhamento);
    const alvo = candidatos[0];
    if (!alvo) return;
    if (acessivel(alvo.indice)) caminhar(alvo.indice);
    else { mostrarPainel(alvo.indice); tocar("erro"); }
  };
  confirmarNoMapa = () => { if (!andando && acessivel(posicao)) entrarBairro(FASES[posicao]); };

  const pontos = el("ol", { class: "bvp-pontos" }, FASES.map((fase, indice) => {
    const situacao = situacaoDa(fase, indice, liberada);
    return el("li", {},
      el("button", {
        class: `bvp-ponto${situacao.zerada ? " bvp-ponto--zerado" : ""}${situacao.bloqueada ? " bvp-ponto--bloqueado" : ""}`,
        type: "button", "data-fase": fase.id,
        style: `left:${fase.naCidade.x * 100}%;top:${fase.naCidade.y * 100}%;--destaque:${fase.destaque}`,
        "aria-label": `${indice + 1}. ${fase.nome}: ${situacao.texto}`,
        onclick: () => {
          if (indice === posicao) { mostrarPainel(indice); return; }
          if (acessivel(indice)) caminhar(indice); else mostrarPainel(indice);
        },
      },
        el("span", { class: "pixel", text: situacao.bloqueada ? "🔒" : situacao.zerada ? "✓" : String(indice + 1) })));
  }));

  const controles = el("div", { class: "bvp-controles bvp-controles--mapa", "aria-label": "Controles do mapa" },
    el("div", { class: "bvp-direcional" },
      ...[["cima", "▲"], ["esquerda", "◀"], ["direita", "▶"], ["baixo", "▼"]].map(([direcao, seta]) =>
        el("button", {
          type: "button", class: `bvp-tecla bvp-tecla--${direcao}`, "aria-label": `Andar para ${direcao}`,
          onpointerdown: (evento) => { evento.preventDefault(); moverNoMapa(direcao); },
          onclick: (evento) => { if (evento.detail === 0) moverNoMapa(direcao); },
        }, seta))),
    el("button", {
      type: "button", class: "bvp-botao-a pixel", "aria-label": "Botão L",
      onclick: () => confirmarNoMapa(),
    }, "L"));

  tela.replaceChildren(
    el("div", { class: "bvp-mapa" },
      el("div", { class: "bvp-mapa__topo" },
        el("p", { class: "bvp-rotulo pixel", text: "Mapa da cidade" }),
        botaoSom()),
      el("div", { class: "bvp-cidade" },
        el("img", { class: "bvp-cidade__fundo", src: imagemCidade, alt: "Mapa da cidade com os sete bairros ligados por ruas" }),
        pontos,
        boneco),
      painel,
      controles,
      el("div", { class: "bvp-acoes" },
        el("button", { class: "botao botao--fantasma", type: "button", onclick: telaInicio }, "Início")))
  );
  mostrarPainel(posicao);
  painel.querySelector(".botao:not([disabled])")?.focus({ preventScroll: true });
}

function telaFinal() {
  mostrarTela();
  const total = FASES.reduce((soma, fase) => soma + conteudo.propostasDa(fase.id).length, 0);
  const fontes = FASES.flatMap((fase) => [
    ...conteudo.propostasDa(fase.id).flatMap((item) => item.fontes),
    ...(conteudo.objetoDa(fase.id)?.fontes ?? []),
  ]);
  mostrarResultado({
    alvo: tela,
    titulo: "PLANO ZERADO!",
    texto: `Você passou pelos ${FASES.length} bairros, conheceu ${total} propostas do plano de governo e achou todos os objetos perdidos.`,
    fontes,
    textoCompartilhar: `Zerei o Bora Ver o Plano e conheci as ${total} propostas do plano de Lula para 2026. Bora ver também?`,
    aoJogarDeNovo: recomecar,
  });
  tela.querySelector(".resultado__texto")?.after(
    el("p", { class: "bvp-voto pixel" },
      el("span", { class: "bvp-voto__verde", text: "No dia 25/10, " }),
      el("span", { class: "bvp-voto__amarelo", text: "exerça seu direito ao voto. " }),
      el("span", { class: "bvp-voto__vermelho", text: "Vote Lula 13!" })));
}

/* ---------- Bairro (Kaplay) ---------- */

function entrarBairro(fase) {
  faseAtual = fase;
  tela.hidden = true;
  palco.hidden = false;
  palco.style.setProperty("--destaque", fase.destaque);
  atualizarHud();
  tocarMusica();
  if (!k) {
    iniciarMotor();
    k.onLoad(() => k.go("bairro", fase));
  } else {
    k.go("bairro", fase);
  }
  canvas.focus({ preventScroll: true });
}

function iniciarMotor() {
  k = kaplay({
    canvas,
    width: VISAO.largura,
    height: VISAO.altura,
    letterbox: true,
    crisp: true,
    global: false,
    background: [11, 11, 15],
    touchToMouse: false,
    loadingScreen: false,
    focus: false,
  });

  FASES.forEach((fase) => k.loadSprite(`mapa-${fase.id}`, arte.imagemMapa(fase.mapa, fase.destaque, fase.casas)));
  Object.keys(arte.JOGADORAS).forEach((id) =>
    k.loadSprite(`jogadora-${id}`, arte.imagemJogadora(id), {
      sliceX: 2, anims: { andar: { from: 0, to: 1, loop: true, speed: 7 } },
    }));
  FASES.forEach((fase) => pessoasDaFase(fase).forEach((alguem) => {
    const nome = spritePessoa(alguem);
    if (!k.getSprite(nome)) k.loadSprite(nome, arte.imagemPessoa(alguem.traje, alguem.cor, 1, alguem));
  }));
  k.loadSprite("estrela", arte.imagemEstrela());
  k.loadSprite("marca-x", arte.imagemMarcaX());
  k.loadSprite("balao", arte.imagemBalao());
  k.loadSprite("brilho", arte.imagemBrilho(), { sliceX: 2, anims: { piscar: { from: 0, to: 1, loop: true, speed: 3 } } });
  k.loadSprite("portao", arte.imagemPortao(), { sliceX: 2 });
  Object.keys(arte.NOMES_PLANTAS).forEach((letra) => k.loadSprite(`planta-${letra}`, arte.imagemPlanta(letra), { sliceX: 2 }));

  k.scene("parado", () => {});
  k.scene("bairro", montarCena);
}

function montarCena(fase) {
  const marcadores = lerMarcadores(fase.mapa);
  const propostas = conteudo.propostasDa(fase.id);
  const objeto = conteudo.objetoDa(fase.id);
  const indiceFase = FASES.indexOf(fase);
  const emBloco = ({ x, y }) => k.vec2(x * LARGURA_BLOCO, y * LARGURA_BLOCO);
  const largura = fase.mapa[0].length * LARGURA_BLOCO;
  const altura = fase.mapa.length * LARGURA_BLOCO;
  const areaDoBloco = () => k.area({ shape: new k.Rect(k.vec2(0), 16, 16) });
  const ocupados = new Set();
  const chave = ({ x, y }) => `${x},${y}`;
  const ocupar = (local) => ocupados.add(chave(local));
  const liberar = (local) => ocupados.delete(chave(local));
  const bloqueado = (x, y) => SOLIDOS.has(fase.mapa[y]?.[x] ?? "#") || ocupados.has(`${x},${y}`);

  k.add([k.sprite(`mapa-${fase.id}`), k.pos(0, 0), k.z(-1000)]);

  const interativos = [];
  const corpoMorador = () => k.area({ shape: new k.Rect(k.vec2(2, 8), 12, 8) });

  [1, 2, 3, 4].forEach((slot, ordem) => {
    const item = propostas[ordem];
    const local = marcadores.personagens[slot];
    if (!item || !local) return;
    const posicao = emBloco(local);
    const alguem = pessoaDaProposta(item, ordem, indiceFase);
    ocupar(local);
    const morador = k.add([k.sprite(spritePessoa(alguem)), k.pos(posicao), corpoMorador(), k.z(posicao.y)]);
    const estrela = k.add([k.sprite("estrela"), k.pos(posicao.x + 4, posicao.y - 9), k.z(5000), k.opacity(1)]);
    estrela.onUpdate(() => {
      estrela.pos.y = posicao.y - 9 + Math.sin(k.time() * 4) * 1.5;
      estrela.opacity = progresso.propostas.includes(item.id) ? 0 : 1;
    });
    interativos.push({ entidade: morador, acao: () => conversar(item, alguem) });
  });

  if (marcadores.pista) {
    const posicao = emBloco(marcadores.pista);
    ocupar(marcadores.pista);
    const morador = k.add([k.sprite(spritePessoa(GUIA)), k.pos(posicao), corpoMorador(), k.z(posicao.y)]);
    const balao = k.add([k.sprite("balao"), k.pos(posicao.x + 4, posicao.y - 8), k.z(5000), k.opacity(1)]);
    balao.onUpdate(() => { balao.opacity = objeto && !progresso.objetos.includes(objeto.id) ? 1 : 0; });
    interativos.push({ entidade: morador, acao: () => falarComGuia(objeto) });
  }

  const desafio = objeto?.desafio;
  const objetoAchado = () => objeto && progresso.objetos.includes(objeto.id);

  let tentarAbrir = null;
  if (desafio && marcadores.portao) {
    const posicao = emBloco(marcadores.portao);
    if (progresso.portoes.includes(fase.id) || objetoAchado()) {
      k.add([k.sprite("portao", { frame: 1 }), k.pos(posicao), k.z(-500)]);
    } else {
      ocupar(marcadores.portao);
      const portao = k.add([k.sprite("portao", { frame: 0 }), k.pos(posicao), areaDoBloco(), k.z(posicao.y)]);
      tentarAbrir = () => resolverPortao(fase, objeto, () => {
        portao.destroy();
        liberar(marcadores.portao);
        tentarAbrir = null;
        k.add([k.sprite("portao", { frame: 1 }), k.pos(posicao), k.z(-500)]);
      });
      interativos.push({ entidade: portao, acao: () => tentarAbrir?.() });
    }
  }

  const responsavel = objeto?.responsavel;
  if (responsavel && marcadores.responsavel) {
    const posicao = emBloco(marcadores.responsavel);
    ocupar(marcadores.responsavel);
    const alguem = pessoaResponsavel(responsavel, indiceFase);
    const pessoa = k.add([k.sprite(spritePessoa(alguem)), k.pos(posicao), corpoMorador(), k.z(posicao.y)]);
    interativos.push({
      entidade: pessoa,
      acao: () => (tentarAbrir ? tentarAbrir() : falarComResponsavel(responsavel, alguem)),
    });
  }

  const desafioCumprido = () => {
    if (!desafio) return true;
    if (["senha", "escolha", "provinha"].includes(desafio.tipo)) return progresso.portoes.includes(fase.id);
    if (desafio.tipo === "mapa") return pedacosDoMapa(fase).every(Boolean);
    return true;
  };

  if (objeto && marcadores.objeto && !objetoAchado()) {
    const local = marcadores.objeto;
    const posicao = emBloco(local);
    const pegar = (aoAchar) => { if (desafioCumprido()) acharObjeto(objeto, aoAchar); };
    if (desafio?.tipo === "caminho" || desafio?.tipo === "mapa") {
      const ponto = k.add([k.pos(posicao), areaDoBloco()]);
      const marca = desafio.tipo === "mapa"
        ? k.add([k.sprite("marca-x"), k.pos(posicao.x + 1, posicao.y + 1), k.z(-400), k.opacity(0)])
        : null;
      marca?.onUpdate(() => { marca.opacity = desafioCumprido() ? 0.85 : 0; });
      interativos.push({ entidade: ponto, alcance: ALCANCE_ESCONDIDO, acao: () => pegar(() => { ponto.destroy(); marca?.destroy(); }) });
    } else {
      ocupar(local);
      const brilho = k.add([
        k.sprite("brilho", { anim: "piscar" }), k.pos(posicao.x + 4, posicao.y + 4),
        k.area({ shape: new k.Rect(k.vec2(-4), 16, 16) }), k.z(posicao.y),
      ]);
      interativos.push({ entidade: brilho, acao: () => pegar(() => { brilho.destroy(); liberar(local); }) });
    }
  }

  if (desafio?.tipo === "casa") {
    Object.entries(marcadores.portas).forEach(([letra, local]) => {
      const porta = k.add([k.pos(emBloco(local)), k.area({ shape: new k.Rect(k.vec2(0), 16, 16) })]);
      interativos.push({ entidade: porta, acao: () => baterNaPorta(letra, objeto) });
    });
  }

  if (desafio?.tipo === "colheita") {
    const colhidas = [];
    const plantas = Object.entries(marcadores.plantas).map(([letra, local]) => {
      ocupar(local);
      const planta = k.add([k.sprite(`planta-${letra}`, { frame: objetoAchado() ? 1 : 0 }), k.pos(emBloco(local)), areaDoBloco(), k.z(local.y * LARGURA_BLOCO)]);
      interativos.push({ entidade: planta, acao: () => colher(letra, planta) });
      return planta;
    });
    let erros = 0;
    const colher = (letra, planta) => {
      if (objetoAchado() || planta.frame === 1) return;
      const faltam = faltamOuvir(fase);
      if (faltam > 0) {
        tocar("dialogo");
        abrirSobreposicao({
          rotulo: "Calma aí!",
          conteudo: [el("p", { class: "bvp-fala", text: `Antes de colher, ouça quem trabalha na roça: ${faltam === 1 ? "falta 1 pessoa" : `faltam ${faltam} pessoas`}.` })],
        });
        return;
      }
      if (desafio.ordem[colhidas.length] === letra) {
        planta.frame = 1;
        colhidas.push(letra);
        tocar("proposta");
        if (colhidas.length === desafio.ordem.length) acharObjeto(objeto, () => {});
        return;
      }
      erros++;
      colhidas.length = 0;
      plantas.forEach((outra) => { outra.frame = 0; });
      tocar("erro");
      abrirSobreposicao({
        rotulo: "Ops, ordem errada!",
        conteudo: [
          el("p", { text: `Não era hora de colher ${arte.NOMES_PLANTAS[letra]}. A plantação voltou ao começo.` }),
          erros >= TENTATIVAS_ATE_AJUDA && desafio.ajuda && el("p", { class: "bvp-pista" }, el("span", { class: "bvp-selo pixel", text: "AJUDA" }), el("br"), desafio.ajuda),
        ],
      });
    };
  }

  const inicio = emBloco(marcadores.inicio);
  const jogadora = k.add([
    k.sprite(`jogadora-${progresso.jogadora ?? "cidada"}`), k.pos(inicio),
    k.area({ shape: new k.Rect(k.vec2(CAIXA_JOGADORA.x, CAIXA_JOGADORA.y), CAIXA_JOGADORA.largura, CAIXA_JOGADORA.altura) }), k.z(inicio.y),
  ]);

  const chaveGuia = `guia-${fase.id}`;
  if (marcadores.pista && !progresso[chaveGuia] && !objetoAchado()) {
    k.wait(0.5, () => {
      if (fecharSobreposicao || faseAtual !== fase) return;
      progresso[chaveGuia] = true;
      salvarProgresso(progresso);
      falarComGuia(objeto);
    });
  }

  const centro = (entidade) => entidade.pos.add(8, 10);
  const CENTRO_COLISAO = { x: 8, y: 13 };
  const alinhar = (eixo) => {
    const centroAtual = jogadora.pos[eixo] + CENTRO_COLISAO[eixo];
    const bloco = Math.floor(centroAtual / LARGURA_BLOCO);
    const alvo = bloco * LARGURA_BLOCO + LARGURA_BLOCO / 2 - CENTRO_COLISAO[eixo];
    const diferenca = alvo - jogadora.pos[eixo];
    if (diferenca === 0 || Math.abs(diferenca) > TOLERANCIA_ALINHAMENTO) return 0;
    return Math.sign(diferenca) * Math.min(Math.abs(diferenca), VELOCIDADE * k.dt()) / k.dt();
  };
  seguirComCamera(jogadora, largura, altura);

  const cabe = (x, y) => {
    const esquerda = Math.floor((x + CAIXA_JOGADORA.x) / LARGURA_BLOCO);
    const direita = Math.floor((x + CAIXA_JOGADORA.x + CAIXA_JOGADORA.largura - 0.01) / LARGURA_BLOCO);
    const topo = Math.floor((y + CAIXA_JOGADORA.y) / LARGURA_BLOCO);
    const base = Math.floor((y + CAIXA_JOGADORA.y + CAIXA_JOGADORA.altura - 0.01) / LARGURA_BLOCO);
    for (let by = topo; by <= base; by++) {
      for (let bx = esquerda; bx <= direita; bx++) if (bloqueado(bx, by)) return false;
    }
    return true;
  };

  /* Anda em passos curtos, um eixo de cada vez, para nunca atravessar um bloco sólido. */
  const andar = (vx, vy) => {
    const dx = vx * k.dt();
    const dy = vy * k.dt();
    const passos = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / PASSO_MAXIMO));
    for (let i = 0; i < passos; i++) {
      if (cabe(jogadora.pos.x + dx / passos, jogadora.pos.y)) jogadora.pos.x += dx / passos;
      if (cabe(jogadora.pos.x, jogadora.pos.y + dy / passos)) jogadora.pos.y += dy / passos;
    }
  };

  const olhando = k.vec2(0, 1);

  jogadora.onUpdate(() => {
    if (fecharSobreposicao) {
      if (jogadora.curAnim()) { jogadora.stop(); jogadora.frame = 0; }
      return;
    }
    const dx = (entrada.direita ? 1 : 0) - (entrada.esquerda ? 1 : 0);
    const dy = (entrada.baixo ? 1 : 0) - (entrada.cima ? 1 : 0);
    if (dx || dy) {
      const fator = dx && dy ? Math.SQRT1_2 : 1;
      const ajusteX = dy && !dx ? alinhar("x") : 0;
      const ajusteY = dx && !dy ? alinhar("y") : 0;
      andar(dx * VELOCIDADE * fator + ajusteX, dy * VELOCIDADE * fator + ajusteY);
      if (dx) jogadora.flipX = dx < 0;
      olhando.x = dx;
      olhando.y = dy;
      if (jogadora.curAnim() !== "andar") jogadora.play("andar");
    } else if (jogadora.curAnim()) {
      jogadora.stop();
      jogadora.frame = 0;
    }
    jogadora.pos.x = Math.min(Math.max(jogadora.pos.x, 0), largura - LARGURA_BLOCO);
    jogadora.pos.y = Math.min(Math.max(jogadora.pos.y, 0), altura - LARGURA_BLOCO);
    jogadora.z = jogadora.pos.y;
    seguirComCamera(jogadora, largura, altura);
  });

  /* Entre os próximos, dá preferência a quem está na frente da personagem. */
  interagirNaCena = () => {
    const perto = interativos
      .filter((item) => item.entidade.exists())
      .map((item) => {
        const vetor = centro(item.entidade).sub(centro(jogadora));
        return { ...item, distancia: vetor.len(), aFrente: vetor.dot(olhando) > 0 };
      })
      .filter((item) => item.distancia <= (item.alcance ?? ALCANCE_CONVERSA))
      .sort((a, b) => (b.aFrente - a.aFrente) || (a.distancia - b.distancia))[0];
    perto?.acao();
  };
}

function seguirComCamera(jogadora, largura, altura) {
  const metadeL = VISAO.largura / 2;
  const metadeA = VISAO.altura / 2;
  const x = Math.min(Math.max(jogadora.pos.x + 8, metadeL), largura - metadeL);
  const y = Math.min(Math.max(jogadora.pos.y + 8, metadeA), altura - metadeA);
  k.camPos(Math.round(x), Math.round(y));
}

/* ---------- Interações ---------- */

function pedacosDoMapa(fase) {
  return conteudo.propostasDa(fase.id).map((item) => progresso.propostas.includes(item.id));
}

function mapaDoTesouro(fase) {
  const pedacos = pedacosDoMapa(fase);
  const achados = pedacos.filter(Boolean).length;
  const alvo = lerMarcadores(fase.mapa).objeto;
  return el("div", { class: "bvp-tesouro" },
    el("p", { class: "bvp-selo pixel", text: achados === pedacos.length ? "🗺 MAPA COMPLETO: SIGA O X!" : `🗺 PEDAÇOS DO MAPA: ${achados}/${pedacos.length}` }),
    el("img", {
      src: arte.imagemTesouro(fase.mapa, fase.destaque, pedacos, alvo), width: 320, height: 240,
      alt: achados === pedacos.length ? "Mapa completo do bairro com um X marcando onde o objeto está" : `Mapa rasgado: ${achados} de ${pedacos.length} pedaços encontrados`,
    }));
}

const trajeDe = (nome) => (nome && arte.TRAJES[nome] ? nome : "morador");

const GUIA = { traje: "guia", cor: COR_DA_GUIA, genero: "f", idade: "adulta" };

const pessoaDaProposta = (item, ordem, indiceFase) => ({
  traje: trajeDe(item.traje), cor: (ordem + indiceFase) % COR_DA_GUIA, genero: item.genero, idade: item.idade,
});

const pessoaResponsavel = (responsavel, indiceFase) => ({
  traje: trajeDe(responsavel.traje), cor: indiceFase % CORES_DE_PESSOAS, genero: responsavel.genero, idade: responsavel.idade,
});

const spritePessoa = ({ traje, cor, genero, idade }) => `pessoa-${traje}-${cor}-${genero ?? "x"}-${idade ?? "x"}`;

/** Todas as pessoas que aparecem num bairro, para carregar os desenhos antes de entrar. */
function pessoasDaFase(fase) {
  const indiceFase = FASES.indexOf(fase);
  const responsavel = conteudo.objetoDa(fase.id)?.responsavel;
  return [
    GUIA,
    ...conteudo.propostasDa(fase.id).slice(0, 4).map((item, ordem) => pessoaDaProposta(item, ordem, indiceFase)),
    ...(responsavel ? [pessoaResponsavel(responsavel, indiceFase)] : []),
  ];
}

/** Retrato e nome de quem fala, para o topo da caixa de diálogo. */
function quemFala(nome, alguem) {
  return { rotulo: nome, retrato: arte.imagemPessoa(alguem.traje, alguem.cor, 4, alguem) };
}

/** "Seu Jorge · Farmacêutico"; quando a função já está no nome ("Professora Ana"), mostra só o nome. */
const nomeDoResponsavel = ({ nome, funcao }) => (nome.toLowerCase().includes(funcao.toLowerCase()) ? nome : `${nome} · ${funcao}`);

function falarComResponsavel(responsavel, alguem) {
  tocar("dialogo");
  abrirSobreposicao({
    ...quemFala(nomeDoResponsavel(responsavel), alguem),
    conteudo: [el("p", { class: "bvp-fala", text: "Pode passar! O que você procura está logo ali." })],
  });
}

function conversar(item, alguem) {
  const nova = !progresso.propostas.includes(item.id);
  const fase = FASES.find((f) => f.id === item.fase);
  const comMapa = conteudo.objetoDa(item.fase)?.desafio?.tipo === "mapa";
  if (portasTrancadasEm === item.fase) portasTrancadasEm = null;
  if (nova) {
    progresso.propostas.push(item.id);
    salvarProgresso(progresso);
    atualizarHud();
  }
  tocar(nova ? "proposta" : "dialogo");
  abrirSobreposicao({
    ...quemFala(item.personagem, alguem),
    conteudo: [
      el("p", { class: "bvp-fala", text: item.abertura }),
      item.lembranca && el("p", { class: "bvp-lembranca", text: item.lembranca }),
      el("p", { class: "bvp-proposta" }, el("span", { class: "bvp-selo pixel", text: nova ? "★ PROPOSTA ENCONTRADA" : "★ PROPOSTA" }), el("br"), item.proposta),
      renderFontes(null, item.fontes, "Fonte"),
      item.pista && el("p", { class: "bvp-pista" }, el("span", { class: "bvp-selo pixel", text: "✎ PISTA ANOTADA" }), el("br"), item.pista),
      comMapa && mapaDoTesouro(fase),
    ],
    aoFechar: () => verificarFase(),
  });
}

function falarComGuia(objeto) {
  tocar("dialogo");
  const achado = objeto && progresso.objetos.includes(objeto.id);
  abrirSobreposicao({
    ...quemFala("Guia do bairro", GUIA),
    conteudo: [el("p", { class: "bvp-fala", text: !objeto ? "Que dia bonito para passear!" : achado ? "Você achou! Que bom, alguém vai ficar feliz." : objeto.guia })],
  });
}

const PALAVRAS_DE_LIGACAO = new Set(["a", "o", "as", "os", "de", "da", "do", "das", "dos", "e", "um", "uma"]);

/** Minúsculas, sem acentos, sem pontuação e sem palavras de ligação. */
const normalizar = (texto) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((palavra) => palavra && !PALAVRAS_DE_LIGACAO.has(palavra)).join("");

function distancia(a, b) {
  const linha = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let anterior = linha[0];
    linha[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const atual = linha[j];
      linha[j] = Math.min(linha[j] + 1, linha[j - 1] + 1, anterior + (a[i - 1] === b[j - 1] ? 0 : 1));
      anterior = atual;
    }
  }
  return linha[b.length];
}

/** Aceita as respostas listadas e, em respostas longas, um único erro de digitação. */
function respostaAceita(tentativa, respostas) {
  const alvo = normalizar(tentativa);
  if (!alvo) return false;
  return respostas.some((resposta) => {
    const certa = normalizar(resposta);
    return certa === alvo || (certa.length >= 6 && distancia(certa, alvo) <= 1);
  });
}

function cadernoDePistas(fase) {
  const pistas = pistasDa(fase);
  return pistas.length
    ? el("details", { class: "bvp-caderno" }, el("summary", {}, `Caderno de pistas (${pistas.length})`), el("ul", { class: "bvp-lista" }, pistas.map((pista) => el("li", { text: pista }))))
    : el("p", { class: "bvp-mensagem", text: "Você ainda não tem pistas. Converse com o pessoal do bairro!" });
}

function resolverPortao(fase, objeto, aoAbrir) {
  const desafio = objeto.desafio;
  const responsavel = objeto.responsavel;
  const fala = responsavel
    ? quemFala(nomeDoResponsavel(responsavel), pessoaResponsavel(responsavel, FASES.indexOf(fase)))
    : null;
  const abrir = () => {
    progresso.portoes.push(fase.id);
    salvarProgresso(progresso);
    tocar("portao");
    fecharSobreposicao?.();
    aoAbrir();
  };
  if (desafio.tipo === "senha") pedirSenha(fase, desafio, abrir, fala);
  else perguntar(fase, desafio, abrir, fala);
}

function pedirSenha(fase, desafio, abrir, fala) {
  let tentativas = 0;
  const mensagem = el("p", { class: "bvp-mensagem", role: "status" });
  const campo = el("input", {
    id: "senha-portao", class: "bvp-campo", type: "text", autocomplete: "off", autocapitalize: "characters",
    spellcheck: "false", "aria-label": "Resposta", maxlength: "40",
  });
  const formulario = el("form", {
    class: "bvp-senha",
    onsubmit: (evento) => {
      evento.preventDefault();
      if (!normalizar(campo.value)) return;
      if (respostaAceita(campo.value, desafio.respostas)) return abrir();
      tentativas++;
      tocar("erro");
      campo.select();
      mensagem.textContent = tentativas >= TENTATIVAS_ATE_AJUDA && desafio.ajuda
        ? `Não é essa. Ajuda: ${desafio.ajuda}` : "Não é essa. Releia as pistas e tente de novo.";
    },
  }, campo, el("button", { class: "botao", type: "submit" }, "Abrir"));

  abrirSobreposicao({
    rotulo: "Portão trancado",
    ...fala,
    conteudo: [
      fala && el("p", { class: "bvp-selo pixel", text: "PORTÃO TRANCADO" }),
      el("p", { class: "bvp-charada", text: desafio.pergunta }), cadernoDePistas(fase), formulario, mensagem,
    ],
    acoes: [{ texto: "Sair" }],
    foco: campo,
  });
}

/** Uma ou mais perguntas de múltipla escolha; todas precisam ser acertadas em sequência. */
function perguntar(fase, desafio, abrir, fala) {
  const perguntas = desafio.perguntas ?? [{ pergunta: desafio.pergunta, opcoes: desafio.opcoes, correta: desafio.correta }];
  let atual = 0;
  let erros = 0;
  const area = el("div", { class: "bvp-perguntas" });
  const mensagem = el("p", { class: "bvp-mensagem", role: "status" });

  const mostrar = () => {
    const { pergunta, opcoes, correta } = perguntas[atual];
    area.replaceChildren(...[
      perguntas.length > 1 && el("p", { class: "bvp-selo pixel", text: `PERGUNTA ${atual + 1} DE ${perguntas.length}` }),
      el("p", { class: "bvp-charada", text: pergunta }),
      el("div", { class: "bvp-opcoes" }, opcoes.map((opcao, indice) =>
        el("button", {
          class: "bvp-opcao", type: "button",
          onclick: () => {
            if (indice === correta) {
              atual++;
              mensagem.textContent = "";
              if (atual === perguntas.length) return abrir();
              tocar("proposta");
              mostrar();
              return;
            }
            erros++;
            atual = 0;
            tocar("erro");
            mensagem.textContent = (perguntas.length > 1 ? "Errou! Vamos recomeçar a provinha. " : "Não é essa. ")
              + (erros >= TENTATIVAS_ATE_AJUDA && desafio.ajuda ? `Ajuda: ${desafio.ajuda}` : "Releia as pistas.");
            mostrar();
          },
        }, opcao))),
    ].filter(Boolean));
    area.querySelector(".bvp-opcao")?.focus({ preventScroll: true });
  };

  abrirSobreposicao({
    rotulo: desafio.titulo ?? "Portão trancado",
    ...fala,
    conteudo: [
      fala && desafio.titulo && el("p", { class: "bvp-selo pixel", text: desafio.titulo.toUpperCase() }),
      cadernoDePistas(fase), area, mensagem,
    ],
    acoes: [{ texto: "Sair" }],
  });
  mostrar();
}

/**
 * Só dá para bater depois de ouvir todos os vizinhos; depois de uma porta errada,
 * é preciso confirmar as pistas com um vizinho antes de tentar de novo.
 */
function baterNaPorta(letra, objeto) {
  if (progresso.objetos.includes(objeto.id)) return;
  const casa = faseAtual.casas?.[letra] ?? { numero: PORTAS.indexOf(letra) + 1, cor: 0 };
  const nome = `casa ${casa.numero}, de porta ${arte.NOMES_CORES_PORTAS[casa.cor]}`;
  const faltam = faltamOuvir(faseAtual);
  const avisar = (texto) => {
    tocar("dialogo");
    abrirSobreposicao({ rotulo: `Casa ${casa.numero}`, conteudo: [el("p", { class: "bvp-fala", text: texto })] });
  };
  if (faltam > 0) {
    avisar(`Melhor não sair batendo em qualquer porta. Converse com os vizinhos primeiro: ${faltam === 1 ? "falta ouvir 1 pessoa" : `faltam ${faltam} pessoas`}.`);
    return;
  }
  if (portasTrancadasEm === faseAtual.id) {
    avisar("Depois de uma porta errada, confirme as pistas com um dos vizinhos antes de bater de novo.");
    return;
  }
  if (objeto.desafio.porta === letra) {
    acharObjeto(objeto, () => {});
    return;
  }
  portasTrancadasEm = faseAtual.id;
  tocar("erro");
  abrirSobreposicao({
    rotulo: `Toc, toc… ${nome}`,
    conteudo: [
      el("p", { class: "bvp-fala", text: "Ninguém aqui perdeu nada, não." }),
      el("p", { class: "bvp-mensagem", text: "Volte, confirme as pistas com um vizinho e tente outra casa." }),
      cadernoDePistas(faseAtual),
    ],
  });
}

function acharObjeto(objeto, aoAchar) {
  progresso.objetos.push(objeto.id);
  salvarProgresso(progresso);
  atualizarHud();
  aoAchar();
  tocar("objeto");
  abrirSobreposicao({
    rotulo: "Objeto perdido encontrado!",
    classe: "bvp-cartao-objeto",
    conteudo: [
      el("img", { class: "bvp-objeto-img", src: arte.imagemObjeto(objeto.fase, 6), alt: objeto.objeto, width: 96, height: 96 }),
      el("p", { class: "bvp-objeto-nome pixel", text: objeto.objeto }),
      el("p", { text: objeto.texto }),
      renderFontes(null, objeto.fontes, "Fonte"),
    ],
    aoFechar: () => verificarFase(),
  });
}

function verificarFase() {
  if (!faseAtual || !faseConcluida(progresso, faseAtual, conteudo)) return;
  const chave = `zerou-${faseAtual.id}`;
  if (progresso[chave]) return;
  progresso[chave] = true;
  salvarProgresso(progresso);
  tocarVitoria(faseAtual === FASES[FASES.length - 1] ? "final" : "fase");
  mostrarFaseZerada(faseAtual);
}

function mostrarFaseZerada(fase) {
  const indice = FASES.indexOf(fase);
  const proxima = FASES[indice + 1];
  const proximaDisponivel = proxima && conteudo.propostasDa(proxima.id).length > 0;
  const propostas = conteudo.propostasDa(fase.id);
  const objeto = conteudo.objetoDa(fase.id);
  const ultima = indice === FASES.length - 1;

  abrirSobreposicao({
    rotulo: "BAIRRO ZERADO!",
    classe: "bvp-zerado",
    conteudo: [
      el("p", { text: `Você encontrou as ${propostas.length} propostas de ${fase.nome}${objeto ? ` e o objeto perdido: ${objeto.objeto}` : ""}.` }),
      el("ul", { class: "bvp-lista" }, propostas.map((item) => el("li", { text: item.proposta }))),
      proxima && el("p", { class: "bvp-selo pixel", text: proximaDisponivel ? `NOVO BAIRRO LIBERADO: ${proxima.nome.toUpperCase()}` : "PRÓXIMO BAIRRO EM BREVE" }),
    ],
    acoes: [
      ultima
        ? { texto: "Ver resultado final", principal: true, aoClicar: telaFinal }
        : proximaDisponivel
          ? { texto: `Ir para ${proxima.nome}`, principal: true, aoClicar: () => entrarBairro(proxima) }
          : null,
      { texto: "Mapa da cidade", aoClicar: () => telaMapa(proxima && proximaDisponivel ? proxima : fase) },
      {
        texto: "Compartilhar",
        manterAberto: true,
        aoClicar: () => compartilhar(`Zerei o bairro ${fase.nome} no Bora Ver o Plano! Encontrei ${propostas.length} propostas${objeto ? ` e o ${objeto.objeto.toLowerCase()} perdido` : ""}.`, location.href),
      },
    ].filter(Boolean),
  });
}

/** Quantas pessoas com estrela do bairro ainda não foram ouvidas. */
function faltamOuvir(fase) {
  return conteudo.propostasDa(fase.id).filter((item) => !progresso.propostas.includes(item.id)).length;
}

function pistasDa(fase) {
  return conteudo.propostasDa(fase.id)
    .filter((item) => item.pista && progresso.propostas.includes(item.id))
    .map((item) => item.pista);
}

function abrirMenu() {
  const encontradas = conteudo.propostasDa(faseAtual.id).filter((item) => progresso.propostas.includes(item.id));
  const pistas = pistasDa(faseAtual);
  abrirSobreposicao({
    rotulo: "Menu",
    conteudo: [
      conteudo.objetoDa(faseAtual.id)?.desafio?.tipo === "mapa" && mapaDoTesouro(faseAtual),
      el("p", { class: "bvp-rotulo pixel", text: "Caderno de pistas" }),
      pistas.length
        ? el("ul", { class: "bvp-lista" }, pistas.map((pista) => el("li", { text: pista })))
        : el("p", { text: "Nenhuma pista ainda. Converse com quem tem uma estrela!" }),
      el("p", { class: "bvp-rotulo pixel", text: `Propostas encontradas em ${faseAtual.nome}` }),
      encontradas.length
        ? el("ul", { class: "bvp-lista" }, encontradas.map((item) => el("li", { text: item.proposta })))
        : el("p", { text: "Nenhuma ainda." }),
    ],
    acoes: [
      { texto: "Mapa da cidade", aoClicar: () => telaMapa(faseAtual) },
      { texto: "Voltar ao jogo", principal: true },
    ],
  });
}

/* ---------- Sobreposição (diálogos, cartões, menu) ---------- */

function abrirSobreposicao({ rotulo, retrato, conteudo: filhos, acoes, aoFechar, classe = "", foco }) {
  const fechar = () => {
    sobreposicao.hidden = true;
    sobreposicao.replaceChildren();
    fecharSobreposicao = null;
    canvas.focus({ preventScroll: true });
    aoFechar?.();
  };
  const botoes = (acoes ?? [{ texto: "Continuar ▶", principal: true }]).map((acao) =>
    el("button", {
      class: `botao${acao.principal ? "" : " botao--fantasma"}`, type: "button",
      onclick: () => {
        if (performance.now() - abertaEm < 300) return;
        if (!acao.manterAberto) fechar();
        acao.aoClicar?.();
      },
    }, acao.texto));

  sobreposicao.replaceChildren(
    el("div", { class: `bvp-caixa ${classe}`, role: "dialog", "aria-modal": "true", "aria-labelledby": "bvp-titulo-caixa" },
      el("div", { class: "bvp-caixa__topo" },
        retrato && el("img", { class: "bvp-caixa__retrato", src: retrato, alt: "", width: 64, height: 64 }),
        el("p", { class: "bvp-caixa__titulo pixel", id: "bvp-titulo-caixa", text: rotulo })),
      ...filhos.filter(Boolean),
      el("div", { class: "bvp-caixa__acoes" }, botoes)));
  sobreposicao.hidden = false;
  fecharSobreposicao = fechar;
  abertaEm = performance.now();
  zerarEntrada();
  const alvo = foco
    ?? sobreposicao.querySelector(".bvp-caixa__acoes .botao:not(.botao--fantasma)")
    ?? sobreposicao.querySelector(".bvp-caixa__acoes .botao");
  alvo?.focus({ preventScroll: true });
  sobreposicao.querySelector(".bvp-caixa").scrollTop = 0;
}

function fecharSobreposicaoAtual() {
  if (!fecharSobreposicao) return;
  sobreposicao.hidden = true;
  sobreposicao.replaceChildren();
  fecharSobreposicao = null;
}

/* ---------- HUD e controles ---------- */

function contarPropostas(fase) {
  return conteudo.propostasDa(fase.id).filter((item) => progresso.propostas.includes(item.id)).length;
}

function botaoSom() {
  const rotulo = () => (progresso.som ? "♪ SOM" : "♪ MUDO");
  const botao = el("button", {
    class: "bvp-hud__botao pixel", type: "button", "aria-pressed": String(progresso.som), "aria-label": "Som e música",
    onclick: () => {
      progresso.som = !progresso.som;
      salvarProgresso(progresso);
      definirSom(progresso.som);
      if (progresso.som) tocarMusica(); else pararMusica();
      botao.textContent = rotulo();
      botao.setAttribute("aria-pressed", String(progresso.som));
    },
  }, rotulo());
  return botao;
}

function atualizarHud() {
  if (!faseAtual) return;
  const objeto = conteudo.objetoDa(faseAtual.id);
  const achouObjeto = objeto && progresso.objetos.includes(objeto.id);
  hud.replaceChildren(
    el("span", { class: "bvp-hud__nome pixel", text: faseAtual.nome }),
    el("span", { class: "bvp-hud__item" }, `★ ${contarPropostas(faseAtual)}/${conteudo.propostasDa(faseAtual.id).length}`),
    objeto && el("span", { class: "bvp-hud__item" }, achouObjeto ? "Objeto ✓" : "Objeto ?"),
    el("span", { class: "bvp-hud__botoes" },
      botaoSom(),
      el("button", { class: "bvp-hud__botao pixel", type: "button", onclick: () => telaMapa(faseAtual) }, "MAPA"),
      el("button", { class: "bvp-hud__botao pixel", type: "button", onclick: abrirMenu, "aria-label": "Abrir menu" }, "MENU"))
  );
}

function zerarEntrada() {
  Object.keys(entrada).forEach((direcao) => { entrada[direcao] = false; });
}

const TECLAS = { ArrowUp: "cima", ArrowDown: "baixo", ArrowLeft: "esquerda", ArrowRight: "direita" };

function interagir() {
  if (palco.hidden || fecharSobreposicao) return;
  interagirNaCena();
}

function ligarControles() {
  window.addEventListener("keydown", (evento) => {
    if (palco.hidden) {
      if (tela.dataset.modo !== "mapa" || evento.target.closest?.("input, textarea")) return;
      const direcao = TECLAS[evento.code];
      if (direcao) { evento.preventDefault(); if (!evento.repeat) moverNoMapa(direcao); }
      else if (evento.code === "Space" && !evento.target.closest?.("button, a")) { evento.preventDefault(); confirmarNoMapa(); }
      return;
    }
    if (fecharSobreposicao) {
      if (evento.key === "Escape") fecharSobreposicao();
      return;
    }
    const direcao = TECLAS[evento.code];
    if (direcao) {
      entrada[direcao] = true;
      evento.preventDefault();
    } else if (evento.code === "Space") {
      evento.preventDefault();
      if (!evento.repeat) interagir();
    } else if (evento.key === "Enter") {
      evento.preventDefault();
    } else if (evento.key === "Escape") {
      abrirMenu();
    }
  });
  window.addEventListener("keyup", (evento) => {
    const direcao = TECLAS[evento.code];
    if (direcao) entrada[direcao] = false;
  });
  window.addEventListener("blur", zerarEntrada);

  document.querySelectorAll("[data-direcao]").forEach((botao) => {
    const direcao = botao.dataset.direcao;
    const soltar = () => { entrada[direcao] = false; botao.classList.remove("ativo"); };
    botao.addEventListener("pointerdown", (evento) => {
      evento.preventDefault();
      botao.setPointerCapture?.(evento.pointerId);
      entrada[direcao] = true;
      botao.classList.add("ativo");
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((tipo) => botao.addEventListener(tipo, soltar));
    botao.addEventListener("contextmenu", (evento) => evento.preventDefault());
  });
  const botaoA = document.getElementById("botao-a");
  botaoA.addEventListener("pointerdown", (evento) => { evento.preventDefault(); interagir(); });
  botaoA.addEventListener("click", (evento) => { if (evento.detail === 0) interagir(); });
}
