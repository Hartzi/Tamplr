
apt-get update
apt-get upgrade
apt-get install -y git nodejs npm postgresql

# on ubuntu, Node.js executable installs as nodejs, not node as usual.
# nodejs-legacy makes a symlink node -> nodejs
apt-get install nodejs-legacy

# Create PostgreSQL database postgres://vagrant:vagrant@localhost/tamplr
sudo -u postgres psql -c "CREATE ROLE vagrant WITH SUPERUSER PASSWORD 'vagrant' LOGIN;"
sudo -u vagrant createdb
sudo -u vagrant psql -c "CREATE DATABASE tamplr;"
