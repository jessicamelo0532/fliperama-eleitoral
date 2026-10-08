/**
 * Componentes e utilitários compartilhados pelas páginas e pelos jogos.
 * Implementa o contrato de jogo descrito em docs/SPEC.md §8.
 */

import { CONFIG } from "./config.js";
import { iniciarContador, registrarEvento } from "./contador.js";

/** URL da raiz do site, resolvida a partir deste módulo. */
export const RAIZ = new URL("../../", import.meta.url);

let idJogoAtual = null;

/** Cria um elemento com atributos, ouvintes de evento e filhos. */
export function el(tag, atributos = {}, ...filhos) {
  const no = document.createElement(tag);
  for (const [chave, valor] of Object.entries(atributos)) {
    if (valor === false || valor == null) continue;
    if (chave === "class") no.className = valor;
    else if (chave === "text") no.textContent = valor;
    else if (chave.startsWith("on")) no.addEventListener(chave.slice(2), valor);
    else no.setAttribute(chave, valor === true ? "" : valor);
  }
  for (const filho of filhos.flat()) {
    if (filho == null) continue;
    no.append(filho instanceof Node ? filho : document.createTextNode(String(filho)));
  }
  return no;
}

function urlDaRaiz(caminho) {
  return new URL(caminho, RAIZ).href;
}

/**
 * Prepara uma página de jogo: título, cabeçalho, barra do jogo, rodapé e contador.
 * Requer no HTML: #cabecalho, #barra-jogo e #rodape.
 * @param {{ id: string, titulo: string }} jogo
 */
export function montarMoldura({ id, titulo }) {
  idJogoAtual = id;
  document.title = `${titulo} · ${CONFIG.nomeSite}`;
  preencherCabecalho();
  document.getElementById("barra-jogo")?.replaceChildren(
    el("a", { class: "voltar", href: urlDaRaiz("index.html") }, "← Voltar ao fliperama"),
    el("h1", { text: titulo })
  );
  preencherRodape();
  iniciarContador();
}

export function preencherCabecalho() {
  const cabecalho = document.getElementById("cabecalho");
  if (!cabecalho) return;
  cabecalho.className = "cabecalho";
  cabecalho.replaceChildren(
    el("div", { class: "conteiner" },
      el("a", { class: "logo", href: urlDaRaiz("index.html") }, "FLIPERAMA ", el("span", {}, "ELEITORAL")),
      el("nav", { class: "nav-topo", "aria-label": "Principal" },
        el("a", { href: urlDaRaiz("sobre.html") }, "SOBRE"))
    )
  );
}

export function preencherRodape() {
  const rodape = document.getElementById("rodape");
  if (!rodape) return;
  rodape.className = "rodape";
  rodape.replaceChildren(
    el("div", { class: "conteiner" },
      el("span", {},
        "Conteúdo com fontes verificáveis."),
      el("a", { href: urlDaRaiz("sobre.html") }, "Sobre o projeto")
    )
  );
}

/**
 * Registra um evento do jogo atual no contador (ex.: "inicio", "fim").
 * @param {string} acao
 */
export function registrarAcao(acao) {
  if (!idJogoAtual) return;
  registrarEvento(`jogo-${idJogoAtual}-${acao}`);
}

/**
 * Carrega o conteúdo de um jogo e retorna apenas os itens revisados.
 * @param {string} url caminho do JSON, relativo à página do jogo
 * @returns {Promise<object[]>}
 */
export async function carregarConteudo(url) {
  const resposta = await fetch(url, { cache: "no-cache" });
  if (!resposta.ok) throw new Error(`Falha ao carregar ${url}: HTTP ${resposta.status}`);
  return filtrarRevisados(await resposta.json());
}

export function filtrarRevisados(itens) {
  return Array.isArray(itens) ? itens.filter((item) => item?.revisado === true) : [];
}

/**
 * Renderiza a lista de fontes no padrão do site.
 * @param {HTMLElement|null} alvo elemento onde a lista é anexada
 * @param {{ titulo?: string, veiculo?: string, url: string, data?: string }[]} fontes
 * @param {string} [titulo]
 * @returns {HTMLElement}
 */
