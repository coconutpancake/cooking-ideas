#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

APP_ROOT="${APP_ROOT:-/opt/cooking_ideas}"
API_DIR="${API_DIR:-${APP_ROOT}/apps/web-api}"
REPO_URL="${REPO_URL:-https://github.com/coconutpancake/cooking-ideas.git}"
BRANCH="${BRANCH:-main}"
ARCHIVE="${ARCHIVE:-/tmp/cooking_ideas.tar.gz}"
DOMAIN="${DOMAIN:-api.potinspire.cn}"
PORT="${PORT:-3000}"
NGINX_SITE="cooking-ideas-api"

echo "[setup] Installing system dependencies..."
apt-get update -y
apt-get install -y ca-certificates curl gnupg git nginx rsync build-essential

if ! command -v node >/dev/null 2>&1; then
  echo "[setup] Installing Node.js LTS..."
  curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
  apt-get install -y nodejs
fi

echo "[setup] Installing PM2..."
npm install -g pm2

echo "[setup] Syncing application code..."
mkdir -p "${APP_ROOT}"

if [ -f "${ARCHIVE}" ]; then
  RELEASE_DIR="$(mktemp -d /tmp/cooking_ideas_release.XXXXXX)"
  tar -xzf "${ARCHIVE}" -C "${RELEASE_DIR}"
  rsync -a --delete \
    --exclude ".git" \
    --exclude "node_modules" \
    --exclude ".next" \
    --exclude "*.log" \
    "${RELEASE_DIR}/" "${APP_ROOT}/"
  rm -rf "${RELEASE_DIR}"
elif [ -d "${APP_ROOT}/.git" ]; then
  git -C "${APP_ROOT}" fetch origin "${BRANCH}"
  git -C "${APP_ROOT}" reset --hard "origin/${BRANCH}"
else
  rm -rf "${APP_ROOT}"
  git clone --branch "${BRANCH}" "${REPO_URL}" "${APP_ROOT}"
fi

if [ ! -f "${API_DIR}/.env.local" ]; then
  echo "[setup] ERROR: ${API_DIR}/.env.local is missing. Upload it before starting the API."
  exit 1
fi

echo "[setup] Installing app dependencies..."
cd "${API_DIR}"
npm install

echo "[setup] Building Next.js app..."
npm run build

echo "[setup] Configuring logs and PM2..."
mkdir -p /var/log/cooking-ideas
pm2 startOrReload ecosystem.config.js --env production
pm2 save
pm2 startup systemd -u root --hp /root >/tmp/pm2-startup.log 2>&1 || true

echo "[setup] Configuring Nginx reverse proxy..."
cat >"/etc/nginx/sites-available/${NGINX_SITE}" <<NGINX
server {
    listen 80;
    server_name ${DOMAIN} 120.79.168.106;

    client_max_body_size 4m;

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
NGINX

ln -sf "/etc/nginx/sites-available/${NGINX_SITE}" "/etc/nginx/sites-enabled/${NGINX_SITE}"
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl restart nginx

echo "[setup] Deployment completed."
curl -fsS "http://127.0.0.1:${PORT}/api/vision" >/tmp/cooking-ideas-healthcheck.json
cat /tmp/cooking-ideas-healthcheck.json
