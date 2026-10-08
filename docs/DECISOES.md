# DECISÕES — Fliperama Eleitoral

Registro das decisões do projeto. Para mudar uma decisão, crie uma nova entrada que a substitui; não apague as antigas.

---

### D01 — Tecnologia: HTML/CSS/JS puro + Kaplay
- **Data:** 08/10/2026 · **Status:** substituída por D10 (parte dos jogos)
- **Decisão:** portal, quiz e linha do tempo em JavaScript puro, sem build. O jogo de coleta usa Kaplay carregado por CDN com versão fixada.
- **Por quê:** zero instalação, publica em qualquer hospedagem estática, fácil de a responsável ler e manter. Kaplay é mais simples que Phaser para um jogo 2D curto.
- **Alternativas descartadas:** React + Vite (exige build e mais código); Phaser (mais verboso); tudo em canvas puro (mais código sem ganho).

### D02 — Hospedagem: GitHub Pages em conta exclusiva do projeto
- **Data:** 08/10/2026 · **Status:** substituída por D14
- **Decisão:** conta GitHub `fliperama-eleitoral` e repositório `fliperama-eleitoral.github.io`.
- **Por quê:** gratuito, publica a cada push e não expõe o nome da responsável no endereço. Domínio próprio pode ser apontado depois.

### D03 — Autoria: identificada na página Sobre, não no link
- **Data:** 08/10/2026 · **Status:** substituída por D15
- **Decisão:** link e página inicial mostram só "Fliperama Eleitoral". A página Sobre traz e-mail do projeto e nome da responsável.
- **Por quê:** a lei eleitoral proíbe propaganda anônima na internet (Lei 9.504/97, art. 57-D). Essa forma cumpre a lei com exposição mínima.

### D04 — Nome e identidade: "Fliperama Eleitoral", arcade retrô vermelho e branco
- **Data:** 08/10/2026 · **Status:** aceita
- **Detalhes:** ver SPEC §7.

### D05 — Tom: informativo e leve
- **Data:** 08/10/2026 · **Status:** aceita
- **Decisão:** visual de jogo e linguagem descontraída nas mensagens de interface; conteúdo factual, sem ofensas, apelidos ou caricaturas de pessoas reais.
- **Por quê:** atrai sem abrir brecha para pedidos de remoção ou direito de resposta.

### D06 — Conteúdo com revisão obrigatória
- **Data:** 08/10/2026 · **Status:** aceita
- **Decisão:** todo item é redigido a partir de fontes e nasce com `revisado: false`; só a responsável pelo conteúdo muda para `true`, depois de conferir as fontes; os jogos só exibem itens revisados.
- **Por quê:** nenhum conteúdo é publicado sem verificação humana.

### D07 — Rótulo da categoria: "Investigações" em vez de "Escândalos"
- **Data:** 08/10/2026 · **Status:** aceita
- **Por quê:** "Investigações" descreve o fato sem juízo de valor e reduz risco jurídico. O conteúdo dentro continua o mesmo.

### D08 — Sem dados pessoais, cookies ou analytics
- **Data:** 08/10/2026 · **Status:** substituída por D11 (parte de analytics)
- **Por quê:** simplicidade, LGPD e privacidade de quem joga.

### D09 — Lançamento em etapas
- **Data:** 08/10/2026 · **Status:** substituída por D10
- **Decisão:** dia 1 lança o portal com o Quiz; Linha do Tempo e Coleta entram nos dias seguintes.
- **Por quê:** o 2º turno é em 25/10; melhor um jogo bom no ar já do que três pela metade.

### D10 — Plataforma primeiro; cada jogo idealizado separadamente
- **Data:** 08/10/2026 · **Status:** aceita
- **Decisão:** a Parte 1 entrega só a plataforma (portal, moldura, contrato de jogo, Sobre). Nenhum jogo é implementado nela. Cada jogo passa depois pelo ciclo J1–J5: idealização com a responsável, SPEC própria aprovada, protótipo, conteúdo e publicação.
- **Consequências:** Quiz Fato ou Fake, Coleta e Linha do Tempo continuam como ideias candidatas, mas mecânica, tecnologia (inclusive usar ou não Kaplay) e conteúdo de cada um só são decididos no seu ciclo.
- **Por quê:** cada jogo merece concepção própria; uma plataforma com contrato claro mantém os jogos independentes entre si.

