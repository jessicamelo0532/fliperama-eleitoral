/**
 * Efeitos sonoros sintetizados no navegador, sem arquivos de áudio.
 * O áudio fica em silêncio sempre que a página sai de vista.
 */

let contexto = null;
let saida = null;
let ligado = true;
let alternar = false;

function garantirContexto() {
  if (contexto) return contexto;
  const Contexto = window.AudioContext || window.webkitAudioContext;
  if (!Contexto) return null;
  contexto = new Contexto();
  saida = contexto.createGain();
  saida.connect(contexto.destination);
  return contexto;
}

const escondido = () => document.visibilityState === "hidden";

function silenciar() {
  if (!contexto) return;
  saida.gain.setValueAtTime(0, contexto.currentTime);
  contexto.suspend?.();
}

function retomar() {
  if (!contexto || escondido()) return;
  contexto.resume?.();
  saida.gain.setValueAtTime(1, contexto.currentTime);
}

document.addEventListener("visibilitychange", () => (escondido() ? silenciar() : retomar()));
window.addEventListener("pagehide", silenciar);
window.addEventListener("blur", silenciar);
window.addEventListener("focus", retomar);
window.addEventListener("pageshow", retomar);

/** Prepara o áudio. Deve ser chamado a partir de um toque ou clique. */
export function iniciarSom(estaLigado) {
  ligado = estaLigado;
  if (garantirContexto()) retomar();
}

export function definirSom(estaLigado) {
  ligado = estaLigado;
  if (ligado && garantirContexto()) retomar();
}

function tom(frequencia, duracao, tipo = "square", volume = 0.035, ate = null, atraso = 0) {
  if (!ligado || !contexto || escondido()) return;
  const inicio = contexto.currentTime + atraso;
  const oscilador = contexto.createOscillator();
  const ganho = contexto.createGain();
  oscilador.type = tipo;
  oscilador.frequency.setValueAtTime(frequencia, inicio);
  if (ate) oscilador.frequency.exponentialRampToValueAtTime(ate, inicio + duracao);
  ganho.gain.setValueAtTime(volume, inicio);
  ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);
  oscilador.connect(ganho).connect(saida);
  oscilador.start(inicio);
  oscilador.stop(inicio + duracao + 0.02);
}

export const efeitos = {
  item() { alternar = !alternar; tom(alternar ? 560 : 700, 0.05, "square", 0.025); },
  liminar() { tom(330, 0.4, "sawtooth", 0.03, 990); },
  arquivar() { [660, 880, 1320].forEach((f, k) => tom(f, 0.08, "square", 0.03, null, k * 0.06)); },
  pego() { tom(620, 1.0, "square", 0.04, 80); },
  bonus() { tom(990, 0.08, "square", 0.03); tom(1320, 0.12, "square", 0.03, null, 0.08); },
  martelo() { tom(150, 0.09, "triangle", 0.12); tom(150, 0.09, "triangle", 0.12, null, 0.16); },
  anulacao() {
    [784, 659, 523].forEach((f, k) => tom(f, 0.1, "square", 0.03, null, k * 0.1));
    [0.4, 0.58, 0.76].forEach((atraso) => tom(130, 0.14, "triangle", 0.14, null, atraso));
  },
  vitoria() { [523, 659, 784, 1046].forEach((f, k) => tom(f, 0.14, "square", 0.03, null, k * 0.12)); },
};
