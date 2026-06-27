# ERP Tienda API — imagen para Easypanel / Docker
# Mirror ECR público: evita rate limit 429 de Docker Hub en VPS compartidos.
FROM public.ecr.aws/docker/library/node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

FROM public.ecr.aws/docker/library/node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PUERTO=3000

COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Semilla manual en consola: npm run db:seed (requiere src/ + ts-node; NODE_ENV=production los omite por defecto)
RUN npm ci --omit=dev \
  && NODE_ENV=development npm install ts-node typescript prisma --no-save \
  && npx prisma generate

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src

RUN mkdir -p /app/logo
ENV CARPETA_LOGO=/app/logo

EXPOSE 3000

# Migraciones al arrancar; la semilla se ejecuta una sola vez aparte (ver DESPLIEGUE.md).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
