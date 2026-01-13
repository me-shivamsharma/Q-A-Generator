# Google Cloud Platform Deployment Guide

This guide provides step-by-step instructions for deploying the Q&A Generator application to Google Cloud Platform.

## Prerequisites

- Google Cloud Platform account
- `gcloud` CLI installed and configured
- Docker installed (for Cloud Run deployment)
- Node.js 18+ installed locally

## 1. GCP Project Setup

### Create a New GCP Project

```bash
# Create a new project
gcloud projects create qa-generator-app --name="Q&A Generator"

# Set the project as default
gcloud config set project qa-generator-app

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  sql-component.googleapis.com \
  sqladmin.googleapis.com
```

## 2. Database Setup (Cloud SQL PostgreSQL)

### Create Cloud SQL Instance

```bash
# Create PostgreSQL instance
gcloud sql instances create qa-generator-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=10GB \
  --backup-start-time=03:00

# Set root password
gcloud sql users set-password postgres \
  --instance=qa-generator-db \
  --password=YOUR_SECURE_PASSWORD

# Create application database
gcloud sql databases create qa_generator \
  --instance=qa-generator-db

# Create application user
gcloud sql users create qa_app_user \
  --instance=qa-generator-db \
  --password=YOUR_APP_PASSWORD
```

### Configure Database Connection

```bash
# Get connection name
gcloud sql instances describe qa-generator-db \
  --format="value(connectionName)"

# Note: Connection string format:
# postgresql://qa_app_user:YOUR_APP_PASSWORD@/qa_generator?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
```

## 3. Secret Manager Setup

### Store API Keys Securely

```bash
# Create secret for OpenAI API key
echo "your_openai_api_key_here" | gcloud secrets create openai-api-key --data-file=-

# Create secret for JWT secret
echo "your_super_secret_jwt_key_here" | gcloud secrets create jwt-secret --data-file=-

# Create secret for database URL
echo "postgresql://qa_app_user:YOUR_APP_PASSWORD@/qa_generator?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME" | \
  gcloud secrets create database-url --data-file=-

# Grant access to Cloud Run service account
gcloud secrets add-iam-policy-binding openai-api-key \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding database-url \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## 4. Application Configuration

### Update Environment Configuration

Create `.env.production`:

```env
# GCP Configuration
GCP_PROJECT_ID=qa-generator-app
SECRET_NAME=openai-api-key

# Database Configuration
DATABASE_URL=postgresql://qa_app_user:YOUR_APP_PASSWORD@/qa_generator?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME

# Authentication Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Application Configuration
PORT=8080
NODE_ENV=production

# Security Configuration
CORS_ORIGINS=https://your-domain.com
RATE_LIMIT_REQUESTS=100
```

## 5. Cloud Run Deployment

### Create Dockerfile

The application already includes a production-ready Dockerfile.

### Build and Deploy

```bash
# Build and submit to Cloud Build
gcloud builds submit --tag gcr.io/qa-generator-app/qa-generator

# Deploy to Cloud Run
gcloud run deploy qa-generator \
  --image gcr.io/qa-generator-app/qa-generator \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production \
  --set-env-vars PORT=8080 \
  --set-env-vars GCP_PROJECT_ID=qa-generator-app \
  --set-secrets DATABASE_URL=database-url:latest \
  --set-secrets JWT_SECRET=jwt-secret:latest \
  --add-cloudsql-instances qa-generator-app:us-central1:qa-generator-db
```

## 6. Database Migration

### Run Database Setup

```bash
# Connect to Cloud SQL instance
gcloud sql connect qa-generator-db --user=postgres

# Or use Cloud Shell to run migration
gcloud run jobs create db-migration \
  --image gcr.io/qa-generator-app/qa-generator \
  --region us-central1 \
  --set-env-vars NODE_ENV=production \
  --set-secrets DATABASE_URL=database-url:latest \
  --add-cloudsql-instances qa-generator-app:us-central1:qa-generator-db \
  --command npm \
  --args run,migrate-db

# Execute the migration job
gcloud run jobs execute db-migration --region us-central1
```

## 7. Custom Domain (Optional)

### Configure Custom Domain

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service qa-generator \
  --domain your-domain.com \
  --region us-central1

# Update DNS records as instructed by the output
```

## 8. Monitoring and Logging

### Enable Monitoring

```bash
# Cloud Run automatically provides monitoring
# Access logs and metrics in Cloud Console:
# https://console.cloud.google.com/run/detail/us-central1/qa-generator
```

## 9. Security Considerations

### Production Security Checklist

- [ ] Use strong passwords for database users
- [ ] Rotate JWT secrets regularly
- [ ] Configure proper CORS origins
- [ ] Enable Cloud Armor for DDoS protection
- [ ] Set up Cloud IAM roles with least privilege
- [ ] Enable audit logging
- [ ] Configure SSL/TLS certificates
- [ ] Set up backup and disaster recovery

## 10. Cost Optimization

### Recommended Settings

```bash
# Update service with cost-optimized settings
gcloud run services update qa-generator \
  --region us-central1 \
  --cpu-throttling \
  --concurrency 80 \
  --min-instances 0 \
  --max-instances 5
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify Cloud SQL instance is running
   - Check connection string format
   - Ensure Cloud SQL connector is properly configured

2. **Secret Manager Access**
   - Verify service account permissions
   - Check secret names match configuration
   - Ensure secrets exist in the correct project

3. **Build Failures**
   - Check Dockerfile syntax
   - Verify all dependencies are included
   - Review Cloud Build logs

### Useful Commands

```bash
# View service logs
gcloud run services logs read qa-generator --region us-central1

# Check service status
gcloud run services describe qa-generator --region us-central1

# Update environment variables
gcloud run services update qa-generator \
  --region us-central1 \
  --set-env-vars NEW_VAR=value
```

## Quick Start Commands

For experienced users, here's the complete deployment in a few commands:

```bash
# 1. Set up project
gcloud config set project YOUR_PROJECT_ID
gcloud services enable cloudbuild.googleapis.com run.googleapis.com secretmanager.googleapis.com

# 2. Set up secrets
npm run setup-gcp

# 3. Deploy
npm run deploy:gcp
```

## Integration Test Results

The application has been thoroughly tested and verified. See [INTEGRATION_TEST_RESULTS.md](./INTEGRATION_TEST_RESULTS.md) for detailed test results.

## Support

For additional support:
- Check Cloud Run documentation: https://cloud.google.com/run/docs
- Review application logs in Cloud Console
- See [INTEGRATION_TEST_RESULTS.md](./INTEGRATION_TEST_RESULTS.md) for troubleshooting
- Contact support through the application repository
