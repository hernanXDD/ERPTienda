# ERP Tienda API — imagen para Easypanel / Docker
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PUERTO=3000

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev && npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Migraciones al arrancar; la semilla se ejecuta una sola vez aparte (ver guía de despliegue).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
