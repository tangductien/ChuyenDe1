# Use official Node.js image based on Alpine Linux
FROM node:16-alpine

# Set the working directory
WORKDIR /usr/src/app

# Install mysql-client using Alpine's package manager (apk)
RUN apk add --no-cache mysql-client

# Copy backend code into container
COPY . /usr/src/app

# Install Node.js dependencies
RUN npm install

# Expose port 3000
EXPOSE 3000

# Start the backend service
CMD ["npm", "start"]
