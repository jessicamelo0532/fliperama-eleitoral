# SPEC — Bora Ver o Plano

> id: `bora-ver-o-plano` · Versão 1.0 · Data: 08/10/2026 · Status: aprovada

## 1. Ideia em uma frase
A pessoa passeia por uma cidade fictícia, bairro a bairro, conversando com moradores e profissionais que contam o que o plano de governo de Lula propõe para cada área, e encontra em cada bairro um objeto perdido que lembra uma realização dos governos Lula.

## 2. Categoria e objetivo informativo
- **Categoria:** propostas
- **O que a pessoa deve saber ao terminar:** o que o plano de governo registrado no TSE propõe em cada um dos seus 13 tópicos e quais realizações dos governos Lula se relacionam a cada área.

## 3. Mecânica
- **Fonte da estrutura:** os 13 tópicos numerados do plano de governo, agrupados em sete fases. Cada fase é um bairro.

  | Fase | Bairro | Tópicos do plano | Objeto perdido |
  |---|---|---|---|
  | 1 | Praça Central | 1. Democracia, participação social e modernização do Estado · 2. Combater as desigualdades | Cartão do Bolsa Família |
  | 2 | Centro | 8. Economia sustentável, produtiva e digital · 12. Valorizar o trabalho · 13. Soberania nacional | Carteira de trabalho |
  | 3 | Vila Saúde | 5. Saúde | Remédio da Farmácia Popular |
  | 4 | Jardim Seguro | 3. Segurança pública | Livro da Lei Maria da Penha |
  | 5 | Vale do Saber | 4. Educação · 6. Cultura e esporte | Crachá de Instituto Federal |
  | 6 | Bairro Novo | 7. Direito à cidade | Chave do Minha Casa, Minha Vida |
  | 7 | Campo Verde | 9. Segurança alimentar e produção agrícola · 10. Segurança energética · 11. Sustentabilidade ambiental e climática | Prato do Fome Zero |

- **Como começa:** tela inicial, escolha entre duas personagens (cidadã ou cidadão) e mapa da cidade com os sete bairros. Só a Praça Central (fase 1) está aberta.
- **Ordem das fases:** em sequência; os demais bairros aparecem com cadeado até serem desbloqueados.
- **A cada fase:** a pessoa anda pelo bairro (visão de cima, estilo RPG retrô) e conversa com personagens marcados com uma estrela. Cada conversa revela uma proposta em uma caixa de diálogo, com a fonte.
- **Objeto perdido:** cada bairro esconde um objeto ligado a uma realização dos governos Lula na área da fase. Um dos personagens dá uma pista de onde ele está. Ao encontrá-lo, aparece um cartão com o objeto, um texto curto sobre a realização e a fonte.
- **Progresso:** contadores "Propostas encontradas: x/y" e "Objeto perdido: encontrado/não encontrado" sempre visíveis.
- **Como ganha:** a fase é zerada quando todas as propostas do bairro e o objeto perdido são encontrados. Isso desbloqueia o próximo bairro. Não há como perder.
- **Como termina:** com os sete bairros zerados, a tela final resume as propostas por área e os sete objetos encontrados.
- **Duração estimada:** a definir com o conteúdo.

## 4. Controles
- **Teclado:** setas ou WASD para andar; Espaço ou Enter para conversar e avançar o diálogo; Esc para o menu.
- **Toque (celular):** direcional na tela (canto inferior esquerdo) e botão A (canto inferior direito), com área de toque de pelo menos 44 px.

## 5. Telas
1. **Início:** título, como jogar, escolha da personagem, botão JOGAR.
2. **Mapa da cidade:** os sete bairros, com cadeado nos bloqueados e selo "ZERADO" nos concluídos.
3. **Bairro:** cenário explorável, contadores e botão de menu.
4. **Diálogo:** caixa na parte inferior com nome do personagem, fala de abertura, proposta e fonte (plano no TSE, página).
5. **Objeto encontrado:** cartão com o desenho do objeto, nome, texto sobre a realização e fonte.
6. **Menu do bairro:** voltar ao mapa, lista das propostas já encontradas no bairro, som ligado/desligado.
7. **Fase zerada:** comemoração, propostas do bairro e objeto encontrado, com fontes, e aviso de bairro desbloqueado.
8. **Resultado final** (`mostrarResultado`): resumo por área com propostas e objetos, fontes e compartilhamento.

