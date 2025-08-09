FROM node:18-alpine

# Install Java 11 and Ant
RUN apk add --no-cache \
    openjdk11-jdk \
    apache-ant

# Set environment variables
ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk
ENV ANT_HOME=/usr/share/ant
ENV PATH=$PATH:$JAVA_HOME/bin:$ANT_HOME/bin

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY core/package*.json ./core/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build client
RUN npm run build --workspace=client

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "start"]