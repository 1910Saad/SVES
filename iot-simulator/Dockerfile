FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
ENV PORT=8080
ENV BACKEND_URL=https://sves-backend-796928583635.us-central1.run.app
CMD ["node", "simulator.js"]
