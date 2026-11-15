const loginPage = require('../../pages/login.page.js');

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
    const uniqueId = crypto.randomUUID();

    const user = {
      nome: 'Automation User',
      email: `qa-${uniqueId}@example.com`,
      password: 'Test123!',
      administrador: 'false',
    };

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
});
