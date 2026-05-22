# Use Node.js as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Database
RUN npx prisma generate
# Provide a fallback value during image build for Next.js/Prisma checks.
ARG DATABASE_URL=postgresql://myuser:mypassword@postgres:5432/mydb
ENV DATABASE_URL=$DATABASE_URL
# Build the Next.js application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the Next.js application
CMD ["npm", "start"]
