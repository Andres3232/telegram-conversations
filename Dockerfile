FROM node:20.19.0-alpine AS installer
RUN apk --no-cache add tzdata python3 make bash g++ && rm -rf /var/cache/apk/*
ENV TZ=America/Buenos_Aires
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20.19.0-alpine AS builder
RUN apk --no-cache add tzdata python3 make bash g++ && rm -rf /var/cache/apk/*
ENV TZ=America/Buenos_Aires
ENV NODE_ENV=production

WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/package*.json ./
COPY nest-cli.json tsconfig.build.json tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20.19.0-alpine AS runner
RUN apk --no-cache add tzdata bash && rm -rf /var/cache/apk/*
ENV TZ=America/Buenos_Aires
WORKDIR /app
COPY --from=installer /app/package*.json ./
RUN npm ci --only=production --loglevel=error
COPY --from=builder /app/dist ./dist
# COPY /config ./config
COPY /docs ./docs
ENV NODE_ENV=${NODE_ENV:-production}
ENV NODE_CONFIG_ENV=${NODE_CONFIG_ENV:-dev}
ENV SERVICE_ENVIRONMENT=${SERVICE_ENVIRONMENT}

EXPOSE 3000
USER node
CMD ["node", "dist/main.js"]
