# Image size ~ 400MB
FROM node:22.23.5-alpine as builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.15.1 --activate
ENV PNPM_HOME=/usr/local/bin

COPY . .

COPY package*.json *-lock.yaml ./

RUN apk add --no-cache --virtual .gyp \
        python3 \
        make \
        g++ \
    && apk add --no-cache git \
    && pnpm install --frozen-lockfile && pnpm run build \
    && apk del .gyp

FROM node:22.23.5-alpine as deploy

WORKDIR /app

ARG PORT
ENV PORT $PORT
EXPOSE $PORT

COPY --from=builder /app/assets ./assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/*.json /app/*-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./

RUN corepack enable && corepack prepare pnpm@11.15.1 --activate
ENV PNPM_HOME=/usr/local/bin
RUN mkdir /app/tmp
RUN npm cache clean --force && pnpm install --prod --frozen-lockfile --ignore-scripts \
    && addgroup -g 1001 -S nodejs && adduser -S -u 1001 nodejs \
    && rm -rf $PNPM_HOME/.npm $PNPM_HOME/.node-gyp

CMD ["node", "dist/app.js"]
