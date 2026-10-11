/**
 * Música de fundo e efeitos sonoros sintetizados no navegador, sem arquivos de áudio.
 * O áudio fica em silêncio sempre que a página sai de vista.
 */

let contexto = null;
let saida = null;
let ligado = true;
let ruidoBranco = null;
let saidaMusica = null;
let agendador = null;
let proximoTempo = 0;
let passo = 0;
let musicaAtual = "luta";
const VOLUME_GERAL = 2.4;
let querMusica = false;

/*
 * Músicas originais em colcheias (notas MIDI; 0 = pausa).
 * O baixo toca a cada `ritmoBaixo` colcheias.
 */
const MUSICAS = {
  luta: {
    bpm: 150, ritmoBaixo: 2, timbre: "square",
    melodia: [
      62, 0, 62, 65, 0, 62, 67, 0, 69, 0, 67, 65, 64, 0, 60, 0,
      62, 0, 62, 65, 0, 62, 67, 0, 70, 0, 69, 67, 69, 0, 0, 0,
      74, 0, 72, 0, 70, 0, 69, 0, 67, 0, 69, 70, 69, 0, 65, 0,
      67, 0, 65, 0, 64, 0, 60, 64, 62, 0, 0, 0, 62, 64, 65, 67,
    ],
    baixo: [38, 50, 38, 50, 34, 46, 36, 48],
  },
  chefe: {
    bpm: 184, ritmoBaixo: 1, timbre: "sawtooth",
    melodia: [
      62, 0, 63, 0, 62, 0, 66, 0, 65, 0, 63, 0, 62, 0, 61, 0,
      62, 0, 63, 0, 62, 0, 68, 0, 67, 0, 66, 65, 63, 0, 0, 0,
      74, 0, 73, 0, 70, 0, 69, 0, 68, 0, 67, 0, 66, 0, 63, 0,
      62, 63, 62, 61, 62, 0, 0, 0, 50, 0, 50, 0, 50, 0, 49, 0,
    ],
    baixo: [38, 38, 50, 38, 39, 39, 51, 39, 38, 38, 50, 38, 37, 37, 49, 37],
  },
  preguica: {
    bpm: 116, ritmoBaixo: 2, timbre: "triangle",
    melodia: [
      60, 0, 0, 63, 0, 65, 0, 0, 67, 0, 65, 0, 63, 0, 60, 0,
      58, 0, 0, 60, 0, 63, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0,
      60, 0, 0, 63, 0, 65, 0, 67, 70, 0, 67, 0, 65, 0, 63, 0,
      65, 0, 63, 0, 60, 0, 58, 0, 60, 0, 0, 0, 55, 0, 58, 0,
    ],
    baixo: [36, 43, 39, 43, 34, 41, 38, 41],
  },
  antiga: {
    bpm: 160, ritmoBaixo: 2, timbre: "square",
    melodia: [
      67, 0, 71, 0, 74, 0, 71, 0, 72, 0, 69, 0, 66, 0, 62, 0,
      67, 0, 71, 0, 74, 0, 79, 0, 78, 0, 76, 0, 74, 0, 0, 0,
      76, 0, 74, 0, 72, 0, 71, 0, 69, 0, 71, 0, 72, 0, 74, 0,
      71, 0, 67, 0, 69, 0, 66, 0, 67, 0, 0, 0, 62, 0, 0, 0,
    ],
    baixo: [43, 50, 43, 50, 38, 50, 38, 50],
  },
  relogio: {
    bpm: 168, ritmoBaixo: 1, timbre: "square", tique: true,
    melodia: [
      76, 0, 76, 0, 76, 0, 76, 0, 74, 0, 74, 0, 74, 0, 74, 0,
      72, 0, 72, 0, 72, 0, 72, 0, 71, 0, 72, 0, 74, 0, 71, 0,
      76, 0, 77, 0, 76, 0, 74, 0, 72, 0, 74, 0, 72, 0, 71, 0,
      69, 0, 71, 0, 72, 0, 74, 0, 76, 0, 0, 0, 64, 0, 0, 0,
    ],
    baixo: [45, 45, 45, 45, 40, 40, 43, 43, 41, 41, 41, 41, 40, 40, 44, 44],
  },
  festa: {
    bpm: 140, ritmoBaixo: 2, timbre: "square",
    melodia: [
      60, 0, 64, 67, 0, 64, 60, 0, 62, 0, 65, 69, 0, 65, 62, 0,
      64, 0, 67, 72, 0, 67, 64, 0, 65, 64, 62, 60, 0, 0, 60, 0,
      67, 0, 65, 64, 0, 62, 64, 0, 65, 0, 64, 62, 0, 60, 62, 0,
      64, 0, 62, 60, 0, 59, 60, 0, 62, 0, 67, 0, 72, 0, 0, 0,
    ],
    baixo: [48, 55, 52, 55, 53, 57, 55, 59],
  },
};
const frequencia = (nota) => 440 * 2 ** ((nota - 69) / 12);

