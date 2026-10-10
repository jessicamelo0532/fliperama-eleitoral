# Fliperama Eleitoral

![Fliperama Eleitoral](assets/img/og-image.png)

**Portal de mini jogos sobre as eleições presidenciais de 2026, partidário ao Presidente Lula. Jogue e saia sabendo um fato, sempre com fonte.**

▶ **Jogue em [jessicamelo0532.github.io/fliperama-eleitoral](https://jessicamelo0532.github.io/fliperama-eleitoral/)**

---

## Sobre o projeto

O Fliperama Eleitoral reúne jogos rápidos, na estética dos portais de jogos online dos anos 2000, para levar informação política de um jeito leve e direto.


## Por que este projeto existe

O Fliperama Eleitoral apoia a reeleição do presidente **Luiz Inácio Lula da Silva** em 2026.

Numa eleição marcada pela desinformação, acredito que a melhor forma de fazer campanha é com informação de qualidade: conhecer as propostas, checar o que chega pelo celular e lembrar dos fatos. Por isso, apoio não significa abrir mão do rigor. Cada informação do site tem fonte verificável, e qualquer erro é corrigido.

## Como o conteúdo é feito

- **Fontes confiáveis:** órgãos oficiais (TSE, Câmara, Senado, tribunais, Portal da Transparência), imprensa profissional e agências de checagem.
- **Linguagem precisa:** cada fato é descrito como as fontes o descrevem, com data e situação atual.
- **Revisão antes de publicar:** nenhum conteúdo entra em um jogo sem ser conferido com as fontes.
- **Correções registradas:** erros identificados são corrigidos e testados.


## Privacidade

O site não usa cookies, não coleta dados pessoais e não exige cadastro.

As visitas são contadas de forma agregada com o [GoatCounter](https://www.goatcounter.com/), que não usa cookies nem identifica quem acessa. A contagem inclui as páginas visitadas e quando um jogo é iniciado, concluído ou compartilhado.

## Tecnologia

- HTML, CSS e JavaScript puros, sem frameworks e sem etapa de build
- Publicação estática no GitHub Pages
- Interface pensada primeiro para o celular, com navegação por teclado e contraste acessível
- Cada jogo é independente e usa uma base comum (navegação, fontes, tela de resultado e compartilhamento)
- Verificação automática do conteúdo e dos links das fontes com GitHub Actions

### Executar localmente

```bash
python3 -m http.server 8000
```

Depois, abra `http://localhost:8000`.

### Estrutura

```
├── index.html          portal de jogos
├── sobre.html          sobre o projeto
├── assets/             estilos, scripts e imagens
├── data/jogos.json     catálogo de jogos
└── jogos/              um diretório por jogo
```

## Autoria

Criado e mantido por **Jéssica Lopes Melo**, bibliotecária e graduanda em Sistemas de Informação.

Projeto independente e voluntário, sem vínculo com partidos ou campanhas e sem impulsionamento pago.
