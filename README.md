# ServeRest Tests — CI&T Technical Assessment

This project was developed for the CI&T QA technical challenge using Cypress and JavaScript to test the [ServeRest](https://serverest.dev/) application.

The challenge requires three API scenarios and three frontend scenarios.

## Setup

Requirements: Node.js 24, npm, Git and Google Chrome.

```bash
git clone https://github.com/desleticia/serverest-cypress-automation.git
cd serverest-cypress-automation
npm ci
npx cypress verify
```

The tests create their own users, so no existing account is needed.

## Running the tests

| Command | What it runs |
|---|---|
| `npm test` | All six scenarios in headless Chrome |
| `npm run test:api` | Three API scenarios |
| `npm run test:e2e` | Three frontend scenarios |
| `npm run cy:open` | Cypress interactive mode |
| `npm run test:known-issues` | The additional product registration defect reproduction |

If Cypress fails to start because `ELECTRON_RUN_AS_NODE` is set, run `env -u ELECTRON_RUN_AS_NODE npm test` on Linux.

## Scenarios

| Area | Scenario | Main checks |
|---|---|---|
| API | Register a user | Status 201, success message and generated ID |
| API | Register with a duplicate email | Status 400 and duplicate-email message |
| API | Find a user by ID | Status 200 and returned data matching the created user |
| Frontend | Log in with valid credentials | Home page navigation and visible store heading |
| Frontend | Log in with an incorrect password | Visible error message and remaining on the login page |
| Frontend | Register a user through the form | Successful response, home page navigation and persisted user data |

The scenarios cover account creation, email uniqueness and authentication, including successful flows and expected errors.

## Test organization

- `cypress/e2e/api/`: API scenarios.
- `cypress/e2e/frontend/`: frontend scenarios.
- `cypress/pages/`: Page Objects with form selectors and actions.
- `cypress/support/factories/`: shared user data generation.
- `cypress/known-issues/`: additional defect reproduction.
- `docs/bugs/`: defect report and investigation evidence.

Each scenario creates its own data and requests cleanup afterward. Emails include a UUID to reduce conflicts in the shared environment.

Login tests prepare users through the API so the UI steps focus on authentication. The registration test creates the user through the form and checks the saved data through the API.

Page Objects group UI interactions, while assertions stay in the test files. The tests use `data-testid` selectors where available and avoid fixed-duration waits.

## Known issue: product registration

During product registration testing, the frontend sent price and quantity as strings. The API rejected the request with status 400. A separate API check using numeric values returned 201.

The investigation is documented in [BUG-001](docs/bugs/product-registration.md).

The additional test still expects successful registration. It runs separately with `npm run test:known-issues` and fails while the defect persists. It is not included in the six main scenarios.

## GitHub Actions

The [workflow](.github/workflows/cypress.yml) runs the six main scenarios on pushes and pull requests to `main`, and can also be started manually. Failure screenshots are uploaded when available.

[View test runs](https://github.com/desleticia/serverest-cypress-automation/actions).

## Scope and limitations

This project provides focused functional coverage in Chrome. It does not cover the entire application, performance or a full security assessment.

The tests use public environments, whose availability and behavior may change. Cleanup depends on receiving the created IDs and completing the cleanup hooks.
