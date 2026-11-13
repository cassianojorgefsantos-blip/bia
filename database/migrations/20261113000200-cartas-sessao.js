module.exports = {
  async up(queryInterface, Sequelize) { await queryInterface.addColumn('Cartas', 'session_id', { type: Sequelize.STRING(255), allowNull: true }); },
  async down(queryInterface) { await queryInterface.removeColumn('Cartas', 'session_id'); }
};
