ARG NODE_VERSION=20.18.1-alpine

FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund


FROM node:${NODE_VERSION} AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG API_BASE_URL
ARG CV_BUILDER_URL
ENV API_BASE_URL=${API_BASE_URL}
ENV CV_BUILDER_URL=${CV_BUILDER_URL}

RUN npm run build


FROM nginx:1.27-alpine AS runtime
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ficct-jobs-frontend/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
