// src/config/swagger.ts
import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "GATA API",
      version: "1.0.0",
      description: "API documentation",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", example: "64e..." },
            name: { type: "string", example: "Dwiki Dev" },
            email: { type: "string", example: "dwiki@example.com" },
            role: { type: "string", example: "mahasiswa" },
          },
          required: ["id", "email"],
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Not authorized" },
            statusCode: { type: "integer", example: 401 },
            path: { type: "string", example: "/api/auth/profile" },
          },
        },
      },
    },
  },
  // Sesuaikan path ini: saat development pakai TS, saat production pakai dist/*.js
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
});

export default swaggerSpec;
