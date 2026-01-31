FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

EXPOSE 5173

# Start Vite with --host to expose to network
CMD ["npm", "run", "dev", "--", "--host"]