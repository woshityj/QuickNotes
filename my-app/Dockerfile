FROM node:18-alpine as base
RUN apk add --no-cache g++ make py3-pip libc6-compat
WORKDIR /QuickNotes/my-app
COPY package*.json ./
EXPOSE 3000

FROM base as builder
WORKDIR /QuickNotes/my-app
COPY . .
RUN npm run builder

FROM base as production
WORKDIR /QuickNotes/my-app

ENV NODE_ENV=production
RUN npm ci

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /QuickNotes/my-app/.next ./.next
COPY --from=builder /QuickNotes/my-app/node_modules ./node_modules
COPY --from=builder /QuickNotes/my-app/package.json ./package.json
COPY --from=builder /QuickNotes/my-app/public ./public

CMD npm start

FROM base as dev
ENV NODE_ENV=development
RUN npm install 
COPY . .
CMD npm run dev