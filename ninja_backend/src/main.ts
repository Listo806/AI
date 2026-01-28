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
  
  // Get the server's own origin (for Swagger UI)
  // Render provides RENDER_EXTERNAL_URL, or we can use BACKEND_URL
  const serverUrl = process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL;
  let serverOrigin: string | null = null;
  
  if (serverUrl) {
    try {
      serverOrigin = new URL(serverUrl).origin;
    } catch (e) {
      // If URL parsing fails, try to extract origin from the string
      const match = serverUrl.match(/^(https?:\/\/[^\/]+)/);
      if (match) {
        serverOrigin = match[1];
      }
    }
  }
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow same-origin requests (for Swagger UI on the same server)
      if (serverOrigin && origin === serverOrigin) {
        return callback(null, true);
      }
      
      // Allow requests from explicitly allowed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // In production, allow Render domains for Swagger UI and API access
      if (process.env.NODE_ENV === 'production') {
        // Allow any *.onrender.com subdomain (for Swagger UI)
        if (origin.includes('.onrender.com')) {
          return callback(null, true);
        }
      }
      
      // Log rejected origins for debugging (only in development)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[CORS] Rejected origin: ${origin}`);
      }
      
      callback(new Error('Not allowed by CORS'));
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
    .addTag('intelligence', 'Buyer intelligence and market signals endpoints')
    .addTag('agents', 'Agent priority feed endpoints')
    .addTag('listings', 'Listing comps and match explanation endpoints')
    .addTag('whatsapp', 'WhatsApp messaging (Twilio)')
    .addTag('email', 'Email messaging')
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

