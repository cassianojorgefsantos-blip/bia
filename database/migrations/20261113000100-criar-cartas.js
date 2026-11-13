'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Cartas', {
      uuid: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      remetente: { type: Sequelize.STRING(120), allowNull: false },
      destinatario: { type: Sequelize.STRING(120), allowNull: false },
      conteudo: { type: Sequelize.TEXT, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('Cartas'); },
};
