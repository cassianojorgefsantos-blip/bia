jest.mock('../../../api/models', () => jest.fn());
const initializeModels = require('../../../api/models');
const factory = require('../../../api/controllers/cartas');
const uuid = '94386e45-372f-48b0-a00e-af32ff243b21';
describe('Cartas públicas', () => {
  let res, model, controller;
  beforeEach(() => {
    jest.clearAllMocks();
    res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    model = { findOrCreate: jest.fn(), findAndCountAll: jest.fn(), findByPk: jest.fn() };
    initializeModels.mockResolvedValue({ Cartas: model });
    controller = factory();
  });
  test.each([{}, {remetente:' ',destinatario:'Ana',conteudo:'Oi'}, {remetente:[],destinatario:'Ana',conteudo:'Oi'}, {remetente:'Bel',destinatario:'Ana',conteudo:'x'.repeat(10001)}])('rejeita campos inválidos sem consultar banco: %j', async body => {
    await controller.create({ body }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(initializeModels).not.toHaveBeenCalled();
  });
  test('salva texto com parágrafos e remove apenas espaços externos', async () => {
    const fields = { remetente:'Bel',destinatario:'Ana',conteudo:'Olá!\n\nObrigado.' };
    model.findOrCreate.mockResolvedValue([{uuid,...fields},true]);
    await controller.create({body:{uuid,...fields,remetente:' Bel '}},res);
    expect(model.findOrCreate).toHaveBeenCalledWith({where:{uuid},defaults:fields});
    expect(res.status).toHaveBeenCalledWith(201);
  });
  test('repetição do mesmo envio retorna a carta existente', async () => {
    const body = {uuid,remetente:'Bel',destinatario:'Ana',conteudo:'Olá'};
    model.findOrCreate.mockResolvedValue([body,false]);
    await controller.create({body},res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  test('não reutiliza identificador com conteúdo diferente', async () => {
    model.findOrCreate.mockResolvedValue([{remetente:'Bel',destinatario:'Ana',conteudo:'Original'},false]);
    await controller.create({body:{uuid,remetente:'Bel',destinatario:'Ana',conteudo:'Alterado'}},res);
    expect(res.status).toHaveBeenCalledWith(409);
  });
  test('lista paginada não consulta o corpo das cartas', async () => {
    model.findAndCountAll.mockResolvedValue({count:8,rows:[]});
    await controller.findAll({query:{page:'2'}},res);
    const query = model.findAndCountAll.mock.calls[0][0];
    expect(query.attributes).not.toContain('conteudo');
    expect(query.offset).toBe(6);
    expect(res.send).toHaveBeenCalledWith({data:[],total:8,page:2,totalPages:2});
  });
  test('carta ausente responde 404', async () => {
    model.findByPk.mockResolvedValue(null);
    await controller.find({params:{uuid}},res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
  test('erro de banco não é apresentado como sucesso', async () => {
    model.findAndCountAll.mockRejectedValue(new Error('database unavailable'));
    await controller.findAll({query:{}},res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
