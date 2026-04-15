FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
# Cloud Run expects the app to listen on the port defined by the PORT environment variable.
ENV PORT=5000
CMD ["node", "src/server.js"]
