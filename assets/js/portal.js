/**
 * Portal: carrega o catálogo e renderiza a grade de jogos com filtro por categoria.
 * O parâmetro ?catalogo=teste usa data/jogos-teste.json para conferência de layout.
 */

import { el, preencherCabecalho, preencherRodape, iniciarContador } from "./moldura.js";

const CATEGORIAS = [
  { id: "todos", nome: "Todos" },
  { id: "propostas", nome: "Propostas" },
  { id: "fato-ou-fake", nome: "Fato ou Fake" },
  { id: "investigacoes", nome: "Investigações" },
];
const NOME_CATEGORIA = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c.nome]));
const VISIVEIS = new Set(["publicado", "em-breve"]);

const grade = document.getElementById("grade");
const filtros = document.getElementById("filtros");
const estado = document.getElementById("estado");

let jogos = [];

preencherCabecalho();
preencherRodape();
iniciarContador();
iniciar();

async function iniciar() {
  const teste = new URLSearchParams(location.search).get("catalogo") === "teste";
  const arquivo = teste ? "data/jogos-teste.json" : "data/jogos.json";
  try {
    const resposta = await fetch(arquivo, { cache: "no-cache" });
    if (!resposta.ok) throw new Error(resposta.status);
    const dados = await resposta.json();
    jogos = (Array.isArray(dados) ? dados : []).filter((j) => VISIVEIS.has(j.status));
    const ordem = (j) => (j.status === "publicado" ? 0 : 1);
    jogos.sort((a, b) => ordem(a) - ordem(b));
  } catch (erro) {
    console.error("Falha ao carregar o catálogo:", erro);
    jogos = [];
  }
  montarFiltros();
  aplicarFiltro(categoriaDoEndereco());
  window.addEventListener("hashchange", () => aplicarFiltro(categoriaDoEndereco()));
}

function categoriaDoEndereco() {
  const id = location.hash.replace("#", "");
  return NOME_CATEGORIA[id] ? id : "todos";
}

function montarFiltros() {
  if (!jogos.length) { filtros.hidden = true; return; }
  filtros.replaceChildren(...CATEGORIAS.map((c) =>
    el("li", {},
      el("button", {
        class: "filtro", type: "button", "data-categoria": c.id, "aria-pressed": "false",
        onclick: () => { history.replaceState(null, "", c.id === "todos" ? location.pathname + location.search : `#${c.id}`); aplicarFiltro(c.id); },
      }, c.nome))
  ));
}

function aplicarFiltro(categoria) {
  filtros.querySelectorAll("button").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.categoria === categoria)));

  const lista = categoria === "todos" ? jogos : jogos.filter((j) => j.categoria === categoria);

  if (!jogos.length) {
    grade.replaceChildren();
    estado.replaceChildren(
      el("div", { class: "vazio" },
        el("img", { src: "assets/img/favicon.svg", alt: "", width: 96, height: 96, style: "margin:0 auto 24px;image-rendering:pixelated" }),
        el("p", { class: "pixel piscar", text: "INSERT COIN" }),
        el("p", { text: "Os primeiros jogos chegam em breve. Volte logo!" }))
    );
    return;
  }

  estado.replaceChildren(lista.length ? "" :
    el("div", { class: "vazio" }, el("p", { text: "Ainda não há jogos nesta categoria." })));
  grade.replaceChildren(...lista.map(criarCard));
  estado.setAttribute("aria-label", `${lista.length} jogo(s) em ${NOME_CATEGORIA[categoria]}`);
}

function criarCard(jogo) {
  const emBreve = jogo.status !== "publicado";
  const selo = el("span", { class: `categoria categoria--${jogo.categoria}`, text: NOME_CATEGORIA[jogo.categoria] || "" });
  const miniatura = el("img", {
    class: "card__miniatura", src: jogo.miniatura || "assets/img/thumb-padrao.svg",
    alt: "", loading: "lazy", width: 320, height: 200,
  });

  if (emBreve) {
    return el("article", { class: "card card--em-breve moldura-pixel", "aria-label": `${jogo.titulo} (em breve)` },
      miniatura,
      el("span", { class: "selo-em-breve", text: "EM BREVE" }),
      el("div", { class: "card__corpo" },
        el("h2", { class: "card__titulo", text: jogo.titulo }),
        el("p", { class: "card__descricao", text: jogo.descricao }),
        el("div", { class: "card__rodape" }, selo)));
  }

  return el("article", { class: "card moldura-pixel" },
    miniatura,
    el("div", { class: "card__corpo" },
      el("h2", { class: "card__titulo", text: jogo.titulo }),
      el("p", { class: "card__descricao", text: jogo.descricao }),
      el("div", { class: "card__rodape" },
        selo,
        el("a", { class: "botao", href: jogo.caminho, "aria-label": `Jogar ${jogo.titulo}` }, "Jogar"))));
}
