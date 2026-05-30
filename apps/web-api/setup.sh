#!/bin/bash
set -e

APP_ROOT="${APP_ROOT:-/opt/cooking_ideas}"
API_DIR="${API_DIR:-${APP_ROOT}/apps/web-api}"
REPO_URL="${REPO_URL:-https://github.com/coconutpancake/cooking-ideas.git}"
BRANCH="${BRANCH:-main}"
ARCHIVE="${ARCHIVE:-/tmp/cooking_ideas.tar.gz}"
DOMAIN="${DOMAIN:-api.potinspire.cn}"
PORT="${PORT:-3000}"
ENABLE_HTTPS="${ENABLE_HTTPS:-true}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"

NGINX_CONF="/etc/nginx/conf.d/cooking-ideas-api.conf"
CERTBOT_WEBROOT="/usr/share/nginx/html"

echo "[setup] Checking yum..."
if ! command -v yum >/dev/null 2>&1; then
  echo "[setup] ERROR: yum not found. This script is for CentOS or Alibaba Cloud Linux."
  exit 1
fi

echo "[setup] Installing base packages..."
yum install ca-certificates -y
yum install curl -y
yum install git -y
yum install tar -y
yum install gcc -y
yum install gcc-c++ -y
yum install make -y
yum install cronie -y || true

echo "[setup] Installing Nginx..."
if ! yum install nginx -y; then
  yum install epel-release -y || true
  yum install nginx -y
fi

if ! command -v nginx >/dev/null 2>&1; then
  echo "[setup] ERROR: nginx was not installed successfully."
  exit 1
fi

echo "[setup] Checking Node.js..."
INSTALL_NODE="0"
if ! command -v node >/dev/null 2>&1; then
  INSTALL_NODE="1"
else
  NODE_MAJOR=`node -v | sed 's/^v//' | cut -d. -f1`
  if [ -z "${NODE_MAJOR}" ]; then
    INSTALL_NODE="1"
  elif [ "${NODE_MAJOR}" -lt 20 ]; then
    INSTALL_NODE="1"
  fi
fi

if [ "${INSTALL_NODE}" = "1" ]; then
  echo "[setup] Installing Node.js LTS..."
  curl -fsSL https://rpm.nodesource.com/setup_lts.x | bash -
  yum install nodejs -y
fi

echo "[setup] Node version:"
node -v
npm -v

echo "[setup] Installing PM2..."
npm install -g pm2

echo "[setup] Syncing application code..."
if [ -f "${ARCHIVE}" ]; then
  echo "[setup] Using archive: ${ARCHIVE}"
  rm -rf "${APP_ROOT}"
  mkdir -p "${APP_ROOT}"
  tar -xzf "${ARCHIVE}" -C "${APP_ROOT}"
elif [ -d "${APP_ROOT}/.git" ]; then
  echo "[setup] Updating existing git repo..."
  git -C "${APP_ROOT}" fetch origin "${BRANCH}"
  git -C "${APP_ROOT}" reset --hard "origin/${BRANCH}"
else
  echo "[setup] Cloning repo..."
  rm -rf "${APP_ROOT}"
  git clone --branch "${BRANCH}" "${REPO_URL}" "${APP_ROOT}"
fi

if [ ! -d "${API_DIR}" ]; then
  echo "[setup] ERROR: API directory not found: ${API_DIR}"
  find "${APP_ROOT}" -maxdepth 3 -type d | sort
  exit 1
fi

cd "${API_DIR}"

if [ ! -f ".env.local" ]; then
  echo "[setup] ERROR: ${API_DIR}/.env.local is missing."
  echo "[setup] Please create .env.local first."
  exit 1
fi

