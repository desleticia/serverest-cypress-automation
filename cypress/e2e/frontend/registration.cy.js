const registrationPage = require('../../pages/registration.page.js');

const apiUrl = 'https://serverest.dev';

describe('User registration', () => {
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

  it('should register a user through the interface', () => {
    const uniqueId = crypto.randomUUID();

    const user = {
      nome: 'Automation User',
      email: `qa-${uniqueId}@example.com`,
      password: 'Test123!',
      administrador: 'false',
    };

    cy.intercept('POST', `${apiUrl}/usuarios`).as('registerUser');

    registrationPage.visit();
    registrationPage.register(user);

    cy.wait('@registerUser').then((interception) => {
      const response = interception.response;

      createdUserId = response.body._id;

      expect(response.statusCode).to.equal(201);
      expect(response.body.message)
        .to.equal('Cadastro realizado com sucesso');
      expect(response.body._id)
        .to.be.a('string')
        .and.not.be.empty;

      cy.location('pathname', { timeout: 10000 })
        .should('eq', '/home');
      cy.contains('h1', 'Serverest Store').should('be.visible');

      cy.request({
        method: 'GET',
        url: `${apiUrl}/usuarios/${createdUserId}`,
      }).then((queryResponse) => {
        expect(queryResponse.status).to.equal(200);
        expect(queryResponse.body._id).to.equal(createdUserId);
        expect(queryResponse.body.nome).to.equal(user.nome);
        expect(queryResponse.body.email).to.equal(user.email);
        expect(queryResponse.body.password).to.equal(user.password);
        expect(queryResponse.body.administrador).to.equal(user.administrador);
      });
    });
  });
});
