FROM node:17-alpine

EXPOSE 3000

WORKDIR /home/node/app
COPY . .

RUN ["npm", "install"]
ENTRYPOINT ["npm", "start"]
