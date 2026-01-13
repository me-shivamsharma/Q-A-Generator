# Q&A Generation Tool

A comprehensive web application that processes uploaded transcript PDFs and generates educational content using AI models (OpenAI GPT-4 or Google Gemini). The tool creates glossaries, review questions, assessment questions, learning objectives, and course overviews with CSV/XLSX export functionality.

## ✨ Features

### 🚀 Core Functionality
- **PDF Upload**: Upload transcript PDFs with validation and text extraction (max 10MB)
- **AI Integration**: Uses OpenAI GPT-4 or Google Gemini for intelligent content generation
- **Multiple Content Types**: Generate glossaries, questions, learning objectives, and course overviews
- **Export Options**: Download generated content as CSV or XLSX files
- **Interactive UI**: Modern, responsive interface with real-time progress indicators

### 📚 Content Generation Features

#### 1. Course Overview Generation
- **NEW**: Generates comprehensive course overviews with proper format
- **Format**: "[Course Title] by [Author Name] invites you to examine..."
- Extracts course title and author from transcript content
- Creates 2-3 paragraph overview with key takeaways
- Professional tone suitable for course descriptions

#### 2. Glossary Generation
- Extracts 10-12 technical terms directly from transcript content
- Provides 2-3 line definitions for each term
- Presents terms in alphabetical order
- Focuses on standalone, difficult-to-understand words and jargons
- Includes full forms for abbreviations and acronyms
- Excludes CPA-related terminology
- **NEW**: Delete individual terms with confirmation dialog

#### 3. Review Questions
- Generates user-specified number of easy-level multiple choice questions
- **UPDATED**: ALL questions have exactly 4 options (a-d) - no exceptions
- **UPDATED**: No "True or false:" prefix in question text
- 70% Yes/No or True/False style questions (formatted as 4-option MCQ)
- No question repetition or rephrasing
- **NEW**: Delete individual questions with confirmation dialog
- **NEW**: Question numbering (1., 2., 3., etc.) in display
- Bold correct answers in explanations

#### 4. Assessment Questions
- Generates user-specified number of moderate-level questions
- **UPDATED**: ALL questions have exactly 4 options (a-d) - no exceptions
- No True/False or Yes/No questions allowed
- Must be unique from Review Questions
- Higher difficulty level than Review Questions
- **NEW**: Delete individual questions with confirmation dialog
- **NEW**: Question numbering in display

#### 5. Learning Objectives
- Generates single learning objective (max 160 characters)
- Covers 75% of Assessment Question content
- Follows Bloom's Taxonomy Levels 2 & 3 and SMART format
- Uses "course" instead of "masterclass"
- Uses only allowed action verbs: Determine, Compare, Discuss, Identify, Recognize, Select, Distinguish, Differentiate

#### 6. Enhanced Export Features
- **UPDATED**: Excel files now have proper bold formatting (no markdown asterisks)
- **UPDATED**: Copy-to-clipboard strips markdown for clean pasting into Google Docs
- Converts all MCQs to structured format with 10 columns
- Separate worksheets for Review and Assessment questions
- Downloadable .xlsx and .csv files

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- OpenAI API key OR Google Gemini API key
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone and Install**
```bash
git clone <repository-url>
cd qa-generator
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env.local
```

Configure your API keys in `.env.local`:
```env
# Choose ONE of the following:

# Option 1: OpenAI (Recommended)
OPENAI_API_KEY=your_openai_api_key_here
AI_PROVIDER=openai

# Option 2: Google Gemini
GOOGLE_API_KEY=your_google_api_key_here
AI_PROVIDER=google
```

3. **Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Production Build**
```bash
npm run build
npm start
```

## 📖 Usage Guide

### Step-by-Step Process
1. **📄 Upload PDF**: Select a transcript PDF file (max 10MB)
2. **⚙️ Configure Options**:
   - Choose content types to generate
   - Set number of questions (1-50 each)
   - Add previous terms to avoid duplicates
3. **🤖 Generate Content**: Click "Generate Content" and wait for AI processing
4. **📊 Review Results**: Browse generated content in organized tabs
5. **💾 Export Data**: Download as Excel (.xlsx) or CSV files
6. **📋 Copy Content**: Use copy buttons for clean clipboard content

### Content Types Available
- ✅ **Course Overview**: Professional course descriptions
- ✅ **Glossary**: Technical terms with definitions
- ✅ **Review Questions**: Easy-level MCQs (4 options each)
- ✅ **Assessment Questions**: Moderate-level MCQs (4 options each)
- ✅ **Learning Objectives**: SMART format objectives

## Technical Architecture

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Hooks** for state management

### Backend
- **Next.js API Routes** for server-side logic
- **OpenAI API** for content generation
- **pdf-parse** for PDF text extraction
- **xlsx** for spreadsheet generation

### File Structure
```
src/
├── app/
│   ├── api/
│   │   ├── upload/          # PDF upload endpoint
│   │   ├── generate/        # Content generation endpoints
│   │   └── export/          # CSV/XLSX export endpoint
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── QAGenerator.tsx      # Main component
│   ├── FileUpload.tsx       # PDF upload interface
│   ├── GenerationForm.tsx   # Configuration form
│   └── ResultsDisplay.tsx   # Results viewer
└── lib/
    ├── ai-service.ts        # OpenAI integration
    ├── pdf-processor.ts     # PDF processing utilities
    └── csv-exporter.ts      # Export functionality
```

