# Basic React App Dockerfile (for Development)

# 1. Specify the Node.js Base Image
# Choose a Node version suitable for your project. LTS versions are usually good choices.
FROM node:18

# 2. Set the Working Directory
# Code will live inside /app in the container.
WORKDIR /app

# 3. Copy Dependency Manifests
# Copy package.json and lock file first to leverage Docker cache.
COPY package.json package-lock.json* ./
# Or if using yarn:
# COPY package.json yarn.lock ./

# 4. Install Dependencies
# Use 'npm ci' for cleaner installs if you have a lock file.
RUN npm ci
# Or if using yarn:
# RUN yarn install --frozen-lockfile

# 5. Copy Application Code
# Copy the rest of your frontend code (src, public, etc.)
# Note: For development, you'll usually mount your local code using a volume (see notes below).
# This copy ensures the image *can* run standalone if needed, but mounting is typical for dev.
COPY . .

# 6. Expose the Development Port
# Expose the port your dev server runs on. Common defaults are 3000 (CRA) or 5173 (Vite).
# Change this if your 'npm run dev' uses a different port.
EXPOSE 5173

# 7. Define the Command to Run the Development Server
CMD ["npm", "run"]
