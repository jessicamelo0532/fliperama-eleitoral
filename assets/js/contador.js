/**
 * Contagem de acessos com GoatCounter (sem cookies e sem dados pessoais).
 * Desativado enquanto CONFIG.goatcounter estiver vazio.
 */

import { CONFIG } from "./config.js";

const fila = [];
let carregado = false;

export function iniciarContador() {
  if (!CONFIG.goatcounter || document.querySelector("script[data-goatcounter]")) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://gc.zgo.at/count.js";
  script.dataset.goatcounter = `https://${CONFIG.goatcounter}.goatcounter.com/count`;
  script.addEventListener("load", () => {
    carregado = true;
    fila.splice(0).forEach(enviar);
  });
  document.head.append(script);
}

/**
 * Registra um evento (ex.: "jogo-quiz-fim").
 * O nome não pode começar com "/".
 */
export function registrarEvento(nome, titulo = nome) {
  if (!CONFIG.goatcounter) return;
  const evento = { path: nome.replace(/^\/+/, ""), title: titulo, event: true };
  if (carregado && window.goatcounter?.count) enviar(evento);
  else fila.push(evento);
}

function enviar(evento) {
  window.goatcounter?.count?.(evento);
}
