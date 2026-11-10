FROM node:22-alpine AS source
WORKDIR /app
ARG VITE_API_URL=http://localhost:4000
ARG VITE_PUBLIC_STATUS_API_URL=
ARG VITE_PUBLIC_STATUS_URL=http://localhost:5174/status
ENV VITE_API_URL=$VITE_API_URL VITE_PUBLIC_STATUS_API_URL=$VITE_PUBLIC_STATUS_API_URL VITE_PUBLIC_STATUS_URL=$VITE_PUBLIC_STATUS_URL
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
FROM source AS build
RUN pnpm build
FROM source AS status-build
RUN pnpm build:status
FROM nginx:1.27-alpine AS public-status
COPY nginx.status.conf /etc/nginx/conf.d/default.conf
COPY --from=status-build /app/dist /usr/share/nginx/html
EXPOSE 80
FROM nginx:1.27-alpine AS dashboard-runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