## API Endpoints

- `POST /api/upload` - Upload and process PDF files
- `POST /api/generate/glossary` - Generate glossary terms
- `POST /api/generate/review-questions` - Generate review questions
- `POST /api/generate/assessment-questions` - Generate assessment questions
- `POST /api/generate/learning-objective` - Generate learning objective
- `POST /api/export` - Export questions as CSV/XLSX

## Environment Variables

The application supports multiple AI providers. You need at least one API key configured:

```bash
# OpenAI API Configuration (GPT-4)
OPENAI_API_KEY=your_openai_api_key_here

# Google Gemini API Configuration (Gemini 1.5 Pro)
# Get your API key from: https://makersuite.google.com/app/apikey
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
# Alternative environment variable name for Gemini
# GEMINI_API_KEY=your_google_ai_api_key_here
```

**Provider Selection Priority:**
1. OpenAI (if `OPENAI_API_KEY` is set)
2. Google Gemini (if `GOOGLE_AI_API_KEY` or `GEMINI_API_KEY` is set)

The application will automatically use the first available API key in the above order.

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
The application can be deployed on any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS with responsive design
- **AI Integration**: OpenAI GPT-4 API, Google Gemini API
- **File Processing**: PDF parsing and text extraction
- **Export**: CSV/XLSX generation with proper formatting
- **Icons**: Lucide React
- **Build**: TypeScript compilation with strict type checking

## 🔧 API Reference

### Core Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload and process PDF files |
| `/api/generate/course-overview` | POST | Generate course overview |
| `/api/generate/glossary` | POST | Generate glossary terms |
| `/api/generate/review-questions` | POST | Generate review questions |
| `/api/generate/assessment-questions` | POST | Generate assessment questions |
| `/api/generate/learning-objective` | POST | Generate learning objectives |
| `/api/export` | POST | Export content to files |
| `/api/ai-status` | GET | Check AI service status |

### Request/Response Examples
```typescript
// Upload PDF
POST /api/upload
Content-Type: multipart/form-data
Body: FormData with 'file' field

// Generate Content
POST /api/generate/glossary
{
  "transcriptText": "...",
  "previousTerms": ["term1", "term2"]
}
```

## 🏗️ Development

### Project Structure
```
qa-generator/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── generate/      # Content generation endpoints
│   │   │   ├── export/        # Export functionality
│   │   │   └── upload/        # File upload handling
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── GenerationForm.tsx # Main form interface
│   │   ├── QAGenerator.tsx    # Main app component
│   │   └── ResultsDisplay.tsx # Results viewer
│   ├── lib/                   # Utility libraries
│   │   ├── ai-service.ts      # AI integration layer
│   │   ├── csv-exporter.ts    # Export functionality
│   │   ├── html-generator.ts  # HTML export
│   │   ├── pdf-generator.ts   # PDF export
│   │   └── pdf-processor.ts   # PDF text extraction
│   └── types/                 # TypeScript definitions
│       └── index.ts
├── public/                    # Static assets
├── .env.example              # Environment template
├── .gitignore               # Git ignore rules
├── next.config.js           # Next.js configuration
├── package.json             # Dependencies
├── tailwind.config.js       # Tailwind CSS config
└── tsconfig.json           # TypeScript config
```

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Code Quality
- TypeScript strict mode enabled
- ESLint with Next.js rules
- Tailwind CSS for consistent styling
- Error boundaries for robust error handling

## 🚀 Deployment

The application is configured for deployment on Google Cloud Platform (GCP) using Cloud Run and supports Docker containerization.

### Quick Deployment to GCP

1. **Prerequisites**: Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) and Docker

2. **Set up GCP project**:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Configure secrets** (OpenAI API key, JWT secrets, database URL):
   ```bash
   npm run setup-gcp
   ```

4. **Deploy to Cloud Run**:
   ```bash
   npm run deploy:gcp
   ```

### Docker Deployment

Build and run with Docker:

```bash
# Build Docker image
npm run docker:build

# Run container (available at http://localhost:8080)
npm run docker:run
```

### Production Environment Variables

For production deployment, configure these environment variables:

```env
# GCP Configuration
GCP_PROJECT_ID=your-gcp-project-id
SECRET_NAME=openai-api-key

# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/qa_generator

# Authentication Configuration
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-session-secret-here

# Application Configuration
PORT=8080
NODE_ENV=production

# Security Configuration
CORS_ORIGINS=https://your-domain.com
RATE_LIMIT_REQUESTS=100
```

### Comprehensive Deployment Guides

For detailed deployment instructions:
- [GCP Deployment Guide](./docs/GCP_DEPLOYMENT.md) - Complete GCP setup and deployment
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - General deployment information

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use meaningful commit messages
- Test all features thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support & Troubleshooting

### Common Issues
- **Build Errors**: Run `npm run build` to check for TypeScript errors
- **API Errors**: Verify your API keys are correctly set in `.env.local`
- **Upload Issues**: Ensure PDF files are under 10MB and contain text

### Getting Help
1. Check existing [GitHub Issues](https://github.com/your-repo/issues)
2. Create new issue with:
   - Detailed problem description
   - Steps to reproduce
   - Error logs/screenshots
   - Environment details

### Performance Tips
- Use OpenAI for better quality results
- Keep PDF files under 5MB for faster processing
- Generate content in smaller batches for better performance
