#!/usr/bin/env bash
# 운영 배포 (Oracle Cloud 공유 서버, docker-compose.prod.yml).
# 전용 경로 검증 → DB 백업 → 코드 동기화 → 이미지 빌드 → health 대기 → 실패 시 이전 이미지로 롤백.
# 최초 1회 원격 준비(경로·.env·nginx·인증서)는 docs/setup-guide.md "6. 운영 배포" 참고.
# 사용법: ./deploy/deploy.sh <ssh호스트> [/절대/원격경로]   예) ./deploy/deploy.sh ubuntu@168.107.12.64
set -euo pipefail

SERVER="${1:?사용법: ./deploy/deploy.sh <ssh호스트> [/절대/원격경로]}"
REMOTE_DIR="${2:-/opt/routinebox}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ "$REMOTE_DIR" != /* ]]; then
  echo "원격 경로는 절대 경로여야 합니다: $REMOTE_DIR" >&2
  exit 2
fi

REVISION="$(git -C "$ROOT" rev-parse --short HEAD)"
if [[ -n "$(git -C "$ROOT" status --porcelain)" ]]; then
  REVISION="${REVISION}-dirty"
  echo "경고: 커밋되지 않은 변경이 함께 배포됩니다."
fi

echo "[1/5] 원격 배포 경로 검증 ($SERVER:$REMOTE_DIR)"
ssh "$SERVER" bash -s -- "$REMOTE_DIR" <<'REMOTE'
set -euo pipefail
root="$(realpath -e -- "$1")"
if [[ "$root" == "/" || "$root" == "$(realpath -e -- "$HOME")" ]]; then
  echo "루트 또는 홈에는 배포할 수 없습니다: $root" >&2
  exit 2
fi
[[ -f "$root/.routinebox-deploy-root" ]] || { echo "전용 배포 경로 표식이 없습니다: $root/.routinebox-deploy-root" >&2; exit 2; }
[[ -f "$root/.env" ]] || { echo "운영 .env 가 없습니다: $root/.env" >&2; exit 2; }
REMOTE

echo "[2/5] PostgreSQL 배포 전 백업"
ssh "$SERVER" bash -s -- "$REMOTE_DIR" <<'REMOTE'
set -euo pipefail
cd "$1"
mkdir -p backups
if [[ -f docker-compose.prod.yml ]] && docker compose -f docker-compose.prod.yml ps --status running --services 2>/dev/null | grep -qx db; then
  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  tmp="backups/.pre-deploy-${stamp}.sql.gz.tmp"
  docker compose -f docker-compose.prod.yml exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' | gzip -9 > "$tmp"
  test -s "$tmp"
  mv "$tmp" "backups/pre-deploy-${stamp}.sql.gz"
  find backups -maxdepth 1 -type f -name 'pre-deploy-*.sql.gz' -mtime +30 -delete
  echo "백업 생성: backups/pre-deploy-${stamp}.sql.gz"
else
  echo "실행 중인 DB 가 없어 백업을 건너뜁니다 (최초 배포)."
fi
REMOTE

echo "[3/5] 코드 동기화 ($REVISION)"
# 제외 항목은 --delete 에서도 보호된다 (원격 .env·백업·표식 파일 유지).
rsync -az --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'dist' \
  --exclude 'coverage' \
  --exclude '.env' \
  --exclude '.env.*' \
  --exclude '.DS_Store' \
  --exclude '.claude' \
  --exclude 'backups' \
  --exclude '.routinebox-deploy-root' \
  --exclude 'RoutineBox_계획서' \
  --exclude '보고서' \
  --exclude 'figures' \
  --exclude '*.docx' \
  --exclude '원고.md' \
  --exclude '*.py' \
  "$ROOT/" "$SERVER:$REMOTE_DIR/"
ssh "$SERVER" "printf '%s\n' '$REVISION' > '$REMOTE_DIR/.deploy-revision'"

echo "[4/5] 이미지 빌드 (기존 컨테이너는 빌드 동안 계속 서비스)"
ssh "$SERVER" bash -s -- "$REMOTE_DIR" <<'REMOTE'
set -euo pipefail
cd "$1"
for image in routinebox-api routinebox-web; do
  if docker image inspect "$image:latest" >/dev/null 2>&1; then
    docker tag "$image:latest" "$image:rollback"
  fi
done
docker compose -f docker-compose.prod.yml build
REMOTE

echo "[5/5] 컨테이너 교체·health 대기"
ssh "$SERVER" bash -s -- "$REMOTE_DIR" <<'REMOTE'
set -euo pipefail
cd "$1"
compose="docker compose -f docker-compose.prod.yml"
if ! $compose up -d --wait --wait-timeout 300; then
  echo "새 배포가 정상 상태에 도달하지 못했습니다." >&2
  $compose logs --tail=120 api web >&2 || true
  if docker image inspect routinebox-api:rollback >/dev/null 2>&1; then
    # 주의: 이미 적용된 DB 마이그레이션은 되돌리지 않는다 (필요 시 backups/ 의 덤프로 복구).
    echo "이전 이미지로 롤백합니다." >&2
    docker tag routinebox-api:rollback routinebox-api:latest
    docker tag routinebox-web:rollback routinebox-web:latest
    $compose up -d --no-build --force-recreate --wait --wait-timeout 180 api web
  fi
  exit 1
fi
$compose ps
curl -fsS http://127.0.0.1:4300/health && echo
curl -fsS -o /dev/null -w "web: HTTP %{http_code}\n" http://127.0.0.1:3300/
docker image prune -f >/dev/null
REMOTE

echo "배포 완료 ($REVISION)"
