# OpenDyslexic — procedência (upstream)

Fonte oficial: https://github.com/antijingoist/opendyslexic

| Campo | Valor |
|---|---|
| Repositório | https://github.com/antijingoist/opendyslexic |
| Commit fixado (SHA completo) | `1824da5c0e41dc3e13ffc7f3a636dcaf695d61b7` |
| Data do commit | 2025-08-11 (`Update README.md`) |
| Caminho no repositório | `compiled/OpenDyslexic-Regular.woff2` |
| Blob Git do arquivo | `4ee220be7e9b551ad100468bd08ba35f6f9fe2f8` |
| Arquivo local | `fonts/OpenDyslexic-Regular.woff2` |
| SHA-256 (arquivo local) | `0441bc21071e42db57c217f93fbc48d3b55a2987c02814c94dc93621c42e8695` |
| Tamanho | 103336 bytes |
| Licença | SIL Open Font License 1.1 (texto integral em `fonts/OFL.txt`, idêntico a `OFL.txt` do upstream, SHA-256 `caafcccfb70fc72458fcbda812ec8f0a06cb300cbabb87eabbb30b946124394b`) |
| Copyright | Copyright (c) 2019-07-29, Abbie Gonzalez (https://abbiecod.es · support@abbiecod.es), with Reserved Font Name OpenDyslexic. Copyright (c) 12/2012 - 2019 |

## Modificações

Nenhuma. O arquivo `OpenDyslexic-Regular.woff2` foi copiado byte a byte do commit fixado (verificado com `cmp`). O `OFL.txt` também é cópia byte a byte do upstream.

## Como reproduzir / verificar

```sh
git clone https://github.com/antijingoist/opendyslexic.git
cd opendyslexic
git checkout 1824da5c0e41dc3e13ffc7f3a636dcaf695d61b7
shasum -a 256 compiled/OpenDyslexic-Regular.woff2 OFL.txt
```

Os hashes devem coincidir com os da tabela acima.

## Escolha do formato

Foi escolhido `.woff2` (formato web comprimido) entre as variantes regulares disponíveis upstream (`.woff`, `.woff2`, `.otf`, `.eot`). Nenhuma fonte alternativa ou não oficial foi usada, e nenhum recurso externo é carregado em tempo de execução: a fonte deve ser servida localmente pelo plugin.
