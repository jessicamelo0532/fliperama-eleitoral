/**
 * Regras da luta: movimento, golpes, defesa, especial, projéteis e o comportamento dos vilões.
 * A simulação roda em passos fixos de 1/60 s sobre um palco de 320x180 px.
 */

import { W, H, px, larguraTexto, escrever, escreverComContorno, desenharCenario } from "./cenarios.js";
import { desenharTorcida } from "./torcida.js";
import { desenharLutador, desenharVilao, APARENCIAS, CORES_DO_ESPECIAL } from "./lutadores.js";

const CHAO = 156;
const GRAVIDADE = 0.32;
const IMPULSO_PULO = -5.6;
const MARGEM = 14;
/* Deitado, o herói ocupa o comprimento do corpo para trás; a margem maior evita que ele saia da tela. */
const MARGEM_DEITADO = 28;
const CUSTO_ESPECIAL = 50;
const MOVIMENTO_REDUZIDO = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Golpes do herói: quadros de preparo, ativos e de recuperação; caixa [x, y, largura, altura] a partir dos pés. */
const GOLPES = {
  soco: { nome: "soco", preparo: 4, ativo: 4, recuperacao: 9, dano: 5, caixa: [4, -33, 14, 8], empurrao: 1.3, atordoa: 14 },
  chute: { nome: "chute", preparo: 7, ativo: 5, recuperacao: 13, dano: 8, caixa: [3, -20, 18, 8], empurrao: 2.6, atordoa: 18 },
  aereo: { nome: "aereo", preparo: 3, ativo: 12, recuperacao: 4, dano: 7, caixa: [1, -22, 16, 12], empurrao: 2.0, atordoa: 16 },
  especial: { nome: "especial", preparo: 10, ativo: 0, recuperacao: 16, projetil: true },
  arremesso: { nome: "arremesso", preparo: 12, ativo: 0, recuperacao: 18, projetil: true },
};

/** Força, ritmo e ataques de cada vilão, pelo id de fases.json. */
const VILOES = {
  "fake-news": { vida: 80, velocidade: 0.8, dano: 0.65, pensa: 34, defende: 0.12, reage: 0.15, recarga: 150, altura: 70, largura: 34, projetil: { tipo: "balao", rotulos: ["URGENTE!", "COMPARTILHA!"], velocidade: 2.5 } },
  desanimo: { vida: 95, velocidade: 0.7, dano: 0.8, pensa: 32, defende: 0.25, reage: 0.3, recarga: 110, altura: 62, largura: 44, projetil: { tipo: "almofada", rotulos: ["NEM VOU", "TANTO FAZ"] } },
  retrocesso: { vida: 105, velocidade: 0.95, dano: 0.85, pensa: 26, defende: 0.3, reage: 0.4, recarga: 130, altura: 72, largura: 24, projetil: { tipo: "arco", rotulos: ["APAGA"] } },
  escala: { vida: 115, velocidade: 0.9, dano: 0.95, pensa: 24, defende: 0.35, reage: 0.45, recarga: 110, altura: 68, largura: 32, projetil: { tipo: "rasteiro", rotulos: ["6X1"], velocidade: 2.2 } },
  desmonte: { vida: 150, velocidade: 1.05, dano: 1.05, pensa: 20, defende: 0.42, reage: 0.55, recarga: 100, altura: 76, largura: 40, projetil: { tipo: "onda", rotulos: ["EMENDA"], velocidade: 2.4 } },
};

const ESTILO_PROJETIL = {
  balao: ["#c8f7c5", "#1f5a2a", "#1f8a44"],
  almofada: ["#e8b923", "#5a3a22", "#b07a4a"],
  arco: ["#ff8fb8", "#5a1030", "#d65a8a"],
  rasteiro: ["#f4f1ea", "#d23c28", "#5c5c66"],
  onda: ["#f4f1ea", "#7a0f2e", "#5a3a10"],
};

const sortear = (lista) => lista[Math.floor(Math.random() * lista.length)];
const limitar = (v, min, max) => (v < min ? min : v > max ? max : v);
const sobrepoe = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/* ---------- Estado ---------- */

const luta = {
  heroi: null,
  vilao: null,
  cenario: "centro",
  projeteis: [],
  particulas: [],
  baloes: [],
  quadro: 0,
  tremor: 0,
  congelado: 0,
  torcida: 0,
};

let efeitos = {};

/** Define as funções de som chamadas durante a luta. */
export function ligarEfeitos(funcoes) {
  efeitos = funcoes;
}

