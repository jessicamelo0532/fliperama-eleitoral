# SPEC — Fliperama Eleitoral (plataforma)

> Versão 2.0 · 08/10/2026 · Status: aprovada para implementação
> Escopo: **só a plataforma**. Cada jogo tem a sua própria SPEC em `docs/jogos/<id>/SPEC.md`, escrita depois de idealizado com a responsável.

## 1. Visão geral

**Fliperama Eleitoral** é um portal de mini jogos de navegador, inspirado nos portais de jogos dos anos 2000 (estilo ojogos.com), em que cada jogo transmite informação política verificável sobre a eleição presidencial de 2026: propostas do presidente Lula, checagem de fato ou fake e investigações envolvendo Flávio Bolsonaro.

- **Público:** eleitores jovens e adultos, majoritariamente no celular.
- **Promessa:** "jogue em 1 minuto, saia sabendo um fato com fonte".
- **Prazo:** plataforma no ar em 1 dia; conteúdo congelado em **24/10/2026** (véspera do 2º turno, 25/10).

## 2. Objetivos e não-objetivos

**Objetivos da plataforma**
1. Portal com grade de jogos, filtros por categoria e página Sobre.
2. Catálogo em JSON: adicionar um jogo não exige mexer no HTML do portal.
3. Uma **moldura comum** (voltar, fontes, resultado, compartilhar) que todo jogo reutiliza.
4. Um **contrato de jogo** claro, para que cada jogo seja desenvolvido isolado na sua pasta.
5. Custo zero e publicação estática.

**Não-objetivos (plataforma v1)**
- Implementar qualquer jogo (cada um é um projeto à parte; ver §8).
- Login, ranking online, comentários ou back-end.
- Coleta de dados pessoais ou cookies.
- Anúncios ou impulsionamento pago.

## 3. Requisitos funcionais

### RF1 — Portal (index.html)
- Cabeçalho com logo "FLIPERAMA ELEITORAL" em fonte pixelada.
- Grade de cards lida de `data/jogos.json`.
- Filtro por categoria: **Todos · Propostas · Fato ou Fake · Investigações**.
- Card de jogo publicado: miniatura, título, descrição de 1 linha, categoria, botão "JOGAR".
- Card de jogo **em breve**: miniatura escurecida, título e selo "EM BREVE", sem botão.
- Estado vazio: se não houver nenhum jogo, mostrar "INSERT COIN — os primeiros jogos chegam em breve".
- Rodapé: aviso "Conteúdo com fontes verificáveis." e link para Sobre.

### RF2 — Página Sobre (sobre.html)
- O que é o projeto e como as fontes são escolhidas (resumo de `CONTEUDO.md`).
- Link para o repositório público, onde estão autoria e contato (D15).

### RF3 — Moldura comum (`assets/js/moldura.js` + `assets/css/base.css`)
Funções e componentes que qualquer jogo pode usar:

| Item | O que faz |
|---|---|
| `montarMoldura({id, titulo})` | Insere cabeçalho, barra com "← Voltar ao fliperama" e título, rodapé e contador |
| `registrarAcao(acao)` | Registra evento do jogo no contador (`inicio`, `fim`, `compartilhar`) |
| `carregarConteudo(url)` | Busca o JSON do jogo e devolve só itens com `revisado: true` |
| `renderFontes(elemento, fontes)` | Lista de fontes clicáveis no padrão do site |
| `mostrarResultado({titulo, texto, fontes, textoCompartilhar})` | Tela final padrão com botão Compartilhar |
| `compartilhar(texto, url)` | `navigator.share` ou cópia para a área de transferência |

### RF4 — Página de exemplo (`jogos/_exemplo/`)
Um "jogo" mínimo (um botão que mostra um fato de teste e a tela de resultado) que demonstra o contrato de jogo. Fica fora do catálogo público (`"status": "rascunho"`).

### RF5 — Aparência nas redes
Meta tags Open Graph, `og-image.png` 1200×630 e favicon pixelado no portal e na página Sobre.

### RF6 — Métricas de acesso
- Contagem de visitas por página e dos eventos `jogo-<id>-inicio`, `jogo-<id>-fim` e `jogo-<id>-compartilhar` (`assets/js/contador.js`).
- Ativada pelo campo `goatcounter` em `assets/js/config.js`; desligada até a conclusão da plataforma e dos primeiros jogos.

### RF8 — Página de erro 404
Página "GAME OVER" com botão de volta ao portal, servida pelo GitHub Pages para endereços inexistentes.

### RF9 — Verificação automática
Workflow `.github/workflows/verificacao.yml`:
- **Conteúdo:** valida catálogo e JSON dos jogos (estrutura, ids únicos, `revisado` booleano, item revisado com fonte, URLs https). Bloqueia em caso de erro.
- **Links das fontes:** verifica se os links do site e das fontes respondem. Roda a cada envio e toda segunda-feira.

### RF10 — Canal de correções
Adiado (D17). Será um formulário próprio, linkado no rodapé e na página Sobre.

### RF7 — Portão de revisão de conteúdo
Todo item de conteúdo de qualquer jogo tem `"revisado": true|false`. `carregarConteudo` descarta os não revisados. Apenas a responsável pelo conteúdo marca um item como revisado.

