FROM node:18-alpine

WORKDIR /app

# Install system dependencies for sharp
RUN apk add --no-cache \
    libc6-compat \
    vips-dev

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3003/health || exit 1

# Start the service
CMD ["npm", "start"]