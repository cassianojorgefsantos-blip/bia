const initializeModels = require("../models");
const cache = require("../../lib/cache");

const CACHE_KEY = "tarefas:all";

async function refreshCache() {
  if (!process.env.CACHE_ENDPOINT) return;
  const { Tarefas } = await initializeModels();
  const data = await Tarefas.findAll();
  await cache.set(CACHE_KEY, data);
}

module.exports = () => {
  const controller = {};

  controller.create = async (req, res) => {
    try {
      const { Tarefas } = await initializeModels();
      console.log("[CREATE] body recebido:", JSON.stringify(req.body));
      const tarefa = {
        titulo: req.body.titulo,
        dia_atividade: req.body.dia_atividade,
        importante: req.body.importante,
        session_id: req.body.session_id || null,
        nota: req.body.nota || null,
      };

      const data = await Tarefas.create(tarefa);
      await refreshCache();
      res.send(data);
    } catch (err) {
      res.status(500).send({ message: err.message || "Deu ruim." });
    }
  };

  controller.find = async (req, res) => {
    try {
      const { Tarefas } = await initializeModels();
      const data = await Tarefas.findByPk(req.params.uuid);
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({ message: "Tarefa não encontrada." });
      }
    } catch (err) {
      res.status(500).send({ message: err.message || "Deu ruim." });
    }
  };

  controller.delete = async (req, res) => {
    try {
      const { Tarefas } = await initializeModels();
      const { uuid } = req.params;
      const sessionId = req.headers["x-session-id"] || null;
      const adminKey = req.headers["x-admin-key"] || null;
      const isAdmin = adminKey && adminKey === process.env.ADMIN_KEY;

      const tarefa = await Tarefas.findByPk(uuid);

      if (!tarefa) {
        return res.status(404).send({ message: "Tarefa não encontrada." });
      }

      // Admin pode deletar qualquer uma; usuário só a própria
      if (!isAdmin && tarefa.session_id !== sessionId) {
        return res.status(403).send({ message: "Você não tem permissão para excluir este feedback." });
      }

      await Tarefas.destroy({ where: { uuid } });
      await refreshCache();
      res.send({ message: "Tarefa deletada com sucesso." });
    } catch (err) {
      res.status(500).send({ message: err.message || "Deu ruim." });
    }
  };

  controller.update_priority = async (req, res) => {
    try {
      const { Tarefas } = await initializeModels();
      const { uuid } = req.params;
      await Tarefas.update(req.body, { where: { uuid } });
      await refreshCache();
      const data = await Tarefas.findByPk(uuid);
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({ message: "Tarefa não encontrada." });
      }
    } catch (err) {
      res.status(500).send({ message: err.message || "Deu ruim." });
    }
  };

  controller.deleteAll = async (req, res) => {
    try {
      const adminKey = req.headers["x-admin-key"] || null;
      const isAdmin = adminKey && adminKey === process.env.ADMIN_KEY;

      if (!isAdmin) {
        return res.status(403).send({ message: "Acesso negado." });
      }

      const { Tarefas } = await initializeModels();
      await Tarefas.destroy({ where: {}, truncate: true });
      await cache.del(CACHE_KEY);
      res.send({ message: "Todas as tarefas foram deletadas." });
    } catch (err) {
      res.status(500).send({ message: err.message || "Deu ruim." });
    }
  };

  controller.findAll = async (req, res) => {
    try {
      const cacheEnabled = !!process.env.CACHE_ENDPOINT;
      const start = Date.now();

      let cacheError = false;
      if (cacheEnabled) {
        const result = await cache.get(CACHE_KEY);
        cacheError = result.error;
        if (result.data) {
          const elapsed = Date.now() - start;
          const remaining = await cache.ttl(CACHE_KEY);
          console.log(`[CACHE HIT] tarefas - ${elapsed}ms - TTL restante: ${remaining}s`);
          return res.send({ fromCache: true, cacheTTL: remaining, cacheTime: elapsed, data: result.data });
        }
        if (cacheError) {
          console.log(`[CACHE ERROR] tarefas - Redis indisponível, buscando do banco`);
        }
      }

      const { Tarefas } = await initializeModels();
      const dbStart = Date.now();
      const data = await Tarefas.findAll();
      const dbTime = Date.now() - dbStart;
      const elapsed = Date.now() - start;

      if (cacheEnabled) {
        if (!cacheError) await cache.set(CACHE_KEY, data);
        const ttl = Number(process.env.CACHE_TTL) || 60;
        console.log(`[CACHE MISS] tarefas - ${elapsed}ms (db: ${dbTime}ms)${cacheError ? " (cache indisponível)" : ", cache setado com TTL: " + ttl + "s"}`);
        return res.send({ fromCache: false, cacheTTL: ttl, cacheError, dbTime, data });
      }

      console.log(`[DB] tarefas - ${dbTime}ms`);
      res.send({ dbTime, data });
    } catch (err) {
      res.status(500).send({ message: err.message || "Deu ruim." });
    }
  };

  return controller;
};
