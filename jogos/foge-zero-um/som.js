/**
 * Música de fundo e efeitos sonoros sintetizados no navegador, sem arquivos de áudio.
 * O áudio fica em silêncio sempre que a página sai de vista.
 */

let contexto = null;
let saida = null;
let ligado = true;
let alternar = false;
let saidaMusica = null;
let agendador = null;
let proximoTempo = 0;
let passo = 0;

/* Melodia original em colcheias (notas MIDI; 0 = pausa) e baixo a cada meio compasso. */
const MELODIA = [
  69, 0, 72, 0, 76, 0, 72, 74, 76, 0, 74, 0, 72, 0, 69, 0,
  67, 0, 69, 0, 72, 0, 74, 0, 72, 0, 69, 0, 67, 0, 0, 0,
  69, 0, 72, 0, 76, 0, 79, 0, 77, 0, 76, 0, 74, 0, 72, 0,
  74, 0, 72, 0, 71, 0, 67, 0, 69, 0, 0, 0, 0, 0, 0, 0,
];
const BAIXO = [45, 45, 41, 43, 45, 45, 43, 40];
const DURACAO_PASSO = 60 / 132 / 2;
const frequencia = (nota) => 440 * 2 ** ((nota - 69) / 12);

function garantirContexto() {
  if (contexto) return contexto;
  const Contexto = window.AudioContext || window.webkitAudioContext;
  if (!Contexto) return null;
  contexto = new Contexto();
  saida = contexto.createGain();
  saida.connect(contexto.destination);
  saidaMusica = contexto.createGain();
  saidaMusica.gain.value = 0.45;
  saidaMusica.connect(saida);
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
  if (!ligado) { pararMusica(); return; }
  if (garantirContexto()) retomar();
  tocarMusica();
}

function nota(destino, tipo, freq, inicio, duracao, volume) {
  const oscilador = contexto.createOscillator();
  const ganho = contexto.createGain();
  oscilador.type = tipo;
  oscilador.frequency.value = freq;
  ganho.gain.setValueAtTime(0.0001, inicio);
  ganho.gain.exponentialRampToValueAtTime(volume, inicio + 0.02);
  ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);
  oscilador.connect(ganho).connect(destino);
  oscilador.start(inicio);
  oscilador.stop(inicio + duracao + 0.02);
}

function agendar() {
  while (proximoTempo < contexto.currentTime + 0.15) {
    const melodia = MELODIA[passo % MELODIA.length];
    if (melodia) nota(saidaMusica, "square", frequencia(melodia), proximoTempo, DURACAO_PASSO * 1.6, 0.025);
    if (passo % 8 === 0) nota(saidaMusica, "triangle", frequencia(BAIXO[(passo / 8) % BAIXO.length]), proximoTempo, DURACAO_PASSO * 7, 0.06);
    proximoTempo += DURACAO_PASSO;
    passo++;
  }
}

/** Começa a música em loop, se o som estiver ligado. */
export function tocarMusica() {
  if (!ligado || agendador || !garantirContexto()) return;
  proximoTempo = contexto.currentTime + 0.1;
  passo = 0;
  agendador = setInterval(agendar, 40);
}

export function pararMusica() {
  clearInterval(agendador);
  agendador = null;
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
