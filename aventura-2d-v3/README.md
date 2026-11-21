# Nossos Universos — Três Aventuras (v3)

Nova versão do jogo com três minigames **diferentes**, efeitos visuais, efeitos sonoros, personagens em spritesheets, cenários próprios, inimigos e pontuação.

## Abrir
Basta abrir `index.html` no Chrome ou Edge. Não precisa instalar nada nem iniciar servidor. A pasta `assets/` contém todos os 12 PNG utilizados.

## Mapa
Clique nas ilhas para explorar. A próxima ilha desbloqueia quando você conclui a anterior. Os resultados ficam salvos no navegador.

## Capítulo 1 — One Piece | Combate pirata lateral
Ande com **A/D** ou **←/→**, pule com **Espaço**, ataque com **J ou K**. Ataque os piratas duas vezes para derrotá-los, colete moedas e derrote **4 inimigos** antes de alcançar o navio à direita. Ganhe 120 pontos por inimigo e 40 por moeda.

## Capítulo 2 — Fullmetal Alchemist | Ritual de memória
Observe os quatro símbolos de alquimia se iluminarem, depois repita a sequência usando **1, 2, 3, 4** ou clicando nos círculos. São **5 rituais** de dificuldade crescente; você tem 3 tentativas.

## Capítulo 3 — Naruto | Arena ninja
Movimente-se com **WASD ou setas**, golpeie com **J/K** e esquive com **Espaço**. Derrote **12 inimigos**, ganhando 100 pontos por inimigo. Você tem 5 corações.

## Implementação
- HTML, CSS e JavaScript Canvas.
- 12 PNG de arte pixelada autoral gerados especificamente para o projeto.
- Camadas de cenário, sombras, texturas, partículas, golpes animados, som via Web Audio, elementos interativos.
- Três códigos de mecânica separados: plataforma + combate, puzzle de sequência e arena top-down.
- Teclado e controles para telas de toque.
- Armazenamento em `localStorage` com desbloqueio das fases.

## Pesquisa técnica
- https://github.com/phaserjs/examples — ideias para colisão, plataforma e física arcade.
- https://github.com/kittykatattack/learningPixi — sprites e animação.
- https://github.com/abagames/crisp-game-lib-games — minigames de formatos diferentes.
- https://github.com/fkucukkara/mario — combate de plataforma e progressão.

Nenhum código ou asset foi copiado desses projetos; os links são referências de design/implementação. Fan game independente, sem vínculo com titulares das franquias.

## Testes
As três fases foram abertas em teste automatizado de navegador sem erros de execução no primeiro acesso. Recomenda-se uma partida manual completa, pois testes básicos não garantem balanceamento ou ausência de bugs em todos os percursos.
