#!/bin/bash

# Q&A Generator GCP Deployment Script
# This script automates the deployment process to Google Cloud Platform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Get project configuration
get_project_config() {
    print_status "Getting project configuration..."
    
    # Get current project
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    
    if [ -z "$PROJECT_ID" ]; then
        print_error "No GCP project is set. Please run: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    fi
    
    print_success "Using project: $PROJECT_ID"
    
    # Set default values
    REGION=${REGION:-"us-central1"}
    SERVICE_NAME=${SERVICE_NAME:-"qa-generator"}
    DATABASE_INSTANCE=${DATABASE_INSTANCE:-"qa-generator-db"}
    
    print_status "Configuration:"
    echo "  Project ID: $PROJECT_ID"
    echo "  Region: $REGION"
    echo "  Service Name: $SERVICE_NAME"
    echo "  Database Instance: $DATABASE_INSTANCE"
}

# Enable required APIs
enable_apis() {
    print_status "Enabling required GCP APIs..."
    
    gcloud services enable \
        cloudbuild.googleapis.com \
        run.googleapis.com \
        secretmanager.googleapis.com \
        sql-component.googleapis.com \
        sqladmin.googleapis.com \
        --quiet
    
    print_success "APIs enabled successfully"
}

# Build and deploy using Cloud Build
build_and_deploy() {
    print_status "Building and deploying application..."
    
    # Submit build to Cloud Build
    gcloud builds submit \
        --config cloudbuild.yaml \
        --substitutions _REGION=$REGION,_SERVICE_NAME=$SERVICE_NAME,_DATABASE_INSTANCE=$DATABASE_INSTANCE \
        .
    
    print_success "Build and deployment completed"
}

# Get service URL
get_service_url() {
    print_status "Getting service URL..."
    
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
        --region=$REGION \
        --format="value(status.url)" 2>/dev/null)
    
    if [ -n "$SERVICE_URL" ]; then
        print_success "Service deployed successfully!"
        echo ""
        echo "🌐 Service URL: $SERVICE_URL"
        echo ""
        echo "📋 Next steps:"
        echo "1. Test the application by visiting the URL above"
        echo "2. Configure your custom domain (optional)"
        echo "3. Set up monitoring and alerting"
        echo "4. Configure backup and disaster recovery"
    else
        print_warning "Could not retrieve service URL. Check Cloud Console for deployment status."
    fi
}

# Main deployment function
main() {
    echo "🚀 Q&A Generator GCP Deployment"
    echo "================================"
    echo ""
    
    check_prerequisites
    get_project_config
    enable_apis
    build_and_deploy
    get_service_url
    
    print_success "Deployment process completed!"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
