FROM node:latest AS build

WORKDIR /app
COPY package.json .

RUN npm install

COPY . .

RUN npm run astro build

FROM nginx:1.21-alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
