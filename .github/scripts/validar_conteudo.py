"""Valida o catálogo e os arquivos de conteúdo dos jogos."""

import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
CATEGORIAS = {"aventura", "arcade"}
STATUS = {"rascunho", "em-breve", "publicado"}
CAMPOS_JOGO = {"id", "titulo", "descricao", "categoria", "caminho", "status"}

erros = []


def carregar(caminho):
    try:
        return json.loads(caminho.read_text(encoding="utf-8"))
    except json.JSONDecodeError as erro:
        erros.append(f"{caminho.relative_to(RAIZ)}: JSON inválido ({erro})")
        return None


def validar_catalogo(caminho):
    jogos = carregar(caminho)
    if not isinstance(jogos, list):
        if jogos is not None:
            erros.append(f"{caminho.relative_to(RAIZ)}: deve ser uma lista")
        return
    ids = set()
    for jogo in jogos:
        rotulo = f"{caminho.relative_to(RAIZ)} [{jogo.get('id', '?')}]"
        faltando = CAMPOS_JOGO - jogo.keys()
        if faltando:
            erros.append(f"{rotulo}: campos ausentes {sorted(faltando)}")
        if jogo.get("categoria") not in CATEGORIAS:
            erros.append(f"{rotulo}: categoria inválida")
        if jogo.get("status") not in STATUS:
            erros.append(f"{rotulo}: status inválido")
        if jogo.get("id") in ids:
            erros.append(f"{rotulo}: id duplicado")
        ids.add(jogo.get("id"))
        if jogo.get("status") == "publicado" and not (RAIZ / jogo.get("caminho", "")).exists():
            erros.append(f"{rotulo}: caminho não encontrado")


def validar_conteudo(caminho):
    itens = carregar(caminho)
    if not isinstance(itens, list):
        if itens is not None:
            erros.append(f"{caminho.relative_to(RAIZ)}: deve ser uma lista")
        return
    ids = set()
    for item in itens:
        rotulo = f"{caminho.relative_to(RAIZ)} [{item.get('id', '?')}]"
        if not item.get("id"):
            erros.append(f"{rotulo}: id ausente")
        if item.get("id") in ids:
            erros.append(f"{rotulo}: id duplicado")
        ids.add(item.get("id"))
        if not isinstance(item.get("revisado"), bool):
            erros.append(f"{rotulo}: 'revisado' deve ser true ou false")
        fontes = item.get("fontes")
        if not isinstance(fontes, list):
            erros.append(f"{rotulo}: 'fontes' deve ser uma lista")
            continue
        if item.get("revisado") is True and not fontes:
            erros.append(f"{rotulo}: item revisado sem fonte")
        for fonte in fontes:
            if not str(fonte.get("url", "")).startswith("https://"):
                erros.append(f"{rotulo}: fonte sem URL https")


for catalogo in (RAIZ / "data").glob("jogos*.json"):
    validar_catalogo(catalogo)
for conteudo in (RAIZ / "jogos").glob("*/*.json"):
    validar_conteudo(conteudo)

if erros:
    print("\n".join(erros))
    sys.exit(1)
print("Conteúdo válido.")
