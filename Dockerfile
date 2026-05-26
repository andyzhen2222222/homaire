FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

RUN npm run build && npm run db:push && npm run migrate:sqlite:snapshot

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# 订单等运行时数据建议挂载卷: -v homaire-data:/app/data
CMD ["npm", "run", "start"]
