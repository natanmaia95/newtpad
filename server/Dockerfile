FROM node
WORKDIR /usr/src/server
COPY package.json /usr/src/server
RUN npm install
COPY . /usr/src/server

# CMD ["ls", "-a"]

CMD ["node","app.js"]