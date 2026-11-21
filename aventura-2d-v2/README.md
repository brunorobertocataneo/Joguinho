# Nossos Universos — Pixel Adventure Deluxe

Versão 2 do jogo de aventuras por ilhas, com sprites pixelados originais, cenários próprios e fases de plataforma inspiradas nos universos de One Piece, Fullmetal Alchemist e Naruto.

## Abrir o jogo
Abra `index.html` em Chrome ou Edge. O jogo não exige instalação, Node.js ou servidor.

## Controles
- **A/D** ou **setas esquerda/direita**: movimentar.
- **Espaço / W / seta para cima**: pular.
- **Naruto**: pulo duplo, pressione pular novamente no ar.
- **Fullmetal Alchemist**: salto mais alto.
- **Celular**: botões na tela.
- **Voltar ao mapa**: sair da fase.

## Como funciona
Selecione uma ilha no mapa, colete as três estrelas e alcance o portal final. Complete uma ilha para desbloquear a próxima. O progresso é salvo automaticamente no navegador (`localStorage`).

## Arte criada
A pasta `assets` contém **12 imagens PNG originais**, com:
- 3 spritesheets do protagonista (4 frames cada);
- 3 spritesheets de inimigos (4 frames cada);
- 3 tilesets de plataformas (3 tiles de 32×32 cada);
- 3 cenários exclusivos, incluindo oceano tropical, cidade alquímica e vila ninja.

Os arquivos foram desenhados proceduralmente em pixel art para esta versão. Não foram usados sprites ou arquivos de jogos comerciais.

## Testes
O jogo foi aberto automaticamente no navegador e as três fases foram visitadas sem erros JavaScript. Ainda é recomendável testar todas as rotas até o portal com os controles.

## Projeto
O original permanece em `/index.html`, a primeira aventura em `/aventura-2d/` e esta versão em `/aventura-2d-v2/`. Fan game independente, sem afiliação aos titulares das franquias.
