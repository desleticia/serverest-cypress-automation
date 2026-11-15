const apiUrl = 'https://serverest.dev';

describe('Users API', () => {
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

  it('should return the registered user when searching by ID', () => {
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
