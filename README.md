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
