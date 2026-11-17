const loginPage = require('../../pages/login.page.js');
const buildUser = require('../../support/factories/user.factory.js');

const apiUrl = 'https://serverest.dev';

describe('Login', () => {
  let createdUserId;

  beforeEach(() => {
    createdUserId = undefined;
  });

  afterEach(() => {
    if (createdUserId) {
      cy.request({
        method: 'DELETE',
        url: `${apiUrl}/usuarios/${createdUserId}`,
      }).then((response) => {
        expect(response.status).to.equal(200);
      });
    }
  });

  it('should log in with valid credentials', () => {
    const user = buildUser();

    // Create the user through the API to keep the UI steps focused on login.
    cy.request({
      method: 'POST',
      url: `${apiUrl}/usuarios`,
      body: user,
    }).then((registrationResponse) => {
      createdUserId = registrationResponse.body._id;

      expect(registrationResponse.status).to.equal(201);
      expect(registrationResponse.body._id)
        .to.be.a('string')
        .and.not.be.empty;

      loginPage.visit();
      loginPage.login(user.email, user.password);

      cy.location('pathname').should('eq', '/home');
      cy.contains('h1', 'Serverest Store').should('be.visible');
    });
  });

  it('should not log in with an incorrect password', () => {
    const user = buildUser();

    cy.request({
      method: 'POST',
      url: `${apiUrl}/usuarios`,
      body: user,
    }).then((registrationResponse) => {
      createdUserId = registrationResponse.body._id;

      expect(registrationResponse.status).to.equal(201);
      expect(registrationResponse.body._id)
        .to.be.a('string')
        .and.not.be.empty;

      loginPage.visit();
      loginPage.login(user.email, 'WrongPassword123!');

      // Wait for the error before checking the URL, since the test starts on /login.
      cy.contains('[role="alert"]', 'Email e/ou senha inválidos')
        .should('be.visible');

      cy.location('pathname').should('eq', '/login');
    });
  });
});
