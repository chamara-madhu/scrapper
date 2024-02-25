FROM ghcr.io/puppeteer/puppeteer:22.2.0

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
    GOOGLE_API_KEY=AIzaSyDmwNFfvv3ClUoYkxeYNi372U5-zB6uY70

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci
COPY . .
CMD [ "node", "server.js" ]

