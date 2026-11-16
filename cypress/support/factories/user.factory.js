const buildUser = (administrator = 'false') => {
  return {
    nome: 'Automation User',
    email: `qa-${crypto.randomUUID()}@example.com`,
    password: 'Test123!',
    administrador: administrator,
  };
};

module.exports = buildUser;
