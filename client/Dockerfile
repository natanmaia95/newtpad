# syntax=docker/dockerfile:1.4

# Create image based on the official Node image from dockerhub
FROM node AS development

# Create app directory
WORKDIR /usr/src/client

# Copy dependency definitions
COPY package.json /usr/src/client
COPY package-lock.json /usr/src/client

# Install dependecies
#RUN npm set progress=false \
#    && npm config set depth 0 \
#    && npm i install
RUN npm ci

# Get all the code needed to run the app
COPY . /usr/src/client

# Expose the port the app runs in
EXPOSE 5173

# Serve the app
CMD [ "npm", "run", "dev" ]

FROM development as dev-envs
RUN <<EOF
apt-get update
apt-get install -y --no-install-recommends git
EOF

RUN <<EOF
useradd -s /bin/bash -m vscode
groupadd docker
usermod -aG docker vscode
EOF
# install Docker tools (cli, buildx, compose)
#COPY --from=gloursdocker/docker / /
#CMD [ "HOST=0.0.0.0", "npm", "run", "dev"]
CMD npm run dev -- --host 0.0.0.0