class Lutador {
  constructor({ ehHeroi, vida, velocidade, forca, aparencia, id, vilao, especial, vantagem = false }) {
    Object.assign(this, { ehHeroi, id, aparencia, vilao, especial, vantagem });
    this.vidaMaxima = vida;
    this.vida = vida;
    this.velocidade = velocidade;
    this.forca = forca;
    this.energia = 0;
    this.animacao = 0;
    this.sequencia = 0;
    this.tempoSequencia = 0;
    this.invulneravel = 0;
    this.tempoIa = 0;
    this.intencaoMantida = {};
    this.recarga = vilao?.recarga ?? 0;
    this.furioso = false;
    this.ultimoControle = -1;
    this.posicionar(160, 1);
  }

  get largura() { return this.vilao ? this.vilao.largura : 12; }
  get altura() { return this.vilao ? this.vilao.altura : 44; }

  posicionar(x, frente) {
    Object.assign(this, { x, frente, y: CHAO, vx: 0, vy: 0, noChao: true, estado: "parado", golpe: null, atordoado: 0, brilho: 0 });
  }

  podeAgir() {
    return !this.golpe && ["parado", "andando", "pulando", "defendendo"].includes(this.estado);
  }

  iniciarGolpe(golpe) {
    this.golpe = { golpe, t: 0, acertou: false };
    this.estado = "golpe";
    if (this.noChao) this.vx = 0;
    golpe.projetil ? efeitos.carga?.() : efeitos.vento?.();
  }

  controlar(c, oponente) {
    this.ultimoControle = luta.quadro;
    if (!this.podeAgir()) return;
    if (this.noChao) this.frente = oponente.x >= this.x ? 1 : -1;
    if (c.defender && this.noChao) { this.estado = "defendendo"; this.vx = 0; return; }
    if (this.estado === "defendendo") this.estado = "parado";
    if (c.especial && this.ehHeroi) {
      c.consumir?.("especial");
      if (this.noChao && this.energia >= CUSTO_ESPECIAL) {
        this.energia -= CUSTO_ESPECIAL;
        this.iniciarGolpe(GOLPES.especial);
        return;
      }
      if (this.energia < CUSTO_ESPECIAL) luta.semEnergia = 20;
    }
    if (c.arremesso && this.noChao) { this.iniciarGolpe(GOLPES.arremesso); return; }
    if (c.soco) { c.consumir?.("soco"); this.iniciarGolpe(this.noChao ? GOLPES.soco : GOLPES.aereo); return; }
    if (c.chute) { c.consumir?.("chute"); this.iniciarGolpe(this.noChao ? GOLPES.chute : GOLPES.aereo); return; }
    const direcao = (c.direita ? 1 : 0) - (c.esquerda ? 1 : 0);
    if (this.noChao) {
      this.vx = direcao * 1.25 * this.velocidade;
      this.estado = direcao ? "andando" : "parado";
      if (c.pular) {
        c.consumir?.("pular");
        Object.assign(this, { vy: IMPULSO_PULO, noChao: false, estado: "pulando", vx: direcao * 1.5 * this.velocidade });
        efeitos.pulo?.();
      }
    } else {
      this.vx = limitar(this.vx + direcao * 0.18, -2.2, 2.2);
      if (c.pular && this.ehHeroi && !this.puloDuplo) {
        c.consumir?.("pular");
        Object.assign(this, { vy: IMPULSO_PULO * 0.85, puloDuplo: true });
        efeitos.pulo?.();
        poeira(this.x, 3);
      }
    }
  }

  atualizar(oponente) {
    this.animacao++;
    if (this.brilho > 0) this.brilho--;
    if (this.invulneravel > 0) this.invulneravel--;
    if (this.tempoSequencia > 0 && --this.tempoSequencia === 0) this.sequencia = 0;
    if (!this.noChao) this.cair();
    const margem = this.ehHeroi && this.estado === "nocaute" ? MARGEM_DEITADO : MARGEM;
    this.x = limitar(this.x + this.vx, margem, W - margem);
    if (this.estado === "nocaute") { if (this.noChao) this.vx *= 0.8; return; }
    if (this.estado === "vitoria") { this.vx = 0; return; }
    if (this.estado === "ferido") {
      if (this.noChao) this.vx *= 0.82;
      if (--this.atordoado <= 0 && this.noChao) this.estado = "parado";
      return;
    }
    if (this.golpe) { this.avancarGolpe(oponente); return; }
    if (this.estado === "andando" && this.ultimoControle !== luta.quadro) this.estado = "parado";
    if (this.noChao && this.estado !== "andando") this.vx *= 0.7;
  }

