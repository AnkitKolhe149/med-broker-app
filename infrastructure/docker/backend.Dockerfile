FROM node:18-alpine
WORKDIR /app

# Install deps first for layer cache
COPY backend/package*.json ./
RUN npm install --production

# Copy backend sources
COPY backend/ .

# Generate Prisma client during build (if `prisma` schema present)
RUN if [ -f prisma/schema.prisma ]; then npx prisma generate; fi

EXPOSE 4005
ENV NODE_ENV=production
CMD ["npm", "start"]
