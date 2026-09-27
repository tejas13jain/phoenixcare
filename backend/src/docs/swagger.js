import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'PhoenixCare API',
      version: '0.1.0',
      description: 'REST API for the PhoenixCare multi-doctor telehealth platform.',
    },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth' },
      { name: 'Doctors' },
      { name: 'Booking' },
      { name: 'Payments' },
      { name: 'Prescriptions' },
      { name: 'Admin' },
    ],
  },
  apis: ['./src/routes/*.js'],
});
