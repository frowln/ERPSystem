# =============================================================================
# PRIVOD NEXT Frontend -- Production Multi-Stage Build
# React 19 / Vite 6 / TypeScript 5
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Install dependencies
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps

WORKDIR /app

# Copy package files for dependency caching
COPY package.json package-lock.json* ./

# Install production dependencies
RUN if [ -f package-lock.json ]; then \
        npm ci --prefer-offline; \
    else \
        npm install; \
    fi

# ---------------------------------------------------------------------------
# Stage 2: Build application
# ---------------------------------------------------------------------------
FROM deps AS builder

WORKDIR /app

# Copy all source files
COPY . .

# Build arguments for environment configuration at build time
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Build the production bundle
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3: Production Nginx server
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user for nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=5s \
    CMD wget -qO- http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
