# syntax=docker/dockerfile:1.7

# 1) Install dependencies with cache
FROM node:22.12-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# 2) Build the app
FROM node:22.12-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3) Minimal runtime using Vite preview (no extra servers)
FROM node:22.12-alpine AS runner
WORKDIR /app
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "--port", "4173"]