  cair() {
    this.vy += GRAVIDADE;
    this.y += this.vy;
    if (this.y < CHAO) return;
    Object.assign(this, { y: CHAO, vy: 0, noChao: true, puloDuplo: false });
    if (this.estado === "nocaute") {
      efeitos.baque?.();
      if (!MOVIMENTO_REDUZIDO) luta.tremor = Math.max(luta.tremor, 3);
      poeira(this.x, 8);
      return;
    }
    poeira(this.x, 3);
    if (this.estado === "pulando") this.estado = "parado";
    if (this.golpe?.golpe === GOLPES.aereo) { this.golpe = null; this.estado = "parado"; }
  }

  avancarGolpe(oponente) {
    const g = this.golpe;
    const d = g.golpe;
    g.t++;
    if (this.noChao) this.vx *= 0.6;
    if (d === GOLPES.especial && g.t < d.preparo && g.t % 2 === 0) {
      luta.particulas.push({ x: this.x - this.frente * 8 + (Math.random() * 6 - 3), y: this.y - 30, vx: 0, vy: -0.4, g: 0, vida: 12, cor: "#bfe3ff", tam: 1 });
    }
    if (d.projetil && g.t === d.preparo) lancarProjetil(this);
    if (d.caixa && !g.acertou && g.t >= d.preparo && g.t < d.preparo + d.ativo && oponente.estado !== "nocaute") {
      const caixa = caixaDoGolpe(this, d.caixa);
      if (sobrepoe(caixa, areaDoCorpo(oponente))) {
        g.acertou = true;
        acertar(oponente, this, d.dano * this.forca, d.empurrao, d.atordoa, this.frente, caixa);
      }
    }
    if (g.t >= d.preparo + d.ativo + d.recuperacao) {
      this.golpe = null;
      this.estado = this.noChao ? "parado" : "pulando";
    }
  }

  pose() {
    if (this.estado === "nocaute") return this.noChao ? "ko" : "hurt";
    if (this.estado === "vitoria") return "win";
    if (this.estado === "ferido") return "hurt";
    if (this.estado === "defendendo") return "block";
    if (this.golpe) {
      const { golpe: d, t } = this.golpe;
      if (d.nome === "soco") return t >= d.preparo && t < d.preparo + d.ativo + 4 ? "punch" : "idle";
      if (d.nome === "chute" || d.nome === "aereo") return t >= d.preparo ? "kick" : "jump";
      return t < d.preparo ? "block" : "special";
    }
    if (!this.noChao) return "jump";
    return this.estado === "andando" ? "walk" : "idle";
  }
}

/* Os golpes do vilão usam caixas na altura do braço dele. */
function golpesDoVilao(vilao) {
  const alturaBraco = { "fake-news": -50, desanimo: -38, retrocesso: -40, escala: -46, desmonte: -56 }[vilao.id];
  const alcance = vilao.id === "desanimo" ? 36 : 24;
  return {
    soco: { ...GOLPES.soco, caixa: [8, alturaBraco, alcance, 10], preparo: 6 },
    chute: { ...GOLPES.chute, caixa: [8, alturaBraco + 4, alcance + 2, 12], preparo: 10, dano: 9 },
  };
}

function caixaDoGolpe(f, [x, y, w, h]) {
  return { x: f.frente === 1 ? f.x + x : f.x - x - w, y: f.y + y, w, h };
}

function areaDoCorpo(f) {
  if (f.estado === "nocaute" && f.noChao) return { x: f.x - 14, y: f.y - 8, w: 28, h: 8 };
  return { x: f.x - f.largura / 2, y: f.y - f.altura, w: f.largura, h: f.altura };
}

function acertar(alvo, autor, dano, empurrao, atordoa, direcao, caixa) {
  if (alvo.estado === "nocaute" || alvo.invulneravel > 0) return;
  const [cx, cy] = [caixa.x + caixa.w / 2, caixa.y + caixa.h / 2];
  if (alvo.estado === "defendendo" && alvo.frente === -direcao) {
    alvo.vida = Math.max(Math.min(alvo.vida, 1), alvo.vida - dano * 0.2);
    alvo.vx = direcao * empurrao * 0.7;
    faiscas(cx, cy, "#9fd0ff", 6);
    texto(cx, cy - 8, "DEFESA");
    efeitos.defesa?.();
    autor.energia = Math.min(100, autor.energia + 4);
    alvo.energia = Math.min(100, alvo.energia + 6);
    luta.congelado = 2;
    return;
  }
  alvo.sequencia = alvo.estado === "ferido" ? alvo.sequencia + 1 : 1;
  alvo.tempoSequencia = 45;
  let [forca, tempo, lancado] = [empurrao, atordoa, !alvo.noChao];
  if (alvo.sequencia >= 3) {
    forca = Math.max(empurrao, 3.6);
    tempo = Math.max(atordoa, 26);
    lancado = true;
    alvo.sequencia = 0;
    alvo.invulneravel = 55;
  }
  alvo.vida = Math.max(0, alvo.vida - dano);
  Object.assign(alvo, { estado: "ferido", golpe: null, atordoado: tempo, vx: direcao * forca, brilho: 8 });
  if (lancado) { alvo.vy = -2.6; alvo.noChao = false; }
  if (alvo.vida <= 0) Object.assign(alvo, { estado: "nocaute", vx: direcao * 2.6, vy: -3.6, noChao: false, invulneravel: 0 });
  autor.energia = Math.min(100, autor.energia + (autor.vantagem ? 15 : 10));
  alvo.energia = Math.min(100, alvo.energia + 5);
  const forte = dano >= 9;
  faiscas(cx, cy, "#ffd23f", forte ? 14 : 9);
  faiscas(cx, cy, "#ffffff", 4);
  texto(cx, cy - 8, sortear(forte ? ["POW!", "BAM!"] : ["PAH!", "TUM!", "POW!"]));
  forte ? efeitos.golpeForte?.() : efeitos.golpe?.();
  luta.congelado = forte ? 6 : 4;
  if (!MOVIMENTO_REDUZIDO) luta.tremor = Math.max(luta.tremor, forte ? 4 : 2);
  if (!alvo.ehHeroi) luta.torcida = Math.max(luta.torcida, 90);
}

