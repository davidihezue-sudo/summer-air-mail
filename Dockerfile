# Not built or run in the authoring environment: review before relying on it.
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev
ENV NODE_ENV=production PORT=8787 DATA_DIR=/data
VOLUME /data
EXPOSE 8787
CMD ["node", "server/index.mjs"]
