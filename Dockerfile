FROM node:20-bullseye

# Install MariaDB server and client
RUN apt-get update && apt-get install -y mariadb-server mariadb-client && rm -rf /var/lib/apt/lists/*

# Set standard environment variables for database client socket
ENV MYSQL_UNIX_PORT=/tmp/mysql.sock
ENV PORT=7860
ENV DB_HOST=127.0.0.1
ENV DB_PORT=3306
ENV DB_USER=root
ENV DB_PASSWORD=Ashlesh@12
ENV DB_NAME=aeras_db
ENV DB_SSL=false

# Setup application directory
WORKDIR /app

# Copy package configuration files for caching yarn/npm install steps
COPY --chown=node:node server/package*.json ./server/
COPY --chown=node:node ["DBMS Project/package*.json", "DBMS Project/"]

# Install dependencies for frontend and backend
WORKDIR "/app/DBMS Project"
RUN npm install

WORKDIR /app/server
RUN npm install

# Copy all files into the container
WORKDIR /app
COPY --chown=node:node . .

# Build the frontend assets
WORKDIR "/app/DBMS Project"
RUN npm run build

# Return to root application workspace
WORKDIR /app

# Ensure start script has correct line endings and permissions
RUN sed -i 's/\r$//' start.sh && chmod +x start.sh

# Expose the standard Hugging Face Spaces port
EXPOSE 7860

# Switch to the node user (UID 1000) for security and rootless environment support
USER node

# Define the entrypoint start script
CMD ["/app/start.sh"]
