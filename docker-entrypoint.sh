#!/bin/sh


# Start Node.js backend if server storage is enabled
if [ "$ENABLE_SERVER_STORAGE" = "true" ]; then
    echo "Starting FossFLOW backend server..."
    cd /app/packages/fossflow-backend
    if [ -n "$PUID" ] && [ -n "$PGID" ]; then
        su-exec $PUID:$PGID node server.js &
        echo "Backend server started as $PUID:$PGID"
    else 
        node server.js &
        echo "Backend server started"
    fi
else
    echo "Server storage disabled, backend not started"
fi

# Start nginx

# Configure HTTP Basic Auth
touch /etc/nginx/.htpasswd
if [ -n "$HTTP_AUTH_USER" ] && [ -n "$HTTP_AUTH_PASSWORD" ]; then
    echo "Setup HTTP Basic Auth..."
    echo "$HTTP_AUTH_USER:$(printf '%s' "$HTTP_AUTH_PASSWORD" | openssl passwd -bcrypt -stdin)" > /etc/nginx/.htpasswd
    sed -i 's/AUTH_BASIC_SETTING/"Restricted"/g' /etc/nginx/http.d/default.conf
else
    echo "No (optional) HTTP Basic Auth configured"
    sed -i 's/AUTH_BASIC_SETTING/off/g' /etc/nginx/http.d/default.conf
fi
# Configure live status feed
CONF=/etc/nginx/http.d/default.conf
if [ -n "$LIVE_STATUS_URL" ]; then
    echo "Live status: proxying /live-status.json to $LIVE_STATUS_URL"
    AUTH_LINE=""
    if [ -n "$LIVE_STATUS_AUTH" ]; then
        # LIVE_STATUS_AUTH = user:password for an upstream protected by basic auth
        AUTH_LINE="proxy_set_header Authorization \"Basic $(printf '%s' "$LIVE_STATUS_AUTH" | base64 | tr -d '\n')\";"
    fi
    DIRECTIVES="proxy_pass $LIVE_STATUS_URL; proxy_ssl_server_name on; $AUTH_LINE proxy_hide_header Set-Cookie;"
else
    echo "Live status: serving /data/live-status.json if present"
    DIRECTIVES="root /data; try_files /live-status.json =404;"
fi
ESCAPED=$(printf '%s' "$DIRECTIVES" | sed -e 's/[\/&|]/\\&/g')
sed -i "s|# LIVE_STATUS_DIRECTIVES|$ESCAPED|" "$CONF"

echo "Starting nginx..."
nginx -g "daemon off;"