### D11 — Contagem de acessos com GoatCounter
- **Data:** 08/10/2026 · **Status:** aceita
- **Decisão:** usar GoatCounter (plano gratuito) para contar visitas por página e eventos de jogo (`jogo-<id>-inicio`, `jogo-<id>-fim`, `jogo-<id>-compartilhar`). O código da conta fica em `assets/js/config.js`; com o campo vazio, a contagem fica desligada.
- **Por quê:** ter métricas de alcance e de engajamento para avaliar os jogos e documentar os resultados do projeto, sem cookies, sem dados pessoais e sem banner de consentimento.
- **Alternativas descartadas:** Google Analytics (cookies e perfilamento, exige consentimento); Plausible (pago); não medir (sem evidência de alcance).
- **Consequências:** a página Sobre informa o uso do contador; o domínio `gc.zgo.at` passa a ser a única dependência externa além do Google Fonts.

### D12 — Verificação automática
- **Data:** 08/10/2026 · **Status:** aceita
- **Decisão:** um único workflow do GitHub Actions valida o conteúdo e verifica os links das fontes.
- **Por quê:** detectar JSON inválido e fontes quebradas antes do público, com o mínimo de infraestrutura.
- **Alternativas descartadas:** testes de interface automatizados e múltiplos workflows (complexidade desnecessária nesta fase).

### D13 — Histórico do repositório limpo
- **Data:** 08/10/2026 · **Status:** aceita
- **Decisão:** um commit por etapa concluída, com mensagem objetiva; arquivos de rascunho e de configuração local ficam fora do repositório.
- **Por quê:** histórico legível e fácil de auditar.

### D14 — Repositório na conta pessoal
- **Data:** 08/10/2026 · **Status:** aceita
- **Decisão:** repositório `jessicamelo0532/fliperama-eleitoral`, publicado em `https://jessicamelo0532.github.io/fliperama-eleitoral/`.
- **Por quê:** o projeto passa a compor o portfólio da autora desde o início.
- **Consequências:** o endereço do site contém o usuário pessoal; `404.html` usa o prefixo `/fliperama-eleitoral/`; um domínio próprio pode ser apontado depois sem mudar o código, exceto esse prefixo.

### D15 — Autoria e contato no repositório
- **Data:** 08/10/2026 · **Status:** aceita
- **Decisão:** o site não exibe e-mail nem nome; a página Sobre aponta para o repositório público, onde estão autoria e contato.
- **Por quê:** concentrar autoria e contato em um único lugar, sem expor dados pessoais nas páginas do site. A autoria segue identificável: o endereço do site traz o usuário do GitHub e o repositório informa a autora.

### D16 — Ativação do contador adiada
- **Data:** 08/10/2026 · **Status:** aceita
- **Decisão:** a integração com GoatCounter (D11) permanece no código, desligada, e será ativada depois que a plataforma e os primeiros jogos estiverem prontos. Os textos sobre o contador voltam à página Sobre e ao README na ativação.

### D17 — Canal público de correções adiado
- **Data:** 08/10/2026 · **Status:** aceita
- **Decisão:** o site não oferece, por ora, canal para envio de correções. Um formulário próprio será criado mais adiante. As issues do repositório ficam desativadas.
- **Por quê:** a autora prefere estruturar um canal dedicado antes de receber pedidos.
- **Consequências:** erros são identificados na revisão contínua do conteúdo e na verificação semanal de links.

---

## Modelo para nova decisão

```
### Dxx — Título
- **Data:** · **Status:** proposta | aceita | substituída por Dyy
- **Decisão:**
- **Por quê:**
- **Alternativas descartadas:**
```
