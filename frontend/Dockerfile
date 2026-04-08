# frontend/Dockerfile
FROM node:20 AS build

WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build

# just output the build — nginx will serve it
FROM alpine
COPY --from=build /app/dist /dist