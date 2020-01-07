FROM node:12-alpine AS base

# Create app directory
#WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

RUN npm run build

FROM nginx:alpine
# Copy needed files
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=base build /usr/share/nginx/html