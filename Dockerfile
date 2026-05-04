FROM node:22-alpine AS builder
WORKDIR /workspace

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /workspace/node_modules ./node_modules
COPY --from=builder /workspace/dist/front-service/browser ./browser
COPY --from=builder /workspace/dist/front-service/server ./server
COPY docker/entrypoint.sh ./entrypoint.sh

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "const http=require('node:http');const req=http.get({host:'127.0.0.1',port:process.env.PORT||4000,path:'/healthz',timeout:2000},res=>process.exit(res.statusCode===200?0:1));req.on('error',()=>process.exit(1));"

CMD ["/app/entrypoint.sh"]
