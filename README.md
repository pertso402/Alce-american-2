# Alce American — loja

Loja da Alce American: tereré e mate, térmicos, vestuário e acessórios.
Site estático de arquivo único (`index.html`), sem build e sem dependências.
O pedido é montado no site e finalizado pelo WhatsApp.

## Estrutura

```
index.html                 site inteiro (HTML + CSS + JS)
assets/                    imagens usadas pelo site (otimizadas) e logos
produtos e precos/         fotos originais, como recebidas
.claude/launch.json        servidor local de desenvolvimento
```

## Rodar localmente

Qualquer servidor estático serve. Com Node instalado:

```bash
npx --yes serve .
```

Abrir `index.html` direto pelo `file://` também funciona, mas o servidor evita
qualquer problema de caminho relativo.

## Antes de publicar — configuração obrigatória

Abra o `index.html`, procure por `const CONFIG` (perto do início da tag
`<script>`) e preencha:

| Campo | O que é |
|---|---|
| `whatsapp` | Número com DDI + DDD, só dígitos. Ex.: `5567999998888` |
| `instagram` | @ do perfil, sem o `@` |
| `email` | E-mail de contato |
| `cnpj` | CNPJ exibido no rodapé |
| `freteGratis` | Valor mínimo para frete grátis (R$) |
| `pixDesconto` | Desconto à vista no Pix (`0.10` = 10%) |
| `maxParcelas` / `parcelaMinima` | Regras de parcelamento no cartão |

Enquanto o `whatsapp` estiver no valor de exemplo, o console do navegador avisa.

## Catálogo

Os produtos ficam no array `PRODUTOS`, também no `index.html`. Cada item tem:

```js
{
  id, nome, cat, preco,
  bg,          // fundo do card — combina com o fundo da foto
  imgs: [],    // primeira imagem é a da vitrine
  variacao,    // opcional: { rotulo: 'Tamanho', opcoes: [...] }
  selo,        // opcional: etiqueta verde no card
  destaque,    // opcional: aparece na seção "Destaques" da home
  resumo, desc, specs
}
```

Para adicionar um produto: coloque a foto em `assets/` e acrescente um objeto ao
array. Nada mais precisa ser alterado.

## Publicar

Por ser estático, funciona em GitHub Pages, Vercel, Netlify ou qualquer
hospedagem comum. No GitHub Pages, basta apontar para a branch `main` na raiz.

## O kit 3D do banner

O banner da home mostra um **modelo 3D procedural** do kit (copo em inox com o
logo gravado + bomba V4 Square), que gira sozinho e pode ser girado com o
mouse ou o dedo. O código está em `assets/kit3d.js` e usa three.js, que fica
versionado em `assets/vendor/` — o site não depende de CDN.

Pontos que valem saber antes de mexer:

- **É uma representação, não um scan do produto.** As proporções e o acabamento
  foram modelados a partir das fotos. A foto real continua sendo a imagem da
  página do produto.
- **A foto é o fallback.** Ela fica embaixo do canvas e só some quando o 3D
  carrega. Se o WebGL falhar, se o navegador for antigo ou se a pessoa usar
  "reduzir movimento" no sistema, o banner mostra a foto e nada quebra.
- **O carregamento é sob demanda.** O three.js (~690 KB, ~170 KB comprimido) só
  é baixado na home, via `import()` dinâmico — as outras páginas não pagam esse
  custo.
- **A animação pausa sozinha** quando o banner sai da tela ou a aba vai para
  segundo plano, e a cena é destruída ao navegar para outra página.

Para ajustar: a velocidade de giro é a constante `AUTO`, o enquadramento está em
`camera.position` / `ALVO`, e a iluminação (o que o inox reflete) é toda gerada
em `texturaAmbiente()`.