function separar(a, b) {
  if (a.estado === "nocaute" || b.estado === "nocaute" || Math.abs(a.y - b.y) > 30) return;
  const minimo = (a.largura + b.largura) / 2 + 2;
  const dx = b.x - a.x;
  if (Math.abs(dx) >= minimo) return;
  const sentido = dx >= 0 ? 1 : -1;
  const sobra = (minimo - Math.abs(dx)) / 2;
  a.x -= sentido * sobra;
  b.x += sentido * sobra;
  for (const [f, outro, s] of [[a, b, sentido], [b, a, -sentido]]) {
    if (f.x < MARGEM) { f.x = MARGEM; outro.x = f.x + s * minimo; }
    if (f.x > W - MARGEM) { f.x = W - MARGEM; outro.x = f.x + s * minimo; }
  }
}

/* ---------- Comportamento do vilão ---------- */

function intencaoDoVilao(V, P) {
  const d = V.vilao;
  const raiva = V.furioso ? 1.35 : 1;
  V.recarga -= raiva;
  if (!V.podeAgir()) { V.tempoIa = Math.min(V.tempoIa, 6); return {}; }
  const distancia = Math.abs(P.x - V.x) - (V.largura - 12) / 2;
  const sentido = P.x > V.x ? 1 : -1;
  const [ir, fugir] = sentido > 0 ? ["direita", "esquerda"] : ["esquerda", "direita"];
  const vindo = luta.projeteis.find((p) => p.doHeroi && Math.sign(p.vx) === -sentido && Math.abs(p.x - V.x) < 70);
  if (vindo && V.reagiuA !== vindo) {
    V.reagiuA = vindo;
    if (Math.random() < d.reage) {
      if (Math.random() < 0.5) { V.tempoIa = 6; V.intencaoMantida = {}; return { pular: true, [ir]: true }; }
      V.intencaoMantida = { defender: true };
      V.tempoIa = 28;
      return V.intencaoMantida;
    }
  }
  if (P.golpe && P.golpe.t < 3 && distancia < 34 && V.reagiuAoGolpe !== P.golpe) {
    V.reagiuAoGolpe = P.golpe;
    if (Math.random() < d.defende) { V.intencaoMantida = { defender: true }; V.tempoIa = 18; return V.intencaoMantida; }
  }
  if (--V.tempoIa > 0) return V.intencaoMantida;
  V.tempoIa = Math.round((d.pensa / raiva) * (0.6 + Math.random() * 0.8));
  V.intencaoMantida = {};
  const manter = (intencao, tempo) => { V.intencaoMantida = intencao; if (tempo) V.tempoIa = tempo; return intencao; };
  if (distancia < 26) {
    const r = Math.random();
    if (r < 0.45) return { soco: true };
    if (r < 0.75) return { chute: true };
    if (r < 0.88) return manter({ [fugir]: true }, 12);
    return manter({ defender: true }, 14);
  }
  if (distancia < 38) return Math.random() < 0.55 ? { chute: true } : manter({ [ir]: true }, 10);
  if (distancia > 56 && V.recarga <= 0 && Math.random() < 0.75) {
    V.recarga = d.recarga * (0.7 + Math.random() * 0.6);
    return { arremesso: true };
  }
  if (Math.random() < 0.1 * raiva) { V.intencaoMantida = { [ir]: true }; return { pular: true, [ir]: true }; }
  return manter({ [ir]: true });
}

