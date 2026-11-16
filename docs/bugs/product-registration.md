# BUG-001: Product registration through the UI fails because numeric fields are sent as strings

- **Status:** reproduced; fix not verified.
- **First observed:** 2026-11-15.
- **Last automated reproduction:** 2026-11-16.
- **Area:** integration between the product registration form and the API.
- **Environment:** public frontend `https://front.serverest.dev` and public API `https://serverest.dev`.
- **Test environment:** Ubuntu 24.04, Node.js 24.22.3, Cypress 16.3.0 and Chrome 127.

Payloads, response messages and quoted UI labels are preserved in their original language as evidence.

## Summary and impact

When registering a product through the UI with price `150` and quantity `10`, the application sends these fields as strings in the JSON payload. The API responds with status `400`, requiring numeric values, and the expected redirect to the product list does not occur in the observed execution.

This issue prevents the administrator from completing product registration under the reproduced conditions.

## Preconditions

- A temporary administrator has been created through the API with `administrador: 'true'`.
- The administrator has signed in through the UI.
- The product name includes a generated UUID to reduce conflicts with existing records.

## Steps to reproduce

1. Open `https://front.serverest.dev/login` and sign in as the administrator.
2. Wait for navigation to `/admin/home`.
3. Open `/admin/cadastrarprodutos`.
4. Fill in the fields:

   | Field | Value |
   |---|---|
   | Name | `Keyboard <UUID generated during execution>` |
   | Price | `150` |
   | Description | `Keyboard for automated testing` |
   | Quantity | `10` |
   | Image | No file selected |

5. Click the register button, labeled **Cadastrar** in the UI.
6. Inspect the request body and response for `POST https://serverest.dev/produtos`.

## Expected result

- Status `201` with a success message and the product ID.
- Navigation to `/admin/listarprodutos`.
- The product appears in the list with the same name, price, description and quantity entered in the form.

## Actual result and UI evidence

The request observed during the interactive execution sent this body:

```json
{
  "nome": "Keyboard b6072323-4ad0-4684-b86b-048ce23cc663",
  "preco": "150",
  "descricao": "Keyboard for automated testing",
  "quantidade": "10"
}
```

The API responded with status `400` and this body:

```json
{
  "preco": "preco deve ser um número",
  "quantidade": "quantidade deve ser um número"
}
```

The API reports that price and quantity must be numbers. The browser remained on `/admin/cadastrarprodutos`. The initial investigation reproduced the failure twice: once in headless Chrome and once in an interactive Cypress session, using separate test data for each execution.

## Direct API control check

A separate product was submitted with another unique name and the same price, description and quantity. In this control check, price and quantity were sent as numbers:

```json
{
  "nome": "Keyboard control 3383dd57-6319-4ff6-bddc-327472848082",
  "preco": 150,
  "descricao": "Keyboard for automated testing",
  "quantidade": 10
}
```

Result: status `201` and this body:

```json
{
  "message": "Cadastro realizado com sucesso",
  "_id": "1EiOWZl9K662dC1Z"
}
```

The product and administrator used in this control check were deleted afterward. Both deletions returned status `200` and the message `Registro excluído com sucesso` (record successfully deleted).

## Analysis

The API contract defines `preco` and `quantidade` as integers. The values `150` and `10` were accepted in the control check, while the strings `"150"` and `"10"` sent by the UI were rejected.

In the public source files inspected, the form uses values from `formData.price` and `formData.quantity`, and the product service passes them to the request without an explicit numeric conversion. The evidence points to a type mismatch in the integration between the frontend and the API.

The `String(...)` conversion in the Page Object represents the text typed into the input. The application builds the JSON sent to the server. The test uses `cy.intercept()` to observe this real request and keeps status `201` as its expected result.

**Suggested fix:** validate and convert numeric values in the frontend before building the request, following the API contract.

## Automated reproduction and verification scope

The scenario is in `cypress/known-issues/products.cy.js`, with UI interactions in `cypress/pages/products.page.js`.

The main suite contains the six scenarios selected for delivery: three API scenarios and three frontend scenarios. This additional reproduction lives in `cypress/known-issues/` and has a separate execution command. It still expects successful registration with status `201`; while the issue persists, the command returns a failure.

```bash
npm run test:known-issues
```

If the terminal sets `ELECTRON_RUN_AS_NODE=1`, use `env -u ELECTRON_RUN_AS_NODE npm run test:known-issues` to start Cypress with that variable removed for this command only.

To observe the reproduction in the Cypress UI:

```bash
npm run cy:open -- --e2e --browser chrome --config "specPattern=cypress/known-issues/**/*.cy.js"
```

The initial investigation produced `0 passing` and `1 failing`, with the assertion `expected 400 to equal 201`. The redirect and product table assertions were not reached.

During command verification on 2026-11-16, `npm test` passed all six main scenarios, `npm run test:api` passed the three API scenarios, and `npm run test:e2e` passed the three frontend scenarios. Separately, `npm run test:known-issues` found the scenario at its new location and reproduced `expected 400 to equal 201`, returning exit code `1`.

The headless execution generated this local screenshot:

```text
cypress/screenshots/products.cy.js/Products -- should allow an administrator to register a product (failed).png
```

Later executions with other UUIDs may overwrite the screenshot. The screenshots directory is ignored by Git; the image is a local artifact, regenerated when reproducing the failure, and is not included in this document.

The direct API control was an additional investigation, not a passing frontend scenario. The six main scenarios passed in a combined execution; this result excludes the BUG-001 reproduction. No changes were made to the frontend or API during the investigation.

## References

- [ServeRest API contract](https://serverest.dev/swagger.json?lang=pt-BR)
- [Public product registration form source](https://github.com/ServeRest/front/blob/main/src/views/admin/registerProducts.js)
- [Public product service source](https://github.com/ServeRest/front/blob/main/src/services/products.js)
