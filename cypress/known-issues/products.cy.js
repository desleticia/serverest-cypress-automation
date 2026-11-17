const loginPage = require('../pages/login.page.js');
const productsPage = require('../pages/products.page.js');
const buildUser = require('../support/factories/user.factory.js');

const apiUrl = 'https://serverest.dev';

describe('Products', () => {
  let createdUserId;
  let createdProductId;
  let authorization;

  beforeEach(() => {
    createdUserId = undefined;
    createdProductId = undefined;
    authorization = undefined;
  });

  afterEach(() => {
    if (createdProductId) {
      cy.request({
        method: 'DELETE',
        url: `${apiUrl}/produtos/${createdProductId}`,
        headers: {
          Authorization: authorization,
        },
      }).then((response) => {
        expect(response.status).to.equal(200);
      });
    }

    if (createdUserId) {
      cy.request({
        method: 'DELETE',
        url: `${apiUrl}/usuarios/${createdUserId}`,
      }).then((response) => {
        expect(response.status).to.equal(200);
      });
    }
  });

  it('should allow an administrator to register a product', () => {
    const uniqueId = crypto.randomUUID();

    const admin = buildUser('true');

    const product = {
      nome: `Keyboard ${uniqueId}`,
      preco: 150,
      descricao: 'Keyboard for automated testing',
      quantidade: 10,
    };

    cy.request({
      method: 'POST',
      url: `${apiUrl}/usuarios`,
      body: admin,
    }).then((registrationResponse) => {
      createdUserId = registrationResponse.body._id;

      expect(registrationResponse.status).to.equal(201);
      expect(registrationResponse.body._id)
        .to.be.a('string')
        .and.not.be.empty;

      loginPage.visit();
      loginPage.login(admin.email, admin.password);

      cy.location('pathname').should('eq', '/admin/home');

      productsPage.visit();

      cy.intercept('POST', `${apiUrl}/produtos`).as('createProduct');

      productsPage.register(product);

      cy.wait('@createProduct').then((interception) => {
        const response = interception.response;

        authorization = interception.request.headers.authorization;
        createdProductId = response.body._id;

        // BUG-001: keep 201 as the expected result (docs/bugs/product-registration.md).
        expect(response.statusCode).to.equal(201);
        expect(response.body.message)
          .to.equal('Cadastro realizado com sucesso');
        expect(response.body._id)
          .to.be.a('string')
          .and.not.be.empty;
      });

      cy.location('pathname').should('eq', '/admin/listarprodutos');

      productsPage.getProductRow(product.nome).within(() => {
        cy.get('td').eq(0).should('have.text', product.nome);
        cy.get('td').eq(1).should('have.text', String(product.preco));
        cy.get('td').eq(2).should('have.text', product.descricao);
        cy.get('td').eq(3).should('have.text', String(product.quantidade));
      });
    });
  });
});
