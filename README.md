# ServeRest Cypress Automation

API and frontend test automation for the [ServeRest](https://serverest.dev/) sample application, built with Cypress and JavaScript.

The main suite contains **three API scenarios and three frontend scenarios**. An additional product registration scenario reproduces a documented application defect and runs separately.

## Requirements and setup

The project has been validated locally on Ubuntu 24.04 with Node.js 24.22.3, npm 11.19.1, Cypress 16.3.0 and Google Chrome 127.

Requirements:

- Node.js 24.x and npm.
- Git and Google Chrome installed.
- Network access to `https://serverest.dev` and `https://front.serverest.dev`.
- The operating system dependencies listed in the [Cypress installation guide](https://docs.cypress.io/app/get-started/install-cypress#linux-prerequisites).

Clone the repository, install the locked dependency versions and verify the Cypress executable:

```bash
git clone https://github.com/desleticia/serverest-cypress-automation.git
cd serverest-cypress-automation
npm ci
npx cypress verify
```

If the Cypress executable has not been downloaded, run `npx cypress install` and repeat the verification.

No existing ServeRest account is required. The tests create their own users.

## Running the tests

Run the main suite:

```bash
npm test
```

| Command | Scope |
|---|---|
| `npm test` | All six main scenarios in headless Chrome. |
| `npm run test:api` | Three API scenarios, using the API as the execution base URL. |
| `npm run test:e2e` | Three frontend scenarios in headless Chrome. |
| `npm run cy:run` | The same main suite, with support for additional Cypress CLI arguments. |
| `npm run cy:open` | Cypress interactive mode. |
| `npm run test:known-issues` | The additional BUG-001 reproduction, which can fail while the application defect persists. |

To watch the main scenarios in Chrome:

```bash
npm run cy:open -- --e2e --browser chrome
```

Select a spec from the Cypress file list. API scenarios display requests and assertions in the command log; frontend scenarios also interact with the application in the browser.

To run a single main spec:

```bash
npm run cy:run -- --spec cypress/e2e/frontend/login.cy.js
```

The frontend base URL is configured in `cypress.config.js`. API requests use absolute URLs in their specs.

### Terminal troubleshooting

If a terminal sets `ELECTRON_RUN_AS_NODE=1`, Cypress may fail to start. On Linux, remove that variable for the command only:

```bash
env -u ELECTRON_RUN_AS_NODE npm test
```

The same prefix can be used with the other npm commands. No permanent environment change is required.

## Continuous integration

The [Cypress tests workflow](.github/workflows/cypress.yml) is configured to run on pushes to `main`, pull requests targeting `main`, and manual requests from the repository's **Actions** tab.

The job uses an Ubuntu 24.04 GitHub-hosted runner with Chrome and sets up Node.js 24. It installs locked dependencies with `npm ci`, verifies the Cypress executable, and runs `npm test` to execute the six main scenarios. The job has a fifteen-minute timeout and uses the npm download cache.

Review the step logs in [GitHub Actions](https://github.com/desleticia/serverest-cypress-automation/actions). When an execution fails and Cypress has generated screenshots, the workflow uploads them as the `cypress-screenshots` artifact, retained for seven days. An installation failure may occur before any screenshot exists.

The BUG-001 reproduction remains separate and can be run with `npm run test:known-issues`. It is not part of the six main scenarios executed by this workflow.

Check the Actions run for the commit under review to confirm the remote result. The local results below are separate evidence and do not establish the outcome of a GitHub-hosted run.

## Test coverage

| Area | Scenario | Main assertions |
|---|---|---|
| API | Successful user registration | Status `201`, the specific success message and a non-empty string ID. |
| API | Registration with a duplicate email | Status `400` and the specific duplicate-email message. |
| API | User lookup by ID | Status `200` and matching ID, name, email, password and administrator flag. |
| Frontend | Login with valid credentials | Navigation to `/home` and a visible `Serverest Store` heading. |
| Frontend | Login with an incorrect password | A visible invalid-credentials alert, followed by confirmation that the browser remains on `/login`. |
| Frontend | User registration through the UI | Status `201`, success message, non-empty string ID, navigation to `/home`, a visible store heading and matching persisted user data retrieved through the API. |

Password comparison in user responses follows this sample application's API contract and uses synthetic test credentials.

## Test strategy and technical decisions

### Scenario selection

The selected scenarios address account creation, email uniqueness, user identity and authentication outcomes. They combine successful flows with explicit rejection of invalid operations.

User lookup compares the returned record with the data created by that scenario. The frontend registration scenario also retrieves the created user through the API to check whether the form values and the common-user profile were persisted correctly.

The invalid-login scenario waits for the error alert before checking the URL. The browser already starts on `/login`, so checking only that path would not establish that the authentication attempt had been processed.

### Independent data and cleanup

Each scenario prepares its own data and can run without another scenario executing first. Login scenarios create their users through the API because account creation is a precondition; the UI registration scenario creates its user through the form.

The [user factory](cypress/support/factories/user.factory.js) returns a new object with a UUID-based email for each call:

```js
const user = buildUser();
const admin = buildUser('true');
```

Names and passwords are predictable synthetic values. Only the email must vary to reduce registration conflicts. The administrator flag uses strings `'false'` and `'true'`, as required by the API.

Created IDs are stored before subsequent assertions. Each spec resets its stored IDs in `beforeEach` and requests cleanup in `afterEach` when those IDs are available. The product reproduction deletes the product before the administrator, using the authorization captured from the browser request.

### Maintainable UI interactions

Page Objects are small JavaScript objects that group form selectors and actions. The specs retain the scenario assertions so that the expected behavior remains visible when reading a test.

Form fields and buttons are located primarily with `data-testid`. Text is used when the visible content itself is part of the expected result, such as the store heading or the authentication error.

The factory was extracted after repeated user payloads appeared across specs. No additional data-generation dependency was needed for the current scenarios.

### Synchronization and real requests

The frontend scenarios interact with the real application and API. `cy.intercept()` observes browser requests, and `cy.wait('@alias')` waits for the corresponding request and response.

UI queries and assertions use Cypress retry behavior. Registration navigation has a maximum wait of ten seconds to accommodate the application's delayed redirect; execution continues as soon as the expected path is reached. The tests do not use fixed-duration waits.

The duplicate-email API request uses `failOnStatusCode: false` to allow inspection of the expected `400` response. Its status and message are still explicitly asserted.

## Project structure

| Path | Responsibility |
|---|---|
| `cypress/e2e/api/` | The three main API scenarios. |
| `cypress/e2e/frontend/` | The three main frontend scenarios. |
| `cypress/pages/` | Page Objects for login, user registration and product registration. |
| `cypress/support/factories/` | Shared user test data generation. |
| `cypress/known-issues/` | Additional reproductions of documented application defects. |
| `docs/bugs/` | Defect reports with reproduction steps, observed results and investigation evidence. |
| `cypress.config.js` | Cypress configuration and frontend base URL. |
| `.github/workflows/` | GitHub Actions configuration for the main suite. |

## Known issue: product registration

[BUG-001](docs/bugs/product-registration.md) documents a failure in the integration between the product form and the API. In the observed executions, the UI sent price and quantity as strings and received status `400`. A direct API control check with numeric values returned `201`.

The delivered frontend scope includes user registration. Product registration is retained as an additional reproduction in `cypress/known-issues/products.cy.js`, outside Cypress's default `cypress/e2e/` discovery path.

```bash
npm run test:known-issues
```

This command explicitly selects the known-issue directory. The scenario still expects status `201` and checks the product data if creation succeeds. While the observed defect persists, the command exits with a failure; that failure is not counted as a passing main-suite scenario.

The report includes the payloads, the API control check and instructions for interactive reproduction. Original API messages are preserved as evidence.

## Latest local validation

Observed local results using Chrome 127:

| Command | Latest result | Verified on |
|---|---|---|
| `npm test` | 6 passed. | 2026-11-17 |
| `npm run test:api` | 3 passed. | 2026-11-16 |
| `npm run test:e2e` | 3 passed. | 2026-11-16 |
| `npm run test:known-issues` | 1 failed: `expected 400 to equal 201`, reproducing BUG-001. | 2026-11-16 |

The Cypress executable verification also passed on 2026-11-17.

These results describe the observed executions. The applications are public shared environments, so their availability, behavior and data may change.

## Artifacts and coverage limits

Cypress generates screenshots for failed headless runs in `cypress/screenshots/`. Generated screenshots and videos are ignored by Git. The BUG-001 report identifies the local screenshot path and the command that regenerates it.

The suite provides focused functional coverage. It does not establish complete authorization coverage, session-expiration behavior, all field boundaries, cross-browser compatibility or performance targets. Response checks are partial contract and data assertions, not full JSON Schema validation.

Cleanup depends on obtaining the created IDs and reaching the cleanup hooks. An interrupted execution or a missing creation response can leave temporary data in the shared environment.