## 6. Conteúdo
- **Propostas:** `jogos/bora-ver-o-plano/propostas.json`
```json
{
  "id": "praca01",
  "fase": "praca",
  "topico": 2,
  "personagem": "Agente comunitária",
  "abertura": "Ei, você soube dessa?",
  "proposta": "Texto curto da proposta, fiel ao plano.",
  "fontes": [
    {
      "titulo": "Programa de Governo — Lula (Eleições 2026)",
      "veiculo": "TSE",
      "url": "https://www.tse.jus.br/eleicoes/eleicoes-2026-content/arquivos/proposta-pt/@@display-file/file/proposta-pt.pdf#page=18",
      "data": "2026"
    }
  ],
  "revisado": false
}
```
- `fase` ∈ `praca` | `centro` | `saude` | `seguranca` | `saber` | `bairro-novo` | `campo`
- `topico`: número do tópico no plano (1 a 13).
- **Separação entre fala e fato:** `abertura` traz só a fala animada do personagem, sem afirmação factual. Toda a informação fica em `proposta`, escrita conforme o plano ("O plano prevê…", "O plano propõe…").
- **Objetos perdidos:** `jogos/bora-ver-o-plano/objetos.json`, um por bairro:
```json
{
  "id": "obj-praca",
  "fase": "praca",
  "objeto": "Cartão do Bolsa Família",
  "pista": "Fala do personagem que indica onde o objeto está.",
  "texto": "Texto curto sobre a realização, fiel às fontes.",
  "fontes": [],
  "revisado": false
}
```
- **Critério dos objetos:** realização dos mandatos de Lula (2003–2010 ou a partir de 2023), de autoria inequívoca do governo dele e amplamente conhecida pela população.
- **Fontes dos objetos:** legislação no Planalto, sites oficiais do governo federal (gov.br) ou duas reportagens independentes, conforme `docs/CONTEUDO.md`.
- **Quantidade:** 4 propostas por bairro (28 no total). Em bairros com mais de um tópico, as propostas se distribuem entre os tópicos.
- **Mínimo para publicar:** 3 propostas revisadas por bairro (21 no total) e os 7 objetos revisados.
- **Fonte das propostas:** plano de governo registrado no TSE, sempre com o número da página no link.

## 7. Visual e som
- Pixel art original feita para o projeto: personagens, construções e objetos genéricos.
- Personagens do bairro com profissões e papéis comuns (enfermeira, professor, motorista de aplicativo, comerciante, estudante, agricultora), sem semelhança com pessoas reais.
- Paleta do site (`base.css`), com cada bairro tendo uma cor de destaque própria.
- Sem rostos reais, fotos, logos de partido ou símbolos de campanha.
- **Som:** efeitos curtos gerados no navegador (diálogo, proposta encontrada, objeto encontrado, fase zerada), desligados por padrão, com botão para ligar.

## 8. Tecnologia
- **Kaplay 3001.0.19**, importado por CDN com versão fixada (`https://unpkg.com/kaplay@3001.0.19/dist/kaplay.mjs`), para mapa em grade, colisão, câmera e animação.
- Mapas dos bairros definidos em código (matriz de caracteres), sem editor externo.
- Caixa de diálogo, cartões, menu e controles de toque em HTML sobre o canvas, para que leitores de tela e teclado funcionem.
- **Progresso salvo no navegador** (`localStorage`): personagem escolhida, propostas e objetos encontrados e bairros desbloqueados. Nenhum dado pessoal; botão "Recomeçar" apaga o progresso.

## 9. Compartilhamento
- Fase zerada: "Zerei o bairro {nome} no Bora Ver o Plano! Encontrei {n} propostas e o {objeto} perdido."
- Final: "Zerei o Bora Ver o Plano e conheci as {n} propostas do plano de Lula para 2026. Bora ver também?"

## 10. Riscos e cuidados
- **Fidelidade ao plano:** a proposta não pode ir além do texto do PDF. Resultados futuros nunca são apresentados como certos.
- **Objetos perdidos:** o texto descreve o que foi feito, com data e fonte, sem atribuir resultados que as fontes não sustentem.
- **Tom animado só na forma:** comemorações e falas de abertura são animadas; o conteúdo das propostas e dos objetos é factual.
- **Volume de conteúdo:** 28 propostas e 7 objetos para revisar até o congelamento de 24/10/2026. Se necessário, o jogo é publicado com as fases prontas e as demais entram como "em breve".
- **Desempenho em celulares simples:** mapas pequenos, poucos objetos animados e sprites leves.
- **Acessibilidade:** o texto das propostas também fica disponível na lista do menu e na tela final, para quem não quiser explorar o mapa.

## 11. Critérios de aceite
- [ ] Os sete bairros são jogáveis no celular (toque) e no computador (teclado)
- [ ] Bairros desbloqueiam em sequência, só com propostas e objeto encontrados
- [ ] Toda proposta mostra fonte com link para a página do plano no TSE
- [ ] Todo objeto mostra fonte
- [ ] Só itens revisados aparecem
- [ ] Pelo menos 3 propostas revisadas por bairro e os 7 objetos revisados
- [ ] Diálogos, cartões, menu e lista de propostas acessíveis por teclado e leitor de tela
- [ ] Progresso salvo e botão "Recomeçar" funcionando
- [ ] Sem rolagem horizontal em 360 px e console sem erros