/* ---------- Projéteis e partículas ---------- */

function lancarProjetil(f) {
  const doHeroi = f.ehHeroi;
  const alvo = doHeroi ? luta.vilao : luta.heroi;
  const config = doHeroi ? { tipo: "especial", rotulos: [f.especial.rotulo], velocidade: 3.2 } : f.vilao.projetil;
  const [sx, sy] = [f.x + f.frente * (f.largura / 2 + 8), f.y - (doHeroi ? 30 : Math.round(f.altura * 0.55))];
  const criar = (extra) => luta.projeteis.push({
    doHeroi, autor: f, tipo: config.tipo, rotulo: sortear(config.rotulos), x: sx, y: sy,
    vx: f.frente * (config.velocidade || 2.4), vy: 0, gravidade: 0, t: 0, dano: (doHeroi ? 12 : 10) * f.forca,
    cores: doHeroi ? CORES_DO_ESPECIAL[f.id] : ESTILO_PROJETIL[config.tipo], ...extra,
  });
  if (config.tipo === "arco" || config.tipo === "almofada") {
    const [vy, g] = [-3.4, 0.13];
    const tempo = (-vy + Math.sqrt(vy * vy + 2 * g * (CHAO - sy))) / g;
    let vx = limitar((alvo.x - sx) / tempo, -3, 3);
    if (Math.sign(vx) !== f.frente) vx = f.frente * 0.5;
    criar({ vx, vy, gravidade: g });
  } else if (config.tipo === "rasteiro") {
    criar({ y: f.y - 11 });
  } else if (config.tipo === "onda") {
    criar({ base: sy });
  } else {
    criar({});
    if (f.furioso) criar({ y: f.y - 12, vx: f.frente * 2.1 });
  }
  falar(f, doHeroi ? `${f.especial.nome}!` : sortear(f.vilao.gritos));
}

function caixaDoProjetil(p) {
  const w = larguraTexto(p.rotulo) + 6;
  const h = 9;
  return { x: p.x - w / 2, y: p.y - h / 2, w, h };
}

function avancarProjeteis() {
  for (const p of luta.projeteis) {
    p.t++;
    p.vy += p.gravidade;
    p.x += p.vx;
    p.y += p.vy;
    if (p.base !== undefined) p.y = p.base + Math.sin(p.t * 0.14) * 9;
    if (p.doHeroi && p.t % 3 === 0) luta.particulas.push({ x: p.x - Math.sign(p.vx) * 10, y: p.y + (Math.random() * 4 - 2), vx: 0, vy: 0, g: 0, vida: 10, cor: "#ffe27a", tam: 1 });
    if (p.x < -40 || p.x > W + 40 || p.t > 400) { p.fim = true; continue; }
    if (p.y > CHAO - 2) { p.fim = true; poeira(p.x, 4); continue; }
    const alvo = p.doHeroi ? luta.vilao : luta.heroi;
    if (!alvo || alvo.estado === "nocaute" || alvo.invulneravel > 0) continue;
    const caixa = caixaDoProjetil(p);
    if (sobrepoe(caixa, areaDoCorpo(alvo))) {
      p.fim = true;
      acertar(alvo, p.autor, alvo.vantagem ? p.dano / 2 : p.dano, 2.2, 20, p.vx >= 0 ? 1 : -1, caixa);
    }
  }
  for (const a of luta.projeteis) {
    if (a.fim || !a.doHeroi) continue;
    for (const b of luta.projeteis) {
      if (b.fim || b.doHeroi || !sobrepoe(caixaDoProjetil(a), caixaDoProjetil(b))) continue;
      a.fim = b.fim = true;
      const [x, y] = [(a.x + b.x) / 2, (a.y + b.y) / 2];
      faiscas(x, y, "#ffffff", 12);
      texto(x, y - 8, "ANULADO!");
      efeitos.choque?.();
      luta.torcida = Math.max(luta.torcida, 60);
    }
  }
  luta.projeteis = luta.projeteis.filter((p) => !p.fim);
}

function faiscas(x, y, cor, n) {
  for (let i = 0; i < n; i++) luta.particulas.push({ x, y, vx: (Math.random() * 2 - 1) * 2.2, vy: -Math.random() * 2.2, g: 0.14, vida: 14 + Math.floor(Math.random() * 10), cor, tam: Math.random() < 0.3 ? 2 : 1 });
}

function poeira(x, n) {
  for (let i = 0; i < n; i++) luta.particulas.push({ x: x + (Math.random() - 0.5) * 12, y: CHAO - 1, vx: (Math.random() - 0.5) * 1.2, vy: -Math.random() * 0.5, g: 0.02, vida: 16, cor: "rgba(235,225,205,.85)", tam: 2 });
}