## 4. Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF1 | HTML/CSS/JS puro, ES modules, sem build e sem npm na plataforma. |
| RNF2 | Mobile-first: funciona em 360 px de largura, com toque. |
| RNF3 | Página inicial com menos de 500 KB; dependências externas apenas Google Fonts e GoatCounter. |
| RNF4 | Acessibilidade: contraste AA, foco visível, navegação por teclado, botões com rótulo. |
| RNF5 | Só caminhos relativos (funciona na raiz ou em subpasta). Exceção: `404.html`, que o GitHub Pages serve em qualquer endereço e por isso usa caminhos absolutos com o prefixo `/fliperama-eleitoral/`. |
| RNF6 | Nenhum cookie ou dado pessoal. Métricas apenas agregadas, via GoatCounter (D11). |
| RNF7 | Todo texto em português do Brasil. |

## 5. Estrutura de pastas

```
fliperama-eleitoral/
├── index.html
├── sobre.html
├── 404.html
├── .github/
│   ├── workflows/verificacao.yml
│   └── scripts/validar_conteudo.py
├── assets/
│   ├── css/base.css          # tokens, reset, componentes
│   ├── js/config.js          # contato, URL e código do contador
│   ├── js/contador.js        # integração com GoatCounter
│   ├── js/portal.js          # catálogo e filtros
│   ├── js/moldura.js         # contrato comum dos jogos
│   └── img/                  # favicon, og-image, miniaturas
├── data/jogos.json           # catálogo
├── jogos/
│   └── _exemplo/             # demonstração do contrato (não publicado)
├── docs/
│   ├── SPEC.md · DECISOES.md · CONTEUDO.md
│   └── jogos/
│       └── MODELO.md         # modelo de SPEC para cada novo jogo
└── README.md
```

## 6. Modelos de dados

### `data/jogos.json`
```json
[
  {
    "id": "exemplo",
    "titulo": "Jogo de exemplo",
    "descricao": "Uma linha sobre o jogo.",
    "categoria": "fato-ou-fake",
    "caminho": "jogos/_exemplo/",
    "miniatura": "assets/img/thumb-exemplo.png",
    "status": "rascunho"
  }
]
```
- `categoria` ∈ `propostas` | `fato-ou-fake` | `investigacoes`
- `status` ∈ `rascunho` (não aparece) | `em-breve` (card com selo) | `publicado` (card jogável)

### Fonte (padrão para todos os jogos)
```json
{ "titulo": "Plano de governo registrado no TSE", "veiculo": "TSE / DivulgaCandContas", "url": "https://...", "data": "2026-08-15" }
```

### Item de conteúdo (campos mínimos que todo jogo respeita)
```json
{ "id": "x001", "fontes": [ ], "revisado": false }
```
O resto dos campos é definido na SPEC de cada jogo.

## 7. Identidade visual

- **Estilo:** arcade retrô.
- **Cores:** fundo `#0B0B0F`, vermelho `#E10600`, vermelho escuro `#8A0000`, branco `#FFFFFF`, cinza `#B8B8C0` para texto secundário. Verde `#2ECC71` só para "acertou".
- **Cores do Brasil (decorativas):** verde `#009C3B` e amarelo `#FFDF00` nas faixas do cabeçalho e do rodapé; estrelas em pixel art vermelhas e douradas (`#F2B705`) no topo da página inicial e na página 404.
- **Fontes:** *Press Start 2P* em títulos e botões; *Inter* no corpo.
- **Detalhes:** bordas pixeladas, scanline sutil opcional, botões que "afundam" ao clicar.
- Nenhum rosto, foto, caricatura ou logo de partido; ícones e personagens são originais.

## 8. Contrato de jogo (como um jogo entra na plataforma)

1. Ter `docs/jogos/<id>/SPEC.md` aprovada pela responsável (feita a partir de `docs/jogos/MODELO.md`).
2. Viver inteiro em `jogos/<id>/` (HTML, JS, JSON, imagens próprias).
3. Usar `base.css` e `moldura.js`; cores só pelos tokens.
4. Carregar conteúdo com `carregarConteudo` (respeita o portão de revisão).
5. Chamar `montarMoldura({ id, titulo })`, registrar `registrarAcao("inicio")` ao começar a partida, mostrar fontes em toda tela com fato e terminar com `mostrarResultado`.
6. Bibliotecas extras (ex.: Kaplay) só se aprovadas na SPEC do jogo, por CDN com versão fixada.
7. Entrar no catálogo como `em-breve` e virar `publicado` só depois do portão de conteúdo.

## 9. Critérios de aceite da plataforma

- [ ] Portal no ar em `https://jessicamelo0532.github.io/fliperama-eleitoral/`.
- [ ] Catálogo mostra corretamente cards `publicado`, `em-breve` e o estado vazio.
- [ ] Filtros funcionam por toque e teclado.
- [ ] `jogos/_exemplo/` demonstra toda a moldura e passa no portão de revisão.
- [ ] Página Sobre com link para autoria e contato no repositório.
- [ ] Link colado no WhatsApp mostra título, descrição e imagem.
- [ ] Checklist legal de `docs/CONTEUDO.md` cumprido.