function garantirContexto() {
  if (contexto) return contexto;
  const Contexto = window.AudioContext || window.webkitAudioContext;
  if (!Contexto) return null;
  contexto = new Contexto();
  saida = contexto.createGain();
  saida.gain.value = VOLUME_GERAL;
  saida.connect(contexto.destination);
  saidaMusica = contexto.createGain();
  saidaMusica.gain.value = 0.6;
  saidaMusica.connect(saida);
  ruidoBranco = contexto.createBuffer(1, Math.floor(contexto.sampleRate * 0.4), contexto.sampleRate);
  const amostras = ruidoBranco.getChannelData(0);
  for (let i = 0; i < amostras.length; i++) amostras[i] = Math.random() * 2 - 1;
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
  saida.gain.setValueAtTime(VOLUME_GERAL, contexto.currentTime);
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
  if (!ligado) { interromperAgendador(); return; }
  if (garantirContexto()) retomar();
  if (querMusica) tocarMusica();
}

function interromperAgendador() {
  clearInterval(agendador);
  agendador = null;
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
  const { bpm, ritmoBaixo, timbre, melodia, baixo, tique } = MUSICAS[musicaAtual];
  const duracao = 60 / bpm / 2;
  while (proximoTempo < contexto.currentTime + 0.15) {
    const notaMelodia = melodia[passo % melodia.length];
    if (notaMelodia) nota(saidaMusica, timbre, frequencia(notaMelodia), proximoTempo, duracao * 1.6, timbre === "sawtooth" ? 0.018 : 0.025);
    if (passo % ritmoBaixo === 0) nota(saidaMusica, "triangle", frequencia(baixo[(passo / ritmoBaixo) % baixo.length]), proximoTempo, duracao * ritmoBaixo * 0.9, 0.07);
    if (tique && passo % 2 === 0) nota(saidaMusica, "square", passo % 4 === 0 ? 1760 : 1320, proximoTempo, 0.03, 0.012);
    proximoTempo += duracao;
    passo++;
  }
}

/**
 * Toca uma música em loop, se o som estiver ligado; troca a atual se já houver uma tocando.
 * @param {"luta"|"preguica"|"antiga"|"relogio"|"chefe"|"festa"} [nome]
 */
export function tocarMusica(nome = musicaAtual) {
  querMusica = true;
  if (nome !== musicaAtual) { musicaAtual = nome; passo = 0; }
  if (!ligado || agendador || !garantirContexto()) return;
  proximoTempo = contexto.currentTime + 0.1;
  passo = 0;
  agendador = setInterval(agendar, 40);
}

export function pararMusica() {
  querMusica = false;
  interromperAgendador();
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

function ruido(duracao, volume, corte, atraso = 0) {
  if (!ligado || !contexto || escondido()) return;
  const inicio = contexto.currentTime + atraso;
  const fonte = contexto.createBufferSource();
  const filtro = contexto.createBiquadFilter();
  const ganho = contexto.createGain();
  fonte.buffer = ruidoBranco;
  filtro.type = "lowpass";
  filtro.frequency.value = corte;
  ganho.gain.setValueAtTime(volume, inicio);
  ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);
  fonte.connect(filtro).connect(ganho).connect(saida);
  fonte.start(inicio);
  fonte.stop(inicio + duracao);
}

export const efeitos = {
  golpe() { ruido(0.12, 0.16, 1800); tom(220, 0.1, "square", 0.05, 90); },
  golpeForte() { ruido(0.2, 0.2, 1200); tom(160, 0.18, "square", 0.07, 50); },
  defesa() { tom(900, 0.06, "square", 0.04, 700); },
  vento() { ruido(0.05, 0.04, 3000); },
  pulo() { tom(300, 0.1, "square", 0.035, 600); },
  carga() { tom(300, 0.18, "sawtooth", 0.04, 900); },
  choque() { tom(1200, 0.15, "triangle", 0.07, 300); ruido(0.1, 0.08, 4000); },
  nocaute() { tom(600, 0.6, "square", 0.07, 60); ruido(0.4, 0.12, 800); },
  baque() { ruido(0.15, 0.13, 500); },
  letra() { tom(520, 0.025, "square", 0.02); },
  escolha() { tom(660, 0.08, "square", 0.04, 990); },
  vitoria() { [523, 659, 784, 1046].forEach((f, k) => tom(f, 0.14, "square", 0.045, null, k * 0.12)); },
  /** Fanfarra de vitória com estrondos de fogos. */
  euforia() {
    [262, 330, 392, 523].forEach((f, k) => tom(f, k === 3 ? 0.5 : 0.16, "triangle", 0.09, null, k * 0.13));
    [0.1, 0.6, 1.0, 1.5].forEach((atraso) => { ruido(0.7, 0.3, 260, atraso); tom(110, 0.5, "triangle", 0.12, 40, atraso); });
  },
  alerta() { [0, 0.35, 0.7].forEach((atraso) => tom(220, 0.28, "sawtooth", 0.06, 110, atraso)); },
  derrota() { [392, 330, 262].forEach((f, k) => tom(f, 0.22, "triangle", 0.06, f * 0.98, k * 0.2)); },
};
