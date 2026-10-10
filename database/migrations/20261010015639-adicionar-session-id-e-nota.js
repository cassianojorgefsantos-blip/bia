"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Tarefas", "session_id", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Tarefas", "nota", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("Tarefas", "session_id");
    await queryInterface.removeColumn("Tarefas", "nota");
  },
};
