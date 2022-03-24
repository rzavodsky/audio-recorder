# Build stage
FROM node:17-alpine as build-stage

WORKDIR /home/node/app
COPY ./frontend .
RUN ["npm", "install"]

RUN ["npm", "run", "build"]

# Serving stage
FROM nginx:1.21-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-stage /home/node/app/dist /frontend
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
