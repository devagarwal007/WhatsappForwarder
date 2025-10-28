# Stage 1: Build the application
FROM node:23-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

ENV BASE_URL=http://localhost:3000

# Expose the port your API server listens on (default 3005)
EXPOSE 8095
EXPOSE 3005

# Start the server from the production build
CMD ["npm", "run", "dev"]