echo "[setup] Writing PM2 ecosystem config..."
cat > ecosystem.config.js <<'PM2EOF'
module.exports = {
  apps: [
    {
      name: "cooking-ideas-api",
      cwd: __dirname,
      script: "./node_modules/next/dist/bin/next",
      args: "start -p 3000 -H 127.0.0.1",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      out_file: "/var/log/cooking-ideas/api-out.log",
      error_file: "/var/log/cooking-ideas/api-error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
PM2EOF

echo "[setup] Installing app dependencies..."
npm install

echo "[setup] Building Next.js app..."
npm run build

echo "[setup] Starting app with PM2..."
mkdir -p /var/log/cooking-ideas
pm2 startOrReload ecosystem.config.js --env production
pm2 save
pm2 startup systemd -u root --hp /root >/tmp/pm2-startup.log 2>&1 || true

echo "[setup] Configuring SELinux if enabled..."
yum install policycoreutils-python-utils -y >/dev/null 2>&1 || yum install policycoreutils-python -y >/dev/null 2>&1 || true
setsebool -P httpd_can_network_connect 1 >/dev/null 2>&1 || true

echo "[setup] Configuring Nginx HTTP reverse proxy..."
rm -f /etc/nginx/conf.d/default.conf
mkdir -p "${CERTBOT_WEBROOT}/.well-known/acme-challenge"
echo ok > "${CERTBOT_WEBROOT}/.well-known/acme-challenge/ping"
chmod -R 755 "${CERTBOT_WEBROOT}/.well-known"
chcon -R -t httpd_sys_content_t "${CERTBOT_WEBROOT}/.well-known" >/dev/null 2>&1 || true
restorecon -R "${CERTBOT_WEBROOT}/.well-known" >/dev/null 2>&1 || true

cat > "${NGINX_CONF}" <<NGINXEOF
server {
    listen 80 default_server;
    server_name ${DOMAIN};

    client_max_body_size 8m;

    location /.well-known/acme-challenge/ {
        alias ${CERTBOT_WEBROOT}/.well-known/acme-challenge/;
        try_files \$uri =404;
    }

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
NGINXEOF

nginx -t
systemctl enable nginx
systemctl restart nginx

systemctl enable crond >/dev/null 2>&1 || true
systemctl start crond >/dev/null 2>&1 || true

if command -v firewall-cmd >/dev/null 2>&1; then
  firewall-cmd --permanent --add-service=http || true
  firewall-cmd --permanent --add-service=https || true
  firewall-cmd --reload || true
fi

if [ "${ENABLE_HTTPS}" = "true" ]; then
  echo "[setup] Installing Certbot..."
  if ! yum install certbot -y; then
    yum install epel-release -y || true
    if ! yum install certbot -y; then
      yum install python3 -y || true
      yum install python3-pip -y || true
      python3 -m pip install --upgrade pip || true
      python3 -m pip install certbot
      ln -sf /usr/local/bin/certbot /usr/bin/certbot || true
    fi
  fi

  echo "[setup] Issuing HTTPS certificate..."
  CERTBOT_BASE_ARGS="certonly --webroot -w ${CERTBOT_WEBROOT} -d ${DOMAIN} --non-interactive --agree-tos"
  if [ -n "${CERTBOT_EMAIL}" ]; then
    certbot ${CERTBOT_BASE_ARGS} --email "${CERTBOT_EMAIL}"
  else
    certbot ${CERTBOT_BASE_ARGS} --register-unsafely-without-email
  fi

  echo "[setup] Writing HTTPS Nginx config..."
  cat > "${NGINX_CONF}" <<NGINXEOF
server {
    listen 80 default_server;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        alias ${CERTBOT_WEBROOT}/.well-known/acme-challenge/;
        try_files \$uri =404;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    client_max_body_size 8m;

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
NGINXEOF

  nginx -t
  systemctl reload nginx

  echo "[setup] Installing certbot auto-renew cron..."
  TMP_CRON=`mktemp`
  crontab -l 2>/dev/null | grep -v 'certbot renew' > "${TMP_CRON}" || true
  RENEW_CMD='12 3 * * * /usr/bin/certbot renew --quiet --deploy-hook "systemctl reload nginx"'
  echo "${RENEW_CMD}" >> "${TMP_CRON}"
  crontab "${TMP_CRON}"
  rm -f "${TMP_CRON}"
fi

echo "[setup] Local health check..."
curl -fsS "http://127.0.0.1:${PORT}/api/vision"
echo ""

if [ "${ENABLE_HTTPS}" = "true" ]; then
  echo "[setup] HTTPS health check..."
  curl -fsS "https://${DOMAIN}/api/vision"
  echo ""
fi

echo "[setup] Deployment completed."
echo "[setup] API URL: https://${DOMAIN}"