function texto(x, y, conteudo) {
  luta.particulas.push({ x, y, vx: 0, vy: -0.45, g: 0, vida: 30, texto: conteudo, cor: "#ffe27a" });
}

function avancarParticulas() {
  for (const p of luta.particulas) {
    p.vida--;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.g;
  }
  luta.particulas = luta.particulas.filter((p) => p.vida > 0);
}

/** Mostra um balão de fala sobre o lutador por um segundo e meio. */
export function falar(f, conteudo) {
  luta.baloes = luta.baloes.filter((b) => b.autor !== f);
  luta.baloes.push({ autor: f, texto: conteudo, tempo: 90 });
}

/* ---------- API da luta ---------- */

/**
 * Prepara uma luta nova.
 * @param {object} heroi item de personagens.json
 * @param {object} fase item de fases.json
 */
export function novaLuta(heroi, fase) {
  const vilao = { ...VILOES[fase.id], id: fase.id, gritos: fase.gritos };
  luta.heroi = new Lutador({ ehHeroi: true, id: heroi.id, vida: heroi.vida, velocidade: heroi.velocidade, forca: heroi.forca, aparencia: APARENCIAS[heroi.id], especial: heroi.especial, vantagem: heroi.pontosFortes.includes(fase.id) });
  luta.vilao = new Lutador({ ehHeroi: false, id: fase.id, vida: vilao.vida, velocidade: vilao.velocidade, forca: vilao.dano, vilao });
  luta.vilao.golpes = golpesDoVilao(vilao);
  luta.heroi.posicionar(96, 1);
  luta.vilao.posicionar(228, -1);
  Object.assign(luta, { cenario: fase.cenario, projeteis: [], particulas: [], baloes: [], tremor: 0, congelado: 0, torcida: 0, semEnergia: 0, festa: false });
  return luta;
}

/** Deixa o vilão mais rápido e agressivo depois do diálogo do meio da luta. */
export function enfurecer() {
  luta.projeteis = [];
  luta.baloes = [];
  for (const f of [luta.heroi, luta.vilao]) {
    Object.assign(f, { golpe: null, estado: "parado", vx: 0, vy: 0, y: CHAO, noChao: true, brilho: 0, invulneravel: 0 });
  }
  luta.vilao.furioso = true;
  luta.vilao.velocidade *= 1.2;
  luta.vilao.frente = luta.heroi.x > luta.vilao.x ? 1 : -1;
  luta.heroi.frente = -luta.vilao.frente;
}

export function comemorar(vencedor) {
  Object.assign(vencedor, { golpe: null, estado: "vitoria", vx: 0 });
  luta.torcida = vencedor.ehHeroi ? 400 : 0;
  luta.projeteis = [];
  luta.baloes = [];
}

/** Avança só a animação, sem controle (diálogos, apresentações). */
export function passoParado() {
  luta.quadro++;
  luta.heroi?.atualizar(luta.vilao);
  luta.vilao?.atualizar(luta.heroi);
  passoComum();
}

/**
 * Avança um quadro da luta com o controle do jogador.
 * @returns {"vitoria"|"derrota"|null}
 */
export function passoLuta(entrada) {
  luta.quadro++;
  if (luta.congelado > 0) { luta.congelado--; passoComum(); return null; }
  const { heroi: P, vilao: V } = luta;
  P.controlar(entrada, V);
  const intencao = intencaoDoVilao(V, P);
  if (intencao.soco) { V.controlar({}, P); if (V.podeAgir()) V.iniciarGolpe(V.golpes.soco); }
  else if (intencao.chute) { V.controlar({}, P); if (V.podeAgir()) V.iniciarGolpe(V.golpes.chute); }
  else V.controlar(intencao, P);
  P.atualizar(V);
  V.atualizar(P);
  separar(P, V);
  avancarProjeteis();
  passoComum();
  if (V.estado === "nocaute") return "vitoria";
  if (P.estado === "nocaute") return "derrota";
  return null;
}

/** Avança a queda dos lutadores depois de um nocaute. */
export function passoNocaute() {
  luta.quadro++;
  if (luta.quadro % 2 === 0) {
    luta.heroi.atualizar(luta.vilao);
    luta.vilao.atualizar(luta.heroi);
  }
  passoComum();
}

const CORES_DOS_FOGOS = ["#ffdf00", "#2ecc71", "#ff3b30", "#ffffff", "#5ad1ff"];

