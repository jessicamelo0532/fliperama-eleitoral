/**
 * Música de fundo e efeitos sonoros sintetizados no navegador, sem arquivos de áudio.
 */

let contexto = null;
let ativo = false;
let saidaMusica = null;
let agendador = null;
let proximoTempo = 0;
let passo = 0;

const EFEITOS = {
  dialogo: [[660, 0.05]],
  proposta: [[523, 0.08], [659, 0.08], [784, 0.12]],
  objeto: [[784, 0.08], [988, 0.08], [1175, 0.08], [1568, 0.2]],
  portao: [[392, 0.08], [523, 0.08], [659, 0.16]],
  erro: [[196, 0.12], [165, 0.18]],
};

/*
 * Fanfarras de vitória (notas MIDI por semicolcheia; 0 = pausa).
 * Cada voz é tocada em paralelo; a bateria usa ruído: "b" bumbo, "c" caixa.
 */
const VITORIAS = {
  fase: {
    passo: 60 / 168 / 4,
    vozes: [
      { tipo: "square", volume: 0.05, notas: [72, 76, 79, 84, 79, 84, 88, 0, 86, 0, 88, 0, 91, 91, 91, 91, 91, 91, 91, 0] },
      { tipo: "triangle", volume: 0.06, notas: [60, 0, 64, 0, 67, 0, 72, 0, 67, 0, 72, 0, 76, 76, 76, 76, 76, 76, 76, 0] },
      { tipo: "triangle", volume: 0.07, notas: [48, 0, 0, 0, 55, 0, 0, 0, 43, 0, 0, 0, 48, 48, 48, 48, 48, 48, 48, 0] },
    ],
    bateria: "b.c.b.c.bbc.cccc....",
  },
  final: {
    passo: 60 / 176 / 4,
    vozes: [
      { tipo: "square", volume: 0.05, notas: [
        67, 72, 76, 79, 72, 76, 79, 84, 69, 72, 77, 81, 72, 77, 81, 84,
        71, 74, 79, 83, 74, 79, 83, 86, 84, 0, 84, 86, 88, 0, 91, 0,
        93, 93, 91, 91, 88, 88, 91, 91, 96, 96, 96, 96, 96, 96, 96, 96, 96, 96, 96, 96, 0, 0, 0, 0] },
      { tipo: "triangle", volume: 0.06, notas: [
        60, 0, 64, 0, 67, 0, 64, 0, 65, 0, 69, 0, 72, 0, 69, 0,
        67, 0, 71, 0, 74, 0, 71, 0, 72, 0, 72, 74, 76, 0, 79, 0,
        81, 81, 79, 79, 76, 76, 79, 79, 84, 84, 84, 84, 84, 84, 84, 84, 84, 84, 84, 84, 0, 0, 0, 0] },
      { tipo: "triangle", volume: 0.08, notas: [
        48, 0, 0, 0, 48, 0, 0, 0, 41, 0, 0, 0, 41, 0, 0, 0,
        43, 0, 0, 0, 43, 0, 0, 0, 48, 0, 48, 0, 43, 0, 43, 0,
        45, 0, 45, 0, 43, 0, 43, 0, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 0, 0, 0, 0] },
    ],
    bateria: "b.c.b.c.b.c.b.c.b.c.b.c.bbcbbbcccb.c.b.c.ccccccccbcbcbcbc....",
  },
};

/* Melodia original em colcheias (notas MIDI; 0 = pausa) e baixo a cada meio compasso. */
const MELODIA = [
  72, 0, 76, 0, 79, 0, 76, 0, 74, 0, 72, 0, 69, 0, 0, 0,
  72, 0, 76, 0, 79, 0, 81, 0, 79, 0, 76, 0, 74, 0, 0, 0,
  76, 0, 79, 0, 81, 0, 79, 0, 76, 0, 74, 0, 72, 0, 74, 0,
  76, 0, 74, 0, 72, 0, 69, 0, 72, 0, 0, 0, 0, 0, 0, 0,
];
const BAIXO = [48, 45, 41, 43, 48, 45, 41, 43];
const DURACAO_PASSO = 60 / 96 / 2;

const frequencia = (nota) => 440 * 2 ** ((nota - 69) / 12);

