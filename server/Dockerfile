FROM node:18-alpine

WORKDIR /QuickNotes/server
COPY package*.json ./
EXPOSE 5050

RUN npm install
COPY . .

CMD ["npm", "start"]