# CONTEÚDO — Regras editoriais e checklist legal

Vale para todo texto factual dos jogos: perguntas, propostas, eventos, explicações e textos de compartilhamento.

## 1. Fontes aceitas

**Primárias (preferidas)**
- TSE: plano de governo e dados de candidatura (DivulgaCandContas), resultados oficiais
- Câmara (dadosabertos.camara.leg.br), Senado, Diário Oficial, Portal da Transparência
- Tribunais e Ministério Público: decisões, denúncias, despachos de arquivamento
- Sites oficiais do governo federal (gov.br) para programas e dados

**Jornalísticas**
- Veículos com redação profissional (Folha, Estadão, O Globo, g1, UOL, BBC Brasil, Agência Brasil, piauí, Poder360 etc.)
- Agências de checagem: Lupa, Aos Fatos, Comprova, Estadão Verifica, Fato ou Fake (g1)

**Não aceitas:** blogs sem autoria, perfis em redes sociais, vídeos cortados, sites partidários como única fonte, conteúdo gerado por IA.

**Regra mínima:** cada item precisa de **1 fonte primária** ou **2 fontes jornalísticas independentes**.

## 2. Regras de escrita

1. **Só o que a fonte diz.** Não completar, não deduzir, não arredondar a favor.
2. **Data em tudo.** Todo fato tem data; todo evento tem status atual com data.
3. **Linguagem jurídica correta** (principalmente em Investigações):
   - Use: "foi investigado", "foi denunciado pelo MP", "virou réu", "foi condenado em 1ª instância", "a investigação foi arquivada", "a decisão foi anulada".
   - Nunca: "ladrão", "criminoso", "bandido", "roubou", ou chamar de crime o que não teve condenação definitiva.
   - Se o caso foi arquivado ou anulado, **isso aparece no card**.
4. **Propostas:** dizer de onde vêm ("consta no plano de governo registrado no TSE") e não afirmar resultado futuro como certo.
5. **Fato ou Fake:** a afirmação deve existir de verdade (circulou, foi dita, foi publicada). Afirmações "fake" precisam de checagem publicada que as desminta.
6. **Curto:** afirmação até 25 palavras; explicação até 2 frases; resumo de evento até 3 frases.
7. **Sem pessoas reais em imagem:** nada de rostos, fotos, caricaturas, logos de partido ou vozes.

## 3. Fluxo de revisão

1. Todo item novo é criado com `"revisado": false`.
2. Os itens são listados para revisão em uma tabela: id · texto · resposta/status · fonte(s) com link.
3. A responsável abre cada link, confere e marca `"revisado": true` no JSON (ou pede ajuste).
4. O jogo só mostra itens revisados.

## 4. Correções depois de publicado

- Pedidos chegam pelo e-mail do projeto ou pelo formulário `reportar-erro` do GitHub, ambos linkados na página Sobre.
- Erro confirmado: corrigir em até 24 h e registrar em `docs/CORRECOES.md` (data, item, o que mudou).

## 5. Checklist legal (antes de cada publicação)

- [ ] Página Sobre identifica a responsável e tem contato (proibido anonimato — Lei 9.504/97, art. 57-D)
- [ ] Nenhum anúncio ou impulsionamento pago (só candidatos e partidos podem impulsionar — art. 57-C)
- [ ] Nenhum conteúdo sabidamente falso ou descontextualizado sobre candidato (Res. TSE 23.610/2019)
- [ ] Nenhuma imagem, áudio ou vídeo gerado por IA de pessoa real; qualquer conteúdo feito com IA está rotulado
- [ ] Toda afirmação tem fonte clicável
- [ ] Nenhum item com `revisado: false` aparece no site
- [ ] **25/10/2026: não publicar nem atualizar nada** (publicar conteúdo novo no dia da eleição é crime — art. 39, §5º, IV)
- [ ] Trabalho feito fora do expediente e sem equipamento ou rede pública

> Este checklist resume as regras mais relevantes; não substitui orientação jurídica.
