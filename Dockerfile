FROM node:10

# Create app directory
WORKDIR /home/uke-webserver/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
RUN npm install pm2 -g
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 28101 28102 6650 8890

CMD ["pm2-runtime", "system/app.js"]
