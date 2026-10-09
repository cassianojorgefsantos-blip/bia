#!/bin/bash
set -e

# =============================================================================
# deploy.sh — Script de deploy para ECS
# Projeto BIA | Formação AWS
#
# Uso:
#   ./deploy.sh deploy [HASH]   Build, push para ECR e deploy no ECS
#                               Se HASH não for informado, usa o commit atual
#   ./deploy.sh list            Lista revisões da task definition
#   ./deploy.sh rollback <REV>  Faz rollback para uma revisão específica
# =============================================================================

# ---------------------------------------------------------------------------
# Configurações — ajuste conforme o ambiente
# ---------------------------------------------------------------------------
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_REPO="bia"
CLUSTER="cluster-bia-alb"
SERVICE="service-bia-alb"

# Task definition é derivada automaticamente do service
# service-bia      → task-def-bia
# service-bia-alb  → task-def-bia-alb
TASK_DEF_FAMILY="task-def-${SERVICE#service-}"

REPOSITORY_URI="$ECR_REGISTRY/$ECR_REPO"

# ---------------------------------------------------------------------------
# Funções auxiliares
# ---------------------------------------------------------------------------
log()   { echo "[INFO]  $*"; }
warn()  { echo "[WARN]  $*"; }
error() { echo "[ERROR] $*" >&2; exit 1; }

check_dependencies() {
  for cmd in aws docker git jq; do
    command -v "$cmd" &>/dev/null || error "Dependência não encontrada: $cmd"
  done
}

ecr_login() {
  log "Fazendo login no ECR..."
  aws ecr get-login-password --region "$AWS_REGION" \
    | docker login --username AWS --password-stdin "$ECR_REGISTRY"
}

wait_service_stable() {
  log "Aguardando o service estabilizar (pode levar alguns minutos)..."
  aws ecs wait services-stable \
    --region "$AWS_REGION" \
    --cluster "$CLUSTER" \
    --services "$SERVICE"
  log "Service estável. Deploy concluído com sucesso."
}

