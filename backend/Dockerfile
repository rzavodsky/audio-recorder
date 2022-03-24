FROM node:17

EXPOSE 3000

WORKDIR /home/node/app
COPY . .

RUN ["npm", "install"]
ENTRYPOINT ["npm", "start"]
