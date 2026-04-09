FROM node:20 AS build

WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build

FROM alpine
COPY --from=build /app/dist /dist