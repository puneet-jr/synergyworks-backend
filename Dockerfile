# --- Stage 1: Build the application ---
# We start with a Node.js image.
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first (to cache dependencies)
COPY package*.json ./

# Install dependencies (npm ci is cleaner than npm install for builds)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Compile TypeScript to JavaScript
# Ensure you have a "build" script in package.json: "tsc"
RUN npm run build

# --- Stage 2: Production Image ---
# Start fresh with a smaller image (no TypeScript compiler needed here)
FROM node:20-alpine

WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the compiled code from the "builder" stage
COPY --from=builder /app/dist ./dist

# Open the port (Documentation only)
EXPOSE 3000

# Command to run the app
# Assumes your entry point is dist/index.js
CMD ["node", "dist/index.js"]