module.exports = app => {
  const controller = require('../controllers/cartas')();
  app.route('/api/cartas').get(controller.findAll).post(controller.create).delete(controller.removeAll);
  app.delete('/api/cartas/:uuid', controller.remove);
  app.get('/api/cartas/:uuid', controller.find);
};
