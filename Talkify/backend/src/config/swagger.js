import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Talkify API',
      version: '1.0.0',
      description: 'A language learning chat application API built with Node.js, Express, and MongoDB',
      contact: {
        name: 'Talkify Team',
        email: 'support@talkify.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.talkify.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            fullName: {
              type: 'string',
              description: 'Full name of the user'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            profilePic: {
              type: 'string',
              format: 'uri',
              description: 'URL of user profile picture'
            },
            bio: {
              type: 'string',
              description: 'User bio'
            },
            nativeLanguage: {
              type: 'string',
              description: 'User native language'
            },
            learningLanguage: {
              type: 'string',
              description: 'Language user is learning'
            },
            location: {
              type: 'string',
              description: 'User location'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            statusCode: {
              type: 'integer',
              description: 'HTTP status code'
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            message: {
              type: 'string',
              description: 'Response message'
            },
            success: {
              type: 'boolean',
              description: 'Request success status'
            }
          }
        },
        ApiError: {
          type: 'object',
          properties: {
            statusCode: {
              type: 'integer',
              description: 'HTTP status code'
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            success: {
              type: 'boolean',
              description: 'Request success status',
              example: false
            }
          }
        },
        SignupRequest: {
          type: 'object',
          required: ['fullName', 'email', 'password'],
          properties: {
            fullName: {
              type: 'string',
              description: 'Full name of the user',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john@example.com'
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'User password',
              example: 'password123'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john@example.com'
            },
            password: {
              type: 'string',
              description: 'User password',
              example: 'password123'
            }
          }
        },
        OnboardingRequest: {
          type: 'object',
          properties: {
            fullName: {
              type: 'string',
              description: 'Full name of the user',
              example: 'John Doe'
            },
            bio: {
              type: 'string',
              description: 'User bio',
              example: 'I love learning new languages!'
            },
            nativeLanguage: {
              type: 'string',
              description: 'User native language',
              example: 'English'
            },
            learningLanguage: {
              type: 'string',
              description: 'Language user is learning',
              example: 'Spanish'
            },
            location: {
              type: 'string',
              description: 'User location',
              example: 'New York, USA'
            }
          }
        },
        StreamTokenResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Request success status',
              example: true
            },
            token: {
              type: 'string',
              description: 'Stream chat token for real-time messaging',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      },
      {
        cookieAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };
