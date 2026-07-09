#!/bin/bash
set -e

echo "=== System Environment Initialization ==="
echo "Working directory: $(pwd)"
echo "Current user: $(whoami) (UID: $(id -u))"

# Set up custom directories in /tmp for MariaDB to make sure they are writable by rootless user 1000
mkdir -p /tmp/mysql-data /tmp/mysql-log

# Initialize database directory if it has not been initialized yet
if [ ! -d "/tmp/mysql-data/mysql" ]; then
    echo "Initializing new MariaDB database files in /tmp/mysql-data..."
    if command -v mariadb-install-db &> /dev/null; then
        mariadb-install-db --no-defaults --datadir=/tmp/mysql-data --auth-root-authentication-method=normal --skip-test-db
    else
        mysql_install_db --no-defaults --datadir=/tmp/mysql-data --auth-root-authentication-method=normal --skip-test-db
    fi
    echo "MariaDB database files initialized successfully."
else
    echo "MariaDB database directory already exists. Skipping initialization."
fi

echo "Starting MariaDB daemon in the background..."
# Start mysqld process in the background, redirecting logs to a file in /tmp/mysql-log
mysqld --no-defaults --datadir=/tmp/mysql-data --port=3306 --bind-address=127.0.0.1 \
       --socket=/tmp/mysql.sock --pid-file=/tmp/mysqld.pid \
       --general-log-file=/tmp/mysql-log/mysql.log --log-error=/tmp/mysql-log/mysql-err.log &

# Wait for the database server to become ready
echo "Waiting for MariaDB daemon to start up..."
for i in {1..30}; do
    if mysqladmin --socket=/tmp/mysql.sock ping --silent; then
        echo "MariaDB is online and responding!"
        break
    fi
    echo "Still waiting for MariaDB... ($i/30)"
    sleep 1
done

if ! mysqladmin --socket=/tmp/mysql.sock ping --silent; then
    echo "ERROR: MariaDB failed to start within 30 seconds."
    echo "=== ERROR LOG ==="
    cat /tmp/mysql-log/mysql-err.log
    exit 1
fi

# Set up the database and root user credentials
echo "Configuring database '$DB_NAME' and root credentials..."
mysql --socket=/tmp/mysql.sock -u root -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\`;"
mysql --socket=/tmp/mysql.sock -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '$DB_PASSWORD'; FLUSH PRIVILEGES;"

# Apply database schema
echo "Applying database schema..."
mysql --socket=/tmp/mysql.sock -u root -p"$DB_PASSWORD" "$DB_NAME" < /app/server/sql/01_schema.sql

# Seed the database
echo "Seeding the database with initial records..."
mysql --socket=/tmp/mysql.sock -u root -p"$DB_PASSWORD" "$DB_NAME" < /app/server/sql/02_seed.sql

# Verify the database setup
echo "Running verification queries..."
mysql --socket=/tmp/mysql.sock -u root -p"$DB_PASSWORD" "$DB_NAME" < /app/server/sql/03_verify.sql

echo "Database preparation completed successfully."
echo "=== Starting Fullstack Application Backend ==="
cd /app/server
node index.js
