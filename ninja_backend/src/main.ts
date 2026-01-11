import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Load environment variables
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true, // Enable raw body for webhook signature verification
    bodyParser: true, // Enable body parser for JSON and URL-encoded
  });
  
  // Serve static files from public folder (for Webflow JS files)
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/static/',
  });
  
  // Global prefix for all routes
  app.setGlobalPrefix(process.env.API_PREFIX || 'api');
  
  // Enable CORS
  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'];
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Type', 'Authorization'],
  });
  
  // Global validation pipe (skip for webhooks)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      skipMissingProperties: false,
    }),
  );
  
  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Ninja Backend API')
    .setDescription('SaaS-native backend API for real estate platform')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('teams', 'Team management endpoints')
    .addTag('properties', 'Property management endpoints')
    .addTag('leads', 'Lead management endpoints')
    .addTag('crm', 'CRM dashboard endpoints')
    .addTag('analytics', 'Analytics and reporting endpoints')
    .addTag('subscriptions', 'Subscription management endpoints')
    .addTag('payments', 'Payment processing endpoints')
    .addTag('integrations', 'Third-party integration endpoints')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Keep auth token in session
    },
  });
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/${process.env.API_PREFIX || 'api'}`);
  console.log(`Swagger API Documentation: http://localhost:${port}/api-docs`);
}

bootstrap();

