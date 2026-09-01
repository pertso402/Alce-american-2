# Alce American — loja

Loja da Alce American: tereré e mate, térmicos, vestuário e acessórios.
Site estático de arquivo único (`index.html`), sem build e sem dependências.
O pedido é montado no site e finalizado pelo WhatsApp.

## Estrutura

```
index.html                 site inteiro (HTML + CSS + JS)
assets/                    imagens, vídeo do banner e logos
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
| `instagram` | @ do perfil, sem o `@`. Vazio = o link não aparece |
| `email` | E-mail de contato. Vazio = o link não aparece |
| `cnpj` | CNPJ do rodapé. Vazio = a linha não aparece |
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

## O vídeo do kit no banner

O banner da home mostra o **vídeo real do kit girando**, em loop, sem som e sem
controles. O bloco inteiro é um link para a página do kit, e o botão
"Adicionar à sacola" ao lado põe o kit no carrinho direto da home.

### Por que o vídeo é vaivém e não um giro completo

O arquivo original tem um **corte seco entre os quadros 175 e 176**: a diferença
entre esses dois quadros é 28,4 quando o passo normal entre quadros vizinhos é
2,1. O giro salta um pedaço ali — faltam ângulos que não dá para inventar. Além
disso o último quadro parava a ~6 quadros de distância do primeiro, o que dava
um segundo tranco na emenda do loop.

A solução foi usar só o trecho contínuo (quadros 0 a 175) e tocá-lo de ida e
volta. Numa virada de direção não existe emenda, então o loop é perfeito:
depois do tratamento o maior salto interno caiu de 28,4 para 3,6, e a emenda do
loop ficou em 1,56 — abaixo do passo médio entre quadros (1,93).

Se algum dia você gravar um giro de 360° realmente contínuo, dá para voltar ao
giro completo: é só remover o trecho de `reverse`/`concat` do comando de encode.

### Como o arquivo foi preparado

A partir do original (720x1280, 24 fps, 8 s):

- recorte `720x960`, que contém o produto inteiro em todos os quadros do giro —
  as bombas sobem e descem enquanto gira;
- vira quadrado `720x720` preenchendo as laterais com o próprio fundo
  desfocado, então encaixa no banner sem cortar nada e sem emenda visível;
- trecho 0–175 de ida e volta, resultando em 350 quadros (14,6 s);
- áudio removido;
- saída em `kit-3d.webm` (490 KB) e `kit-3d.mp4` (515 KB), mais
  `kit-3d-poster.jpg` como primeiro quadro.

### Comportamento no site

- **Autoplay funciona no celular** porque o vídeo é `muted` + `playsinline`.
- **Pausa quando sai da tela**, para não gastar bateria rodando escondido.
- Com **"reduzir movimento"** ligado no sistema, fica parado no poster.
- Se o navegador não tocar vídeo, aparece a foto `kit-copo-bomba.jpg`.

Para trocar o vídeo depois, gere os três arquivos com os mesmos nomes em
`assets/` — o HTML não precisa mudar.
