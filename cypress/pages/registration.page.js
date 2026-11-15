const registrationPage = {
  visit: () => {
    cy.visit('/cadastrarusuarios');
  },

  register: (user) => {
    cy.get('[data-testid="nome"]').type(user.nome);
    cy.get('[data-testid="email"]').type(user.email);
    cy.get('[data-testid="password"]').type(user.password);
    cy.get('[data-testid="cadastrar"]').click();
  },
};

module.exports = registrationPage;
