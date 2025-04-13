FROM node:18
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
# Build the application for production
RUN npm run build

# Install a simple static server globally
RUN npm install -g serve

CMD ["serve", "-s", "build", "-l", "tcp://0.0.0.0:${PORT}"]