export function renderFontes(alvo, fontes, titulo = "Fontes") {
  const lista = (fontes || []).filter((fonte) => fonte?.url);
  const caixa = el("section", { class: "fontes moldura-pixel", "aria-label": titulo },
    el("h3", { text: titulo }),
    lista.length
      ? el("ol", {}, lista.map(itemDeFonte))
      : el("p", { text: "Nenhuma fonte cadastrada." })
  );
  alvo?.append(caixa);
  return caixa;
}

function itemDeFonte(fonte) {
  const detalhes = [fonte.veiculo, formatarData(fonte.data)].filter(Boolean).join(", ");
  return el("li", {},
    el("a", { href: fonte.url, target: "_blank", rel: "noopener noreferrer" }, fonte.titulo || fonte.url),
    detalhes && el("span", { class: "fonte__meta" }, ` — ${detalhes}`)
  );
}

/**
 * Exibe a tela de resultado padrão e registra o fim da partida.
 * @param {object} opcoes
 * @param {HTMLElement} opcoes.alvo
 * @param {string} opcoes.titulo
 * @param {string} opcoes.texto
 * @param {object[]} [opcoes.fontes]
 * @param {string} [opcoes.textoCompartilhar]
 * @param {() => void} [opcoes.aoJogarDeNovo]
 */
export function mostrarResultado({ alvo, titulo, texto, fontes = [], textoCompartilhar, aoJogarDeNovo }) {
  const tela = el("section", { class: "resultado", "aria-live": "polite" },
    el("p", { class: "resultado__titulo pixel", text: titulo }),
    el("p", { class: "resultado__texto", text: texto }),
    el("div", { class: "resultado__acoes" },
      aoJogarDeNovo && el("button", { class: "botao", type: "button", onclick: aoJogarDeNovo }, "Jogar de novo"),
      el("button", {
        class: "botao botao--claro",
        type: "button",
        onclick: () => compartilhar(textoCompartilhar || `${titulo} — ${texto}`, location.href),
      }, "Compartilhar"),
      el("a", { class: "botao botao--fantasma", href: urlDaRaiz("index.html") }, "Mais jogos")
    )
  );
  if (fontes.length) renderFontes(tela, fontesUnicas(fontes), "Fontes desta partida");
  alvo.replaceChildren(tela);
  tela.querySelector("button, a")?.focus();
  registrarAcao("fim");
  return tela;
}

/** Usa o compartilhamento nativo quando disponível; caso contrário, copia o texto. */
export async function compartilhar(texto, url = location.href) {
  registrarAcao("compartilhar");
  if (navigator.share) {
    try {
      await navigator.share({ title: CONFIG.nomeSite, text: texto, url });
      return;
    } catch (erro) {
      if (erro.name === "AbortError") return;
    }
  }
  const conteudo = `${texto}\n${url}`;
  try {
    await navigator.clipboard.writeText(conteudo);
    aviso("Copiado! Cole no WhatsApp ou no Instagram.");
  } catch {
    window.prompt("Copie o texto abaixo:", conteudo);
  }
}

export function aviso(mensagem, duracaoMs = 2600) {
  const caixa = el("div", { class: "aviso", role: "status" }, mensagem);
  document.body.append(caixa);
  setTimeout(() => caixa.remove(), duracaoMs);
}

/** Retorna uma cópia embaralhada (Fisher–Yates). */
export function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Converte "AAAA-MM-DD", "AAAA-MM" ou "AAAA" para o formato brasileiro. */
export function formatarData(iso) {
  if (!iso) return "";
  const [ano, mes, dia] = String(iso).split("-");
  if (dia) return `${dia}/${mes}/${ano}`;
  if (mes) return `${mes}/${ano}`;
  return ano;
}

function fontesUnicas(fontes) {
  const vistas = new Set();
  return fontes.filter((fonte) => {
    if (!fonte?.url || vistas.has(fonte.url)) return false;
    vistas.add(fonte.url);
    return true;
  });
}

export { iniciarContador };
