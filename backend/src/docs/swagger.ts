export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Garaa B2B Document Verification Platform API',
    version: '1.0.0',
    description: `Official REST API documentation for Garaa (formerly ZyID). 
Enterprise organizations use Garaa to submit identity and educational documents for verification, track processing pipelines, manage webhooks, and retrieve structured verification reports.`
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Gateway'
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'Organization-scoped B2B API Key with prefix gk_live_...'
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT User Session Bearer Token'
      }
    },
    schemas: {
      VerificationRequestInput: {
        type: 'object',
        required: ['subjectName', 'documentCategory'],
        properties: {
          documentId: {
            type: 'string',
            format: 'uuid',
            description: 'Optional ID of a previously uploaded document'
          },
          subjectName: {
            type: 'string',
            example: 'Aarav Mehta',
            description: 'Declared legal name of the credential subject'
          },
          subjectDob: {
            type: 'string',
            example: '1997-02-14',
            description: 'Declared date of birth (YYYY-MM-DD)'
          },
          declaredIdentifier: {
            type: 'string',
            example: 'MH-01-2026-9037',
            description: 'Declared identifier sequence or card number'
          },
          documentCategory: {
            type: 'string',
            enum: ['aadhaar', 'pan', 'passport', 'dl', 'birth', 'leaving', 'edu', 'other'],
            example: 'aadhaar'
          },
          extractedText: {
            type: 'string',
            description: 'Optional extracted OCR text stream from client vision scan'
          }
        }
      },
      VerificationCheckResult: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          checkCode: { type: 'string', example: 'STRUCTURE_VALIDATION' },
          checkName: { type: 'string', example: 'Official Layout & Nomenclature Check' },
          status: { type: 'string', enum: ['VERIFIED', 'FAILED', 'INCONCLUSIVE', 'NOT_CHECKED'] },
          evidence: { type: 'string' },
          limitations: { type: 'string' },
          severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] }
        }
      },
      VerificationReport: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          requestNumber: { type: 'string', example: 'VR-2026-1042' },
          subjectName: { type: 'string', example: 'Aarav Mehta' },
          documentCategory: { type: 'string', example: 'dl' },
          status: { type: 'string', enum: ['SUBMITTED', 'PROCESSING', 'NEEDS_REVIEW', 'VERIFIED', 'UNABLE_TO_VERIFY', 'REJECTED'] },
          riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          confidenceScore: { type: 'integer', example: 95 },
          headline: { type: 'string', example: 'VERIFIED' },
          recommendation: { type: 'string' },
          credentialId: { type: 'string', example: 'ZYC-2026-4B8F-9A10-E2D4-0192' },
          checks: {
            type: 'array',
            items: { $ref: '#/components/schemas/VerificationCheckResult' }
          },
          submittedAt: { type: 'string', format: 'date-time' },
          completedAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  },
  security: [
    { ApiKeyAuth: [] },
    { BearerAuth: [] }
  ],
  paths: {
    '/verifications': {
      post: {
        summary: 'Submit a new document verification request',
        tags: ['Verifications'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VerificationRequestInput' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Verification executed and completed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/VerificationReport' }
                  }
                }
              }
            }
          }
        }
      },
      get: {
        summary: 'List organization verification requests with optional filters',
        tags: ['Verifications'],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
        ],
        responses: {
          '200': {
            description: 'Paginated list of verifications'
          }
        }
      }
    },
    '/verifications/{id}': {
      get: {
        summary: 'Get single verification details and check breakdown',
        tags: ['Verifications'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Full verification record',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/VerificationReport' }
              }
            }
          }
        }
      }
    },
    '/verifications/{id}/review': {
      post: {
        summary: 'Submit an authorized human review decision for a pending case',
        tags: ['Verifications'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['decision', 'notes'],
                properties: {
                  decision: { type: 'string', enum: ['VERIFIED', 'REJECTED', 'UNABLE_TO_VERIFY'] },
                  notes: { type: 'string', example: 'Applicant supplied revised high-resolution scan. Signature verified.' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Review decision recorded' }
        }
      }
    },
    '/documents/upload': {
      post: {
        summary: 'Securely upload a document into the organization private storage',
        tags: ['Documents'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Document uploaded and hashed' }
        }
      }
    },
    '/dashboard/stats': {
      get: {
        summary: 'Retrieve live organization verification metrics and usage statistics',
        tags: ['Dashboard'],
        responses: {
          '200': { description: 'Aggregated analytics data' }
        }
      }
    },
    '/reports/{id}/csv': {
      get: {
        summary: 'Export verification audit report as a standard CSV file',
        tags: ['Reports'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'CSV file download',
            content: { 'text/csv': {} }
          }
        }
      }
    },
    '/api-keys': {
      get: {
        summary: 'List active and revoked B2B API keys for organization',
        tags: ['API Keys'],
        responses: { '200': { description: 'List of keys' } }
      },
      post: {
        summary: 'Provision a new B2B API key with permission scopes',
        tags: ['API Keys'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Production Recruiter Gateway' },
                  scopes: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['read:verifications', 'write:verifications', 'read:reports']
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'API Key generated; returns secret key once' }
        }
      }
    },
    '/webhooks': {
      get: {
        summary: 'List registered webhook subscriptions',
        tags: ['Webhooks'],
        responses: { '200': { description: 'List of endpoints' } }
      },
      post: {
        summary: 'Register a new webhook subscription with HMAC secret',
        tags: ['Webhooks'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['url'],
                properties: {
                  url: { type: 'string', format: 'uri', example: 'https://api.acmeglobal.example/webhooks/garaa' },
                  description: { type: 'string' },
                  events: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['verification.completed', 'verification.status_changed']
                  }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Webhook registered' } }
      }
    }
  }
};
