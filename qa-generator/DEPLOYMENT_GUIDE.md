# 🚀 Deployment Guide

This guide will help you deploy your Q&A Generation Tool to GitHub and various hosting platforms.

## 📋 Prerequisites

- Git repository with all changes committed
- GitHub account
- API keys (OpenAI or Google Gemini)

## 🐙 GitHub Repository Setup

### Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in repository details:
   - **Repository name**: `qa-generator` (or your preferred name)
   - **Description**: "AI-powered Q&A generation tool for educational content"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"

### Step 2: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Run these in your terminal:

```bash
cd qa-generator

# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/qa-generator.git

# Push your code to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Verify Upload

1. Refresh your GitHub repository page
2. Verify all files are uploaded correctly
3. Check that the README.md displays properly

## 🌐 Hosting Platform Deployment

### Option 1: Vercel (Recommended)

Vercel is the easiest option for Next.js applications:

1. **Sign up/Login**: Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. **Import Project**: Click "New Project" and select your GitHub repository
3. **Configure Settings**:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
4. **Environment Variables**: Add your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   AI_PROVIDER=openai
   ```
   OR
   ```
   GOOGLE_API_KEY=your_google_api_key_here
   AI_PROVIDER=google
   ```
5. **Deploy**: Click "Deploy" and wait for the build to complete
6. **Access**: Your app will be available at `https://your-project-name.vercel.app`

### Option 2: Netlify

1. **Sign up/Login**: Go to [netlify.com](https://netlify.com) and sign in with GitHub
2. **New Site**: Click "New site from Git" and select your repository
3. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. **Environment Variables**: Add your API keys in Site Settings > Environment Variables
5. **Deploy**: Click "Deploy site"

### Option 3: Railway

1. **Sign up/Login**: Go to [railway.app](https://railway.app) and sign in with GitHub
2. **New Project**: Click "New Project" and select "Deploy from GitHub repo"
3. **Select Repository**: Choose your qa-generator repository
4. **Environment Variables**: Add your API keys in the Variables tab
5. **Deploy**: Railway will automatically build and deploy your app

## 🔐 Environment Variables Setup

For any hosting platform, you'll need to set these environment variables:

### For OpenAI (Recommended)
```
OPENAI_API_KEY=sk-...your-key-here
AI_PROVIDER=openai
```

### For Google Gemini
```
GOOGLE_API_KEY=...your-key-here
AI_PROVIDER=google
```

## ✅ Post-Deployment Checklist

1. **Test Upload**: Try uploading a PDF file
2. **Test Generation**: Generate each content type
3. **Test Export**: Download CSV/XLSX files
4. **Test Copy**: Use copy-to-clipboard functionality
5. **Check Logs**: Monitor for any errors in platform logs

## 🐛 Troubleshooting

### Common Issues

**Build Fails**
- Check that all dependencies are in package.json
- Verify Node.js version compatibility (18+)
- Check for TypeScript errors with `npm run build`

**API Errors**
- Verify environment variables are set correctly
- Check API key validity
- Ensure AI_PROVIDER matches your API key type

**Upload Issues**
- Check file size limits on your hosting platform
- Verify PDF processing works locally first

**Performance Issues**
- Consider upgrading to paid hosting plans for better performance
- Monitor API usage and rate limits

## 📞 Support

If you encounter issues:
1. Check the hosting platform's documentation
2. Review application logs
3. Test locally first to isolate issues
4. Check GitHub Issues for similar problems

## 🎉 Success!

Once deployed, your Q&A Generation Tool will be accessible worldwide. Share the URL with your team and start generating educational content!