function soltarFogos() {
  const [x, y] = [30 + Math.random() * (W - 60), 20 + Math.random() * 50];
  const cor = CORES_DOS_FOGOS[Math.floor(Math.random() * CORES_DOS_FOGOS.length)];
  for (let i = 0; i < 26; i++) {
    const angulo = (i / 26) * Math.PI * 2;
    const forca = 1 + Math.random() * 1.2;
    luta.particulas.push({ x, y, vx: Math.cos(angulo) * forca, vy: Math.sin(angulo) * forca, g: 0.03, vida: 40 + Math.floor(Math.random() * 15), cor, tam: Math.random() < 0.3 ? 2 : 1 });
  }
}

/** Prepara a comemoração final: o herói no centro da praça e fogos no céu. */
export function iniciarFesta() {
  luta.heroi.posicionar(160, 1);
  comemorar(luta.heroi);
  Object.assign(luta, { vilao: null, cenario: "tres", projeteis: [], baloes: [], festa: true });
}

function passoComum() {
  if (luta.festa) {
    luta.torcida = 60;
    const heroi = luta.heroi;
    if (heroi.noChao && luta.quadro % 40 === 0) Object.assign(heroi, { vy: -4.4, noChao: false });
    if (luta.quadro % 24 === 0) soltarFogos();
  }
  if (luta.tremor > 0) luta.tremor = luta.tremor > 0.5 ? luta.tremor * 0.82 : 0;
  if (luta.torcida > 0) luta.torcida--;
  if (luta.semEnergia > 0) luta.semEnergia--;
  for (const b of luta.baloes) b.tempo--;
  luta.baloes = luta.baloes.filter((b) => b.tempo > 0);
  avancarParticulas();
}

export const metadeDaVida = () => luta.vilao.vida <= luta.vilao.vidaMaxima / 2;
export const estadoDaLuta = () => luta;

/* ---------- Desenho ---------- */

const SPRITE = document.createElement("canvas");
SPRITE.width = 180;
SPRITE.height = 100;
const contextoSprite = SPRITE.getContext("2d");
const SILHUETA = document.createElement("canvas");
SILHUETA.width = 180;
SILHUETA.height = 100;
const contextoSilhueta = SILHUETA.getContext("2d");
const [ORIGEM_X, ORIGEM_Y] = [90, 92];

function pintarSilhueta(cor) {
  contextoSilhueta.globalCompositeOperation = "source-over";
  contextoSilhueta.clearRect(0, 0, SILHUETA.width, SILHUETA.height);
  contextoSilhueta.drawImage(SPRITE, 0, 0);
  contextoSilhueta.globalCompositeOperation = "source-in";
  contextoSilhueta.fillStyle = cor;
  contextoSilhueta.fillRect(0, 0, SILHUETA.width, SILHUETA.height);
}

function pintarLutador(f) {
  contextoSprite.clearRect(0, 0, SPRITE.width, SPRITE.height);
  if (f.ehHeroi) {
    desenharLutador(contextoSprite, f.aparencia, f.pose(), f.animacao, f.frente, ORIGEM_X, ORIGEM_Y);
    return;
  }
  const pose = f.pose();
  if (pose === "ko") {
    contextoSprite.save();
    contextoSprite.translate(ORIGEM_X, ORIGEM_Y - f.largura / 2);
    contextoSprite.rotate((-f.frente * Math.PI) / 2);
    desenharVilao(contextoSprite, f.id, f.animacao, f.frente, 0, 0, "hurt");
    contextoSprite.restore();
    return;
  }
  const poseVilao = pose === "punch" || pose === "kick" ? "golpe" : pose === "hurt" ? "hurt" : pose === "walk" ? "walk" : "idle";
  desenharVilao(contextoSprite, f.id, f.animacao, f.frente, ORIGEM_X, ORIGEM_Y, poseVilao);
}

function desenharFigura(c, f) {
  pintarLutador(f);
  pintarSilhueta("#0b0b12");
  const [dx, dy] = [Math.round(f.x) - ORIGEM_X, Math.round(f.y) - ORIGEM_Y];
  for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) c.drawImage(SILHUETA, dx + ox, dy + oy);
  const piscando = (f.brilho > 0 && f.brilho & 2) || (f.invulneravel > 0 && f.estado !== "ferido" && f.invulneravel & 4);
  if (piscando) { pintarSilhueta("#ffffff"); c.drawImage(SILHUETA, dx, dy); } else c.drawImage(SPRITE, dx, dy);
}

/** Desenha o lutador parado num canvas pequeno, para cards e diálogos. */
export function retrato(destino, { heroi, vilaoId, ferido = false, recorte }) {
  contextoSprite.clearRect(0, 0, SPRITE.width, SPRITE.height);
  if (heroi) desenharLutador(contextoSprite, APARENCIAS[heroi], ferido ? "hurt" : "idle", 0, 1, ORIGEM_X, ORIGEM_Y);
  else desenharVilao(contextoSprite, vilaoId, 0, -1, ORIGEM_X, ORIGEM_Y, ferido ? "hurt" : "idle");
  pintarSilhueta("#0b0b12");
  const c = destino.getContext("2d");
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, destino.width, destino.height);
  const [sx, sy, sw, sh] = recorte;
  for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) c.drawImage(SILHUETA, sx, sy, sw, sh, ox, oy, sw, sh);
  c.drawImage(SPRITE, sx, sy, sw, sh, 0, 0, sw, sh);
}

