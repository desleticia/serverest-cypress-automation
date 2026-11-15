const productsPage = {
  visit: () => {
    cy.visit('/admin/cadastrarprodutos');
  },

  register: (product) => {
    cy.get('[data-testid="nome"]').type(product.nome);
    cy.get('[data-testid="preco"]').type(String(product.preco));
    cy.get('[data-testid="descricao"]').type(product.descricao);
    cy.get('[data-testid="quantity"]').type(String(product.quantidade));
    cy.get('[data-testid="cadastarProdutos"]').click();
  },

  getProductRow: (name) => {
    return cy.contains('tbody tr', name);
  },
};

module.exports = productsPage;
