# BUG-001: Cadastro de produto pela interface rejeitado por tipos numéricos incompatíveis

- **Status:** reproduzido; correção não verificada.
- **Data da observação:** 2026-11-15.
- **Área:** integração entre o formulário de produtos e a API.
- **Ambiente:** frontend público `https://front.serverest.dev` e API pública `https://serverest.dev`.
- **Execução:** Ubuntu 24.04, Node.js 24.22.3, Cypress 16.3.0 e Chrome 127.

## Resumo e impacto

Ao cadastrar um produto com preço `150` e quantidade `10` pela interface, a aplicação envia esses campos como strings no JSON. A API responde com status `400`, exigindo valores numéricos, e o redirecionamento para a listagem não ocorre na execução observada.

O problema impede a conclusão do fluxo de cadastro de produto pelo administrador nas condições reproduzidas.

## Pré-condições

- Administrador temporário criado pela API com `administrador: 'true'`.
- Login realizado pela interface com as credenciais desse administrador.
- Nome de produto gerado com UUID para reduzir conflitos com registros existentes.

## Passos para reproduzir

1. Acessar `https://front.serverest.dev/login` e autenticar o administrador.
2. Aguardar o acesso a `/admin/home`.
3. Acessar `/admin/cadastrarprodutos`.
4. Preencher os campos:

   | Campo | Valor |
   |---|---|
   | Nome | `Keyboard <UUID gerado na execução>` |
   | Preço | `150` |
   | Descrição | `Keyboard for automated testing` |
   | Quantidade | `10` |
   | Imagem | Nenhum arquivo selecionado |

5. Clicar em **Cadastrar**.
6. Inspecionar o corpo e a resposta da requisição `POST https://serverest.dev/produtos`.

## Resultado esperado

- Resposta `201` com mensagem de sucesso e ID do produto.
- Redirecionamento para `/admin/listarprodutos`.
- Produto apresentado na listagem com nome, preço, descrição e quantidade correspondentes aos dados informados.

## Resultado obtido e evidência da interface

A requisição observada na execução interativa enviou este corpo:

```json
{
  "nome": "Keyboard b6072323-4ad0-4684-b86b-048ce23cc663",
  "preco": "150",
  "descricao": "Keyboard for automated testing",
  "quantidade": "10"
}
```

A API respondeu com status `400` e o corpo:

```json
{
  "preco": "preco deve ser um número",
  "quantidade": "quantidade deve ser um número"
}
```

O navegador permaneceu em `/admin/cadastrarprodutos`. A falha foi reproduzida em duas execuções: uma no Chrome sem interface gráfica e outra na sessão interativa do Cypress, com dados próprios em cada execução.

## Verificação de controle pela API

Foi realizado um cadastro separado, com outro nome único e os mesmos valores de preço, descrição e quantidade. Nesse controle, preço e quantidade foram enviados como números:

```json
{
  "nome": "Keyboard control 3383dd57-6319-4ff6-bddc-327472848082",
  "preco": 150,
  "descricao": "Keyboard for automated testing",
  "quantidade": 10
}
```

Resultado: status `201` e corpo:

```json
{
  "message": "Cadastro realizado com sucesso",
  "_id": "1EiOWZl9K662dC1Z"
}
```

O produto e o administrador desse controle foram excluídos ao final. As duas exclusões retornaram status `200` e mensagem `Registro excluído com sucesso`.

## Análise

O contrato da API define `preco` e `quantidade` como inteiros. Os valores `150` e `10` foram aceitos no controle, enquanto as strings `"150"` e `"10"` enviadas pela interface foram rejeitadas.

Nos arquivos públicos consultados, o formulário usa os valores de `formData.price` e `formData.quantity`, e o serviço de produtos os repassa para a requisição sem conversão numérica explícita. A evidência aponta para uma incompatibilidade de tipos na integração do frontend com a API.

A conversão com `String(...)` no Page Object representa o texto digitado no campo. A construção do JSON enviado ao servidor é feita pela aplicação. O teste usa `cy.intercept()` para observar essa requisição real e mantém a expectativa de status `201`.

**Correção sugerida:** validar e converter os valores numéricos no frontend antes de montar a requisição, respeitando o contrato da API.

## Reprodução automatizada e limites da verificação

O cenário está em `cypress/e2e/frontend/products.cy.js`, com as ações de tela em `cypress/pages/products.page.js`.

```bash
env -u ELECTRON_RUN_AS_NODE npm run cy:run -- \
  --spec cypress/e2e/frontend/products.cy.js \
  --browser chrome
```

Na condição observada, o resultado foi `0 passing` e `1 failing`, com a assertiva `expected 400 to equal 201`. As validações de redirecionamento e das células da listagem não foram alcançadas.

A execução sem interface gráfica gerou a captura local:

```text
cypress/screenshots/products.cy.js/Products -- should allow an administrator to register a product (failed).png
```

Essa captura corresponde à primeira execução e utiliza outro UUID. A pasta de screenshots é ignorada pelo Git; a imagem é um artefato local, regenerado ao reproduzir a falha, e não está incluída neste documento.

O controle direto na API foi uma investigação adicional, não um cenário de frontend aprovado como sucesso. A suíte completa ainda não foi executada após a inclusão deste cenário, pois sua execução isolada falhou. Nenhuma alteração foi aplicada ao frontend ou à API durante a investigação.

## Referências

- [Contrato da API ServeRest](https://serverest.dev/swagger.json?lang=pt-BR)
- [Código público do formulário de produtos](https://github.com/ServeRest/front/blob/main/src/views/admin/registerProducts.js)
- [Código público do serviço de produtos](https://github.com/ServeRest/front/blob/main/src/services/products.js)
