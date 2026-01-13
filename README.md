# Q&A Generator

An intelligent Q&A generation system that processes PDF documents and creates comprehensive educational content including questions, answers, glossary terms, and more.

## 🚀 Features

- **PDF Processing**: Upload and extract text from PDF documents
- **AI-Powered Q&A Generation**: Generate questions and answers using OpenAI GPT
- **Glossary Creation**: Automatically extract and define key terms
- **User Authentication**: Secure login and registration system
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS
- **Database Integration**: PostgreSQL with proper data modeling
- **Docker Support**: Easy deployment with Docker Compose

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS, TypeScript
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL
- **Authentication**: JWT with secure HTTP-only cookies
- **AI Integration**: OpenAI GPT API
- **PDF Processing**: PDF parsing libraries
- **Deployment**: Docker & Docker Compose

## 📋 Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- OpenAI API key

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd Q&A-gen
```

### 2. Environment Setup
Create a `.env.local` file in the `qa-generator` directory:
```env
# Database
DATABASE_URL=postgresql://qa_user:qa_password@localhost:5432/qa_generator
DATABASE_SSL=false

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# OpenAI
OPENAI_API_KEY=your-openai-api-key-here

# App
NEXT_PUBLIC_APP_URL=http://localhost:9000
```

### 3. Start with Docker
```bash
docker-compose up -d
```

### 4. Access the Application
- **Web Interface**: http://localhost:9000
- **Database**: localhost:5432

## 🧪 Test Credentials

For testing purposes, use these credentials:
- **Email**: `test@example.com`
- **Password**: `password123`

## 📁 Project Structure

```
Q&A gen/
├── qa-generator/          # Next.js application
│   ├── src/
│   │   ├── app/          # App router pages
│   │   ├── components/   # React components
│   │   ├── lib/         # Utilities and services
│   │   └── types/       # TypeScript definitions
│   ├── public/          # Static assets
│   └── package.json
├── docker-compose.yml   # Docker services
└── README.md
```

## 🔧 Development

### Local Development (without Docker)
```bash
cd qa-generator
npm install
npm run dev
```

### Database Setup
The application uses PostgreSQL. When using Docker Compose, the database is automatically set up with the required schema.

## 🚀 Deployment

### Production Deployment
1. Update environment variables for production
2. Set `DATABASE_SSL=true` for production databases
3. Use strong JWT secrets
4. Configure proper CORS settings

## 📝 API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/upload` - PDF upload and processing
- `GET /api/documents` - List user documents
- `POST /api/generate` - Generate Q&A content

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues, please check the logs:
```bash
docker-compose logs qa-generator
docker-compose logs postgres
```
