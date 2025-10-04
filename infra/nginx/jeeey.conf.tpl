map $http_upgrade $connection_upgrade { default upgrade; '' close; }
proxy_next_upstream error timeout http_502 http_503 http_504;
proxy_next_upstream_tries 2;
map $http_user_agent $is_mobile {
  default 0;
  ~*(iphone|android|mobile|ipad|ipod) 1;
}

# HTTP (80) → HTTPS redirects for all hosts, keep ACME path open
server {
  listen 80;
  listen [::]:80;
  server_name jeeey.com www.jeeey.com;
  location ^~ /.well-known/acme-challenge/ { root /var/www/letsencrypt; default_type text/plain; allow all; }
  location / { return 301 https://$host$request_uri; }
}
server {
  listen 80;
  listen [::]:80;
  server_name admin.jeeey.com;
  location ^~ /.well-known/acme-challenge/ { root /var/www/letsencrypt; default_type text/plain; allow all; }
  location / { return 301 https://$host$request_uri; }
}
server {
  listen 80;
  listen [::]:80;
  server_name api.jeeey.com;
  location ^~ /.well-known/acme-challenge/ { root /var/www/letsencrypt; default_type text/plain; allow all; }
  location / { return 301 https://$host$request_uri; }
}
server {
  listen 80;
  listen [::]:80;
  server_name m.jeeey.com;
  location ^~ /.well-known/acme-challenge/ { root /var/www/letsencrypt; default_type text/plain; allow all; }
  location / { return 301 https://$host$request_uri; }
}
