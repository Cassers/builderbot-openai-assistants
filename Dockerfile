# Primera etapa: builder
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Segunda etapa: deploy
FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/*.json /app/*-lock.yaml ./
RUN npm install --production
EXPOSE 3007
CMD ["npm", "start"]