# ---------------------------------------------------------------------------
# Comando: deploy
# ---------------------------------------------------------------------------
cmd_deploy() {
  local hash="$1"

  # Pega o hash do commit atual se não for informado
  if [ -z "$hash" ]; then
    hash=$(git rev-parse --short=7 HEAD 2>/dev/null) \
      || error "Não foi possível obter o hash do commit. Verifique se está em um repositório git."
  else
    # Normaliza para 7 caracteres
    hash="${hash:0:7}"
  fi

  local image_tag="$REPOSITORY_URI:$hash"

  log "=== DEPLOY ==="
  log "Cluster:        $CLUSTER"
  log "Service:        $SERVICE"
  log "Task Def:       $TASK_DEF_FAMILY"
  log "Imagem:         $image_tag"
  echo ""

  # 1. Build
  log "Construindo imagem Docker..."
  docker build -t "$image_tag" -t "$REPOSITORY_URI:latest" .

  # 2. Push para o ECR
  ecr_login
  log "Fazendo push da imagem para o ECR..."
  docker push "$image_tag"
  docker push "$REPOSITORY_URI:latest"

  # 3. Pega a task definition atual
  log "Buscando task definition atual: $TASK_DEF_FAMILY"
  local task_def_json
  task_def_json=$(aws ecs describe-task-definition \
    --region "$AWS_REGION" \
    --task-definition "$TASK_DEF_FAMILY" \
    --query "taskDefinition" \
    --output json) \
    || error "Task definition '$TASK_DEF_FAMILY' não encontrada. Verifique se ela existe no ECS."

  # 4. Gera nova revisão trocando apenas a tag da imagem
  log "Registrando nova revisão da task definition..."
  local new_task_def
  new_task_def=$(echo "$task_def_json" \
    | jq --arg IMAGE "$image_tag" \
        'del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)
         | .containerDefinitions[0].image = $IMAGE')

  local new_task_arn
  new_task_arn=$(aws ecs register-task-definition \
    --region "$AWS_REGION" \
    --cli-input-json "$new_task_def" \
    --query "taskDefinition.taskDefinitionArn" \
    --output text)

  local new_revision
  new_revision=$(echo "$new_task_arn" | awk -F: '{print $NF}')
  log "Nova revisão registrada: $TASK_DEF_FAMILY:$new_revision"

  # 5. Atualiza o service
  log "Atualizando service no ECS..."
  aws ecs update-service \
    --region "$AWS_REGION" \
    --cluster "$CLUSTER" \
    --service "$SERVICE" \
    --task-definition "$new_task_arn" \
    --force-new-deployment \
    --output text --no-cli-pager > /dev/null

  wait_service_stable
}

# ---------------------------------------------------------------------------
# Comando: list
# ---------------------------------------------------------------------------
cmd_list() {
  log "=== REVISÕES DA TASK DEFINITION: $TASK_DEF_FAMILY ==="
  echo ""

  local revisions
  revisions=$(aws ecs list-task-definitions \
    --region "$AWS_REGION" \
    --family-prefix "$TASK_DEF_FAMILY" \
    --sort DESC \
    --query "taskDefinitionArns[]" \
    --output json) \
    || error "Não foi possível listar as task definitions."

  local count
  count=$(echo "$revisions" | jq 'length')

  if [ "$count" -eq 0 ]; then
    warn "Nenhuma revisão encontrada para '$TASK_DEF_FAMILY'."
    return
  fi

  printf "%-10s %-12s %-60s\n" "REVISÃO" "STATUS" "IMAGEM"
  printf "%-10s %-12s %-60s\n" "--------" "----------" "------------------------------------------------------------"

  for arn in $(echo "$revisions" | jq -r '.[]'); do
    local detail
    detail=$(aws ecs describe-task-definition \
      --region "$AWS_REGION" \
      --task-definition "$arn" \
      --query "taskDefinition" \
      --output json)

    local revision status image
    revision=$(echo "$detail" | jq -r '.revision')
    status=$(echo "$detail"   | jq -r '.status')
    image=$(echo "$detail"    | jq -r '.containerDefinitions[0].image')

    printf "%-10s %-12s %-60s\n" "$revision" "$status" "$image"
  done

  echo ""
  log "Total: $count revisões encontradas."
  log "Para fazer rollback: ./deploy.sh rollback <REVISÃO>"
}

# ---------------------------------------------------------------------------
# Comando: rollback
# ---------------------------------------------------------------------------
cmd_rollback() {
  local revision="$1"

  [ -z "$revision" ] && error "Informe o número da revisão. Uso: ./deploy.sh rollback <REVISÃO>"

  # Valida que é um número
  [[ "$revision" =~ ^[0-9]+$ ]] || error "Revisão inválida: '$revision'. Use um número inteiro (ex: 12)."

  local target_task_def="$TASK_DEF_FAMILY:$revision"

  log "=== ROLLBACK ==="
  log "Cluster:     $CLUSTER"
  log "Service:     $SERVICE"
  log "Revisão alvo: $target_task_def"
  echo ""

  # Verifica se a revisão existe
  log "Verificando revisão $target_task_def..."
  local task_def_json
  task_def_json=$(aws ecs describe-task-definition \
    --region "$AWS_REGION" \
    --task-definition "$target_task_def" \
    --query "taskDefinition" \
    --output json 2>/dev/null) \
    || error "Revisão '$target_task_def' não encontrada. Use './deploy.sh list' para ver as revisões disponíveis."

  local status image
  status=$(echo "$task_def_json" | jq -r '.status')
  image=$(echo "$task_def_json"  | jq -r '.containerDefinitions[0].image')

  log "Revisão encontrada — Status: $status | Imagem: $image"

  # Registra nova revisão baseada na revisão escolhida (boa prática: não reutilizar revisão antiga)
  log "Registrando nova revisão baseada em $target_task_def..."
  local new_task_def
  new_task_def=$(echo "$task_def_json" \
    | jq 'del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)')

  local new_task_arn
  new_task_arn=$(aws ecs register-task-definition \
    --region "$AWS_REGION" \
    --cli-input-json "$new_task_def" \
    --query "taskDefinition.taskDefinitionArn" \
    --output text)

  local new_revision
  new_revision=$(echo "$new_task_arn" | awk -F: '{print $NF}')
  log "Nova revisão registrada: $TASK_DEF_FAMILY:$new_revision (espelho da revisão $revision)"

  # Atualiza o service
  log "Atualizando service para a nova revisão..."
  aws ecs update-service \
    --region "$AWS_REGION" \
    --cluster "$CLUSTER" \
    --service "$SERVICE" \
    --task-definition "$new_task_arn" \
    --force-new-deployment \
    --output text --no-cli-pager > /dev/null

  wait_service_stable
}

# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
check_dependencies

case "${1:-}" in
  deploy)
    cmd_deploy "${2:-}"
    ;;
  list)
    cmd_list
    ;;
  rollback)
    cmd_rollback "${2:-}"
    ;;
  *)
    echo ""
    echo "Uso: ./deploy.sh <comando> [argumentos]"
    echo ""
    echo "Comandos:"
    echo "  deploy [HASH]     Build, push para ECR e deploy no ECS."
    echo "                    Se HASH não for informado, usa o commit atual do git."
    echo "  list              Lista as revisões da task definition."
    echo "  rollback <REV>    Faz rollback para a revisão informada."
    echo ""
    echo "Exemplos:"
    echo "  ./deploy.sh deploy"
    echo "  ./deploy.sh deploy abc1234"
    echo "  ./deploy.sh list"
    echo "  ./deploy.sh rollback 12"
    echo ""
    exit 1
    ;;
esac
