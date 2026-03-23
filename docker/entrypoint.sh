#!/bin/sh
set -eu

RUNTIME_CONFIG_FILE="/app/browser/runtime-config.js"
AUTH_API_PREFIX="${AUTH_API_PREFIX:-}"

AUTH_LOGIN_ENDPOINT="${AUTH_LOGIN_ENDPOINT:-${AUTH_API_PREFIX}/auth/login}"
AUTH_REGISTER_ENDPOINT="${AUTH_REGISTER_ENDPOINT:-${AUTH_API_PREFIX}/users}"
AUTH_REFRESH_ENDPOINT="${AUTH_REFRESH_ENDPOINT:-${AUTH_API_PREFIX}/auth/refresh}"
AUTH_LOGOUT_ENDPOINT="${AUTH_LOGOUT_ENDPOINT:-${AUTH_API_PREFIX}/auth/logout}"
AUTH_ME_ENDPOINT="${AUTH_ME_ENDPOINT:-${AUTH_API_PREFIX}/me}"

API_ALLOWED_PREFIXES="${API_ALLOWED_PREFIXES:-/auth,/api,/me,/users}"

cat > "$RUNTIME_CONFIG_FILE" <<EOC
window.__RUNTIME_CONFIG__ = {
  apiAllowedPrefixes: [$(printf '%s' "$API_ALLOWED_PREFIXES" | awk -F',' '{for(i=1;i<=NF;i++){gsub(/^ +| +$/, "", $i); if(length($i)>0){printf "%s\"%s\"", (count++?",":""), $i}}}')],
  authEndpoints: {
    login: "${AUTH_LOGIN_ENDPOINT}",
    register: "${AUTH_REGISTER_ENDPOINT}",
    refresh: "${AUTH_REFRESH_ENDPOINT}",
    logout: "${AUTH_LOGOUT_ENDPOINT}",
    me: "${AUTH_ME_ENDPOINT}"
  }
};
EOC

exec node /app/server/server.mjs
