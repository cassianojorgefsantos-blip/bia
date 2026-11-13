const initializeModels = require('../models');
const { randomUUID } = require('crypto');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
module.exports = () => ({
  async create(req, res) {
    const body = req.body || {};
    const fields = {};
    for (const [field, max] of [['remetente', 120], ['destinatario', 120], ['conteudo', 10000]]) {
      if (typeof body[field] !== 'string' || !body[field].trim() || body[field].trim().length > max) {
        return res.status(400).send({ message: `Preencha ${field} com até ${max} caracteres.` });
      }
      fields[field] = body[field].trim();
    }
    if (body.uuid && (typeof body.uuid !== 'string' || !UUID.test(body.uuid))) {
      return res.status(400).send({ message: 'Identificador de envio inválido.' });
    }
    try {
      const { Cartas } = await initializeModels();
      // O mesmo identificador permite repetir um envio após falha de rede sem duplicá-lo.
      const [carta, created] = await Cartas.findOrCreate({
        where: { uuid: body.uuid || randomUUID() }, defaults: { ...fields, session_id: (req.headers || {})['x-session-id'] || null },
      });
      if (Object.keys(fields).some(key => carta[key] !== fields[key])) {
        return res.status(409).send({ message: 'Este identificador já foi usado. Tente enviar novamente.' });
      }
      return res.status(created ? 201 : 200).send({ uuid: carta.uuid, remetente: carta.remetente, destinatario: carta.destinatario, conteudo: carta.conteudo, canDelete: !!carta.session_id && carta.session_id === (req.headers || {})['x-session-id'] });
    } catch (error) {
      console.error('Falha ao salvar carta:', error.name);
      return res.status(500).send({ message: 'Não foi possível salvar a carta. Tente novamente.' });
    }
  },
  async findAll(req, res) {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = 6;
    try {
      const { Cartas } = await initializeModels();
      const { count, rows } = await Cartas.findAndCountAll({
        attributes: ['uuid', 'remetente', 'destinatario', 'createdAt'],
        order: [['createdAt', 'DESC'], ['uuid', 'DESC']], limit, offset: (page - 1) * limit,
      });
      return res.send({ data: rows, total: count, page, totalPages: Math.ceil(count / limit) });
    } catch (error) {
      return res.status(500).send({ message: 'Não foi possível carregar as cartas.' });
    }
  },
  async removeAll(req, res) {
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).send({ message: 'Senha de administrador incorreta.' });
    }
    try {
      const { Cartas } = await initializeModels();
      await Cartas.destroy({ where: {} });
      return res.send({ message: 'Todas as cartas foram excluídas.' });
    } catch (error) {
      return res.status(500).send({ message: 'Não foi possível excluir as cartas. Tente novamente.' });
    }
  },
  async remove(req, res) {
    if (!UUID.test(req.params.uuid)) return res.status(400).send({ message: 'Carta inválida.' });
    try {
      const { Cartas } = await initializeModels();
      const carta = await Cartas.findByPk(req.params.uuid);
      if (!carta) return res.status(404).send({ message: 'Carta não encontrada.' });
      const sessionId = req.headers['x-session-id'];
      const adminKey = req.headers['x-admin-key'];
      const isAdmin = !!adminKey && adminKey === process.env.ADMIN_KEY;
      if (!isAdmin && (!sessionId || !carta.session_id || carta.session_id !== sessionId)) {
        return res.status(403).send({ message: 'Você não tem permissão para excluir esta carta.' });
      }
      await carta.destroy();
      return res.send({ message: 'Carta excluída com sucesso.' });
    } catch (error) {
      return res.status(500).send({ message: 'Não foi possível excluir a carta. Tente novamente.' });
    }
  },
  async find(req, res) {
    if (!UUID.test(req.params.uuid)) return res.status(400).send({ message: 'Carta inválida.' });
    try {
      const { Cartas } = await initializeModels();
      const carta = await Cartas.findByPk(req.params.uuid);
      if (!carta) return res.status(404).send({ message: 'Carta não encontrada.' });
      return res.send({ uuid: carta.uuid, remetente: carta.remetente, destinatario: carta.destinatario, conteudo: carta.conteudo, canDelete: !!carta.session_id && carta.session_id === (req.headers || {})['x-session-id'] });
    } catch (error) {
      return res.status(500).send({ message: 'Não foi possível abrir a carta.' });
    }
  },
});