function garantirContexto() {
  if (contexto) return contexto;
  const Contexto = window.AudioContext || window.webkitAudioContext;
  if (!Contexto) return null;
  contexto = new Contexto();
  saidaMusica = contexto.createGain();
  saidaMusica.gain.value = 0.5;
  saidaMusica.connect(contexto.destination);
  return contexto;
}

/* Com a tela bloqueada ou o navegador em segundo plano, o áudio fica suspenso. */
function retomarSeVisivel() {
  if (contexto && ativo && document.visibilityState === "visible") contexto.resume?.();
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") contexto?.suspend?.();
  else retomarSeVisivel();
});
window.addEventListener("pagehide", () => contexto?.suspend?.());
window.addEventListener("pageshow", retomarSeVisivel);
document.addEventListener("pointerdown", retomarSeVisivel, true);

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
    if (melodia) nota(saidaMusica, "triangle", frequencia(melodia), proximoTempo, DURACAO_PASSO * 1.8, 0.035);
    if (passo % 8 === 0) {
      const baixo = BAIXO[(passo / 8) % BAIXO.length];
      nota(saidaMusica, "sine", frequencia(baixo), proximoTempo, DURACAO_PASSO * 7, 0.05);
    }
    proximoTempo += DURACAO_PASSO;
    passo++;
  }
}

/** Liga ou desliga todo o áudio do jogo. Deve ser chamado a partir de um toque ou clique. */
export function definirSom(ligado) {
  ativo = ligado;
  if (!ligado) {
    pararMusica();
    return;
  }
  garantirContexto();
  retomarSeVisivel();
}

export function somLigado() {
  return ativo;
}

export function tocarMusica() {
  if (!ativo || agendador || !garantirContexto()) return;
  retomarSeVisivel();
  proximoTempo = contexto.currentTime + 0.1;
  passo = 0;
  agendador = setInterval(agendar, 40);
}

export function pararMusica() {
  clearInterval(agendador);
  agendador = null;
}

let ruido = null;

function bateria(tipo, inicio) {
  ruido ??= (() => {
    const buffer = contexto.createBuffer(1, contexto.sampleRate * 0.2, contexto.sampleRate);
    const dados = buffer.getChannelData(0);
    for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1;
    return buffer;
  })();
  const fonte = contexto.createBufferSource();
  const filtro = contexto.createBiquadFilter();
  const ganho = contexto.createGain();
  fonte.buffer = ruido;
  filtro.type = tipo === "b" ? "lowpass" : "highpass";
  filtro.frequency.value = tipo === "b" ? 180 : 1800;
  ganho.gain.setValueAtTime(tipo === "b" ? 0.35 : 0.12, inicio);
  ganho.gain.exponentialRampToValueAtTime(0.001, inicio + (tipo === "b" ? 0.12 : 0.08));
  fonte.connect(filtro).connect(ganho).connect(contexto.destination);
  fonte.start(inicio);
  fonte.stop(inicio + 0.2);
}

/**
 * Fanfarra de vitória: "fase" ao zerar um bairro, "final" ao zerar o jogo.
 * A música de fundo pausa durante a fanfarra e volta em seguida.
 */
export function tocarVitoria(nome) {
  if (!ativo || !garantirContexto()) return;
  const { passo: duracaoPasso, vozes, bateria: ritmo } = VITORIAS[nome];
  const tocandoMusica = Boolean(agendador);
  pararMusica();
  const inicio = contexto.currentTime + 0.05;
  let fim = 0;
  vozes.forEach(({ tipo, volume, notas }) => {
    notas.forEach((valor, i) => {
      if (!valor || notas[i - 1] === valor) return;
      let tamanho = 1;
      while (notas[i + tamanho] === valor) tamanho++;
      nota(contexto.destination, tipo, frequencia(valor), inicio + i * duracaoPasso, tamanho * duracaoPasso * 0.95, volume);
    });
    fim = Math.max(fim, notas.length * duracaoPasso);
  });
  [...ritmo].forEach((golpe, i) => { if (golpe !== ".") bateria(golpe, inicio + i * duracaoPasso); });
  if (tocandoMusica) setTimeout(() => { if (ativo) tocarMusica(); }, (fim + 0.6) * 1000);
}

export function tocar(nome) {
  if (!ativo || !garantirContexto()) return;
  let instante = contexto.currentTime;
  for (const [freq, duracao] of EFEITOS[nome] ?? []) {
    nota(contexto.destination, "square", freq, instante, duracao, 0.05);
    instante += duracao;
  }
}
