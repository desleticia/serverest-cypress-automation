const apiUrl = 'https://serverest.dev';

describe('User registration API', () => {
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

  it('should register a user successfully', () => {
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
    }).then((response) => {
      createdUserId = response.body._id;

      expect(response.status).to.equal(201);
      expect(response.body.message)
        .to.equal('Cadastro realizado com sucesso');
      expect(response.body._id)
        .to.be.a('string')
        .and.not.be.empty;
    });
  });

  it('should reject user registration with a duplicate email', () => {
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

      cy.request({
        method: 'POST',
        url: `${apiUrl}/usuarios`,
        body: user,
        failOnStatusCode: false,
      }).then((duplicateResponse) => {
        expect(duplicateResponse.status).to.equal(400);
        expect(duplicateResponse.body.message)
          .to.equal('Este email já está sendo usado');
      });
    });
  });
});
