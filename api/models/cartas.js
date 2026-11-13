module.exports = (sequelize, DataTypes) => sequelize.define('Cartas', {
  uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  session_id: { type: DataTypes.STRING(255), allowNull: true },
  remetente: { type: DataTypes.STRING(120), allowNull: false },
  destinatario: { type: DataTypes.STRING(120), allowNull: false },
  conteudo: { type: DataTypes.TEXT, allowNull: false },
});
