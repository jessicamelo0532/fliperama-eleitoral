/**
 * Progresso salvo no navegador (D22). Nenhum dado pessoal é armazenado.
 */

const CHAVE = "fliperama.bora-ver-o-plano.v1";

const progressoNovo = () => ({ jogadora: null, propostas: [], objetos: [], portoes: [], som: true });

export function carregarProgresso() {
  try {
    return { ...progressoNovo(), ...JSON.parse(localStorage.getItem(CHAVE)) };
  } catch {
    return progressoNovo();
  }
}

export function salvarProgresso(progresso) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(progresso));
  } catch {
    /* Sem armazenamento disponível: o progresso vale só para esta visita. */
  }
}

export function apagarProgresso() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    /* Nada a apagar. */
  }
}

export function faseConcluida(progresso, fase, conteudo) {
  const propostas = conteudo.propostasDa(fase.id);
  const objeto = conteudo.objetoDa(fase.id);
  const todasPropostas = propostas.every((item) => progresso.propostas.includes(item.id));
  const objetoAchado = !objeto || progresso.objetos.includes(objeto.id);
  return propostas.length > 0 && todasPropostas && objetoAchado;
}

/** Índice do último bairro liberado: o primeiro sempre está aberto. */
export function ultimaFaseLiberada(progresso, fases, conteudo) {
  let indice = 0;
  while (indice < fases.length - 1 && faseConcluida(progresso, fases[indice], conteudo)) indice++;
  return indice;
}