/** Recorte do rosto (x, y, largura, altura) no canvas de sprite, para os diálogos. */
export function recorteDoRosto(heroi, vilaoId) {
  if (heroi) return [ORIGEM_X - 13, ORIGEM_Y - 50, 26, 26];
  const altura = VILOES[vilaoId].altura;
  return [ORIGEM_X - 18, ORIGEM_Y - altura - 4, 36, 36];
}

/** Recorte do corpo inteiro, para os cards de escolha. */
export const RECORTE_CORPO = [ORIGEM_X - 16, ORIGEM_Y - 52, 32, 56];

function desenharProjetil(c, p) {
  const caixa = caixaDoProjetil(p);
  const [fundo, letra, borda] = p.cores;
  const [x, y] = [Math.round(caixa.x), Math.round(caixa.y)];
  px(c, x - 1, y - 1, caixa.w + 2, caixa.h + 2, "#0b0b12");
  px(c, x, y, caixa.w, caixa.h, borda);
  px(c, x + 1, y + 1, caixa.w - 2, caixa.h - 2, fundo);
  escrever(c, p.rotulo, x + 3, y + Math.floor((caixa.h - 5) / 2), letra);
  if (p.tipo === "balao") px(c, p.vx > 0 ? x + 2 : x + caixa.w - 4, y + caixa.h, 2, 2, "#0b0b12");
}

function desenharBalao(c, { autor, texto: conteudo }, inicio, largura) {
  const w = larguraTexto(conteudo) + 6;
  const topo = Math.round(autor.y - autor.altura - 16);
  const x = Math.round(limitar(autor.x - w / 2, inicio + 2, inicio + largura - w - 2));
  px(c, x - 1, topo - 1, w + 2, 11, "#0b0b12");
  px(c, x, topo, w, 9, autor.ehHeroi ? "#f5f1e3" : "#ffe9e9");
  const ponta = Math.round(limitar(autor.x, x + 3, x + w - 4));
  px(c, ponta - 1, topo + 9, 3, 2, "#0b0b12");
  escrever(c, conteudo, x + 3, topo + 2, "#0b0b12");
}

let camera = 0;

/**
 * Desenha o quadro atual. Com largura menor que a do palco, a câmera acompanha os lutadores.
 * @param {CanvasRenderingContext2D} c
 * @param {number} [largura] largura visível, em pixels do palco
 */
export function desenharLuta(c, largura = W) {
  const [sx, sy] = luta.tremor > 0
    ? [Math.round((Math.random() * 2 - 1) * luta.tremor), Math.round((Math.random() * 2 - 1) * luta.tremor)]
    : [0, 0];
  const meio = luta.vilao ? (luta.heroi.x + luta.vilao.x) / 2 : W / 2;
  const alvo = limitar(meio - largura / 2, 0, W - largura);
  camera += (alvo - camera) * 0.15;
  if (Math.abs(alvo - camera) > W) camera = alvo;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = "#05060e";
  c.fillRect(0, 0, c.canvas.width, H);
  c.setTransform(1, 0, 0, 1, sx - Math.round(camera), sy);
  desenharCenario(c, luta.cenario, luta.quadro);
  desenharTorcida(c, luta.cenario, luta.quadro, luta.torcida > 0);
  const figuras = [luta.vilao, luta.heroi].filter(Boolean);
  for (const f of figuras) {
    const w = Math.max(6, Math.round(f.largura + 2 - (CHAO - f.y) / 6));
    px(c, f.x - w / 2, CHAO, w, 2, "rgba(0,0,0,.35)");
  }
  figuras.sort((a, b) => (a.golpe ? 1 : 0) - (b.golpe ? 1 : 0)).forEach((f) => desenharFigura(c, f));
  luta.projeteis.forEach((p) => desenharProjetil(c, p));
  for (const p of luta.particulas) {
    if (p.texto) escreverComContorno(c, p.texto, Math.round(p.x - larguraTexto(p.texto) / 2), Math.round(p.y), p.cor);
    else px(c, p.x, p.y, p.tam, p.tam, p.cor);
  }
  luta.baloes.forEach((b) => desenharBalao(c, b, camera, largura));
  c.setTransform(1, 0, 0, 1, 0, 0);
}
