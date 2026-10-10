/**
 * Jogo de exemplo: implementação de referência do contrato comum dos jogos.
 */

import {
  el, montarMoldura, carregarConteudo, renderFontes, mostrarResultado, registrarAcao,
} from "../../assets/js/moldura.js";

const area = document.getElementById("area-jogo");

montarMoldura({ id: "exemplo", titulo: "Jogo de exemplo" });
iniciar();

async function iniciar() {
  let itens;
  try {
    itens = await carregarConteudo("conteudo.json");
  } catch (erro) {
    console.error(erro);
    area.replaceChildren(el("p", { text: "Não foi possível carregar o jogo. Tente recarregar a página." }));
    return;
  }

  if (!itens.length) {
    area.replaceChildren(el("p", { text: "Este jogo ainda não tem conteúdo disponível." }));
    return;
  }

  area.replaceChildren(
    el("p", { text: `${itens.length} item(ns) disponível(is).` }),
    el("button", { class: "botao", type: "button", onclick: () => comecar(itens) }, "Jogar")
  );
}

function comecar(itens) {
  registrarAcao("inicio");
  mostrarItem(itens, 0);
}

function mostrarItem(itens, indice) {
  const item = itens[indice];
  const ultimo = indice === itens.length - 1;
  area.replaceChildren(
    el("p", { text: item.texto }),
    el("button", {
      class: "botao",
      type: "button",
      onclick: () => (ultimo ? encerrar(itens) : mostrarItem(itens, indice + 1)),
    }, ultimo ? "Ver resultado" : "Próximo")
  );
  renderFontes(area, item.fontes);
  area.querySelector("button").focus();
}

function encerrar(itens) {
  mostrarResultado({
    alvo: area,
    titulo: `${itens.length}/${itens.length}`,
    texto: "Tela de resultado padrão.",
    fontes: itens.flatMap((item) => item.fontes),
    textoCompartilhar: "Joguei no Fliperama Eleitoral!",
    aoJogarDeNovo: iniciar,
  });
}
