# Base image with build dependencies, no alpine because to include Python, make needed by 'node-pty' as build dependency
FROM node:latest AS build

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source files and build
COPY . .
RUN npm run build

# Production image
FROM node:latest AS production

WORKDIR /usr/src/app

# Copy only necessary files from the build stage
COPY --from=build /usr/src/app/dist ./dist
COPY package*.json ./

# Install dependencies
RUN npm install --only=production && npm cache clean --force

# Remove package json files
RUN rm -rf package*.json

# Expose port and set the start command
EXPOSE 3003
EXPOSE 3000
EXPOSE 5173
CMD ["node", "dist/main.js"]