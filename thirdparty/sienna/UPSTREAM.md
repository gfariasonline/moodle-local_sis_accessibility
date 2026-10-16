# Sienna incorporado

Origem: https://github.com/bennyluk/Sienna-Accessibility-Widget
SHA fixado: e574c32da16aa57d78fbc43a8e9652ff30d69402 (2.0.1).
Licença: MIT, copyright 2025 Benny Luk; texto original em LICENSE.

`upstream-src/`, quando presente no ambiente local, conserva as fontes consultadas sem alteração para comparação manual.
Não é carregado, compilado ou servido pela integração Moodle e é excluído do Git e do ZIP. As URLs e marcas desse
arquivo histórico não participam da execução do plugin.

`src/sienna.js` é a porta mantida das definições de ferramentas de
`tools/adjustFontWeight.ts`, `adjustLineHeight.ts`, `adjustLetterSpacing.ts`,
`highlightLinks.ts`, `highlightTitle.ts`, `enum/Filters.ts` e `enum/Selectors.ts`.
Ela é o entry de biblioteca explicitamente incorporado no build local.

Adaptações por Thiago Serrão (2026): seletores explícitos de texto; altura de linha 2;
fonte local; realce por sublinhado para preservar o foco nativo; nomes internos consistentes; nenhuma autoexecução, global, HTML,
catálogo dinâmico ou armazenamento Sienna. Os valores de filtros, realces e peso
mantêm as definições upstream. MIT preservada nas fontes e no AMD compilado.

A integração, painel, preferências e restauração são próprios do plugin, sob GPL v3
ou posterior. A autoexecução e a interface upstream foram substituídas, não usadas
como um segundo widget. Fontes e ícones upstream não são executados. Os ícones do painel vêm das fontes Sienna MIT, Material Apache 2.0 e Lucide ISC/MIT,
conforme thirdpartylibs.xml e os arquivos de licença. O cursor próprio é GPL v3+.

Atualizar manualmente, comparar o SHA e executar os testes. O build depende apenas
das fontes dentro deste plugin; nunca lê `referencias/` nem baixa Sienna.
