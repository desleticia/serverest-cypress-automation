const loginPage = {
  visit: () => {
    cy.visit('/login');
  },

  login: (email, password) => {
    cy.get('[data-testid="email"]').type(email);
    cy.get('[data-testid="senha"]').type(password);
    cy.get('[data-testid="entrar"]').click();
  },
};

module.exports = loginPage;
