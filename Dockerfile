FROM node:20-alpine AS builder

# better-sqlite3 requires native build tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install root deps (backend)
COPY package.json package-lock.json* ./
RUN npm ci

# Install frontend deps
COPY frontend/package.json frontend/package-lock.json* ./frontend/
RUN cd frontend && npm ci

# Copy source
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY tsconfig*.json* ./

# Build
RUN cd frontend && npm run build
RUN npx tsc -p backend/tsconfig.json

FROM node:20-alpine

# Required at runtime by better-sqlite3 native module
RUN apk add --no-cache libstdc++

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

RUN mkdir -p data

EXPOSE 3000
CMD ["node", "dist/backend/server.js"]
