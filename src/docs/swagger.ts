import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    version: "0.0.1",
    title: "Documentation API for My Application",
    description: "This is the API documentation for my application.",
  },
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "Local development server",
    },
    {
      url: "https://backend-fin-smart.vercel.app/api",
      description: "Deployed server on Vercel",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
      },
    },
    schemas: {
      LoginRequest: {
        email: "user@example.com",
        password: "Password123",
      },
      RegisterRequest: {
        $fullName: "John Doe",
        $email: "user@example.com",
        $password: "Password123",
        $confirmPassword: "Password123"
      },
      ActivationRequest: {
        email: "user@example.com",
        code: "123456",
      },
      CreateCategoryRequest: {
        name: "New Category",
        description: "Description of the new category",
        icon: "https://example.com/icon.png",
      },
      CreateCategoryUpdate: {
        name: "Updated Category Name",
      },
      CreateEventRequest: {
        name: "Title of the Event",
        startDate: "yyyy-mm-dd hh:mm:ss",
        endDate: "yyyy-mm-dd hh:mm:ss",
        description: "description",
        banner: "fileURL",
        isFeatured: true,
        isOnline: false,
        category: "Category ID here",
        location: {
          region: "region ID here",
          coordinates: [0, 0],
        },
      },
      UpdateEventRequest: {
        name: "Updated Title of the Event",
      },
      RemoveMediaRequest: {
        mediaUrl: "fileURL",
      },
      CreateTransactionRequest: {
        type: "expense",
        amount: 250000,
        description: "Beli perlengkapan kerja",
        merchantName: "Amazon",
        paymentMethod: "Credit Card",
        location: "Jakarta",
        accountType: "Credit",
        transactionTypeRaw: "Debit",
        deviceUsed: "Desktop",
        merchantType: "Ecommerce",
        loyaltyProgram: false,
        timeOfDay: "Evening",
        currency: "IDR",
        transactionDate: "2026-05-18T10:00:00.000Z",
        category: "Opsional. Default: Income/Uncategorized",
        useAiCategory: false
      },
      UpdateTransactionRequest: {
        amount: 80000,
        description: "Beli barang (Edit)",
        category: "Food"
      }
    },
  },
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["../routes/api.ts"];

swaggerAutogen({
  openapi: "3.0.0",
})(outputFile, endpointsFiles, doc);