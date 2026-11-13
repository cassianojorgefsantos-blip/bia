# Desenvolvimento — NPA / REC'n'Play

## Alterações

Cadastro compacto, menu em /menu, feedbacks em /recados e cartas públicas em /cartas. A tabela Cartas é independente dos feedbacks existentes. O destinatário é uma dedicatória pública, não um controle de acesso.

## Banco de dados

Configure as variáveis de banco já utilizadas pelo projeto e execute na raiz:

```sh
npx sequelize-cli db:migrate
```

A migração 20261113000100-criar-cartas.js cria somente a tabela de cartas e não transforma nem remove feedbacks.

## Prévia local no Codespace

A revisão utiliza um PostgreSQL isolado no container npa-review-db, porta local 5433, banco bia. Os registros de demonstração não são dados de produção. A migração já foi aplicada nesse banco.

API (terminal 1):

```sh
env "$(cat ~/.config/npa/admin.env)" DB_SECRET_NAME= DB_HOST=127.0.0.1 DB_PORT=5433 DB_USER=postgres DB_PWD=postgres CACHE_ENDPOINT= PORT=8080 node server.js
```

Frontend (terminal 2):

```sh
env VITE_API_URL=/backend npm --prefix client run dev -- --host 0.0.0.0 --port 3002 --strictPort
```

O proxy /backend encaminha as chamadas ao backend local na porta 8080. Abra a porta 3002 pelo painel Portas do Codespace. Se os processos já estiverem ativos, basta abrir a prévia. Para reiniciar o banco existente: docker start npa-review-db.

## Verificação

```sh
npm test -- --runInBand
npm --prefix client run build
git diff --check
```

Verificados: 26 testes unitários, build, cadastro e menu responsivos, envio de feedback, validação/envio/persistência de cartas, leitura de mensagem longa, texto HTML exibido literalmente, Escape e retorno de foco, temas claro e escuro com estrelas.

Nenhum deploy foi executado. Antes de uma futura publicação, aplique a migração no banco do ambiente correspondente usando sua configuração própria.

## Exclusão de cartas
A migração 20261113000200-cartas-sessao adiciona a identificação do navegador autor. Novas cartas podem ser excluídas pelo autor na janela de leitura, com confirmação. Cartas anteriores sem identificação permanecem disponíveis; somente a API administrativa pode removê-las. Migração aplicada no banco local de revisão. Build e verificação HTTP de permissões/exclusão passaram.

Administração das cartas: botão Apagar todas as cartas (admin) na listagem e Excluir como admin dentro da carta. A senha é validada no servidor via ADMIN_KEY, com confirmação na interface. Build e verificação isolada de exclusão individual/total e rejeição de senha incorreta passaram.
