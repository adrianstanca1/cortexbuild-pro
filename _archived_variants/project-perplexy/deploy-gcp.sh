#!/bin/bash

# ========================================
# GCP Deployment Script for ConstructAI
# ========================================
# This script automates the deployment of ConstructAI to Google Cloud Platform

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GCP_PROJECT_ID="${GCP_PROJECT_ID:-}"
GCP_REGION="${GCP_REGION:-us-central1}"
PROJECT_NAME="constructai"

# Functions
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check gcloud CLI
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed"
        echo "Install from: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    print_success "gcloud CLI is installed"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    print_success "Docker is installed"
    
    # Get or set project ID
    if [ -z "$GCP_PROJECT_ID" ]; then
        GCP_PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
        if [ -z "$GCP_PROJECT_ID" ]; then
            print_error "GCP_PROJECT_ID not set"
            echo "Run: gcloud config set project PROJECT_ID"
            exit 1
        fi
    fi
    print_success "GCP Project: $GCP_PROJECT_ID"
}

# Create GCP project (optional)
create_project() {
    print_header "GCP Project Setup"
    
    read -p "Create new GCP project? (y/n) [n]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter project ID: " NEW_PROJECT_ID
        gcloud projects create $NEW_PROJECT_ID
        gcloud config set project $NEW_PROJECT_ID
        GCP_PROJECT_ID=$NEW_PROJECT_ID
        print_success "Project created: $GCP_PROJECT_ID"
    fi
}

# Enable required APIs
enable_apis() {
    print_header "Enabling Required APIs"
    
    APIS=(
        "run.googleapis.com"
        "cloudbuild.googleapis.com"
        "containerregistry.googleapis.com"
        "redis.googleapis.com"
        "compute.googleapis.com"
    )
    
    for api in "${APIS[@]}"; do
        print_info "Enabling $api..."
        gcloud services enable $api --project=$GCP_PROJECT_ID
    done
    
    print_success "All APIs enabled"
}

# Build and push Docker images
build_and_push_images() {
    print_header "Building and Pushing Docker Images"
    
    # Configure Docker for GCR
    gcloud auth configure-docker
    
    # Build and push backend
    print_info "Building backend image..."
    gcloud builds submit \
        --tag gcr.io/$GCP_PROJECT_ID/$PROJECT_NAME-backend \
        --project=$GCP_PROJECT_ID \
        packages/backend
    print_success "Backend image pushed to GCR"
    
    # Build and push frontend
    print_info "Building frontend image..."
    gcloud builds submit \
        --tag gcr.io/$GCP_PROJECT_ID/$PROJECT_NAME-frontend \
        --project=$GCP_PROJECT_ID \
        packages/frontend
    print_success "Frontend image pushed to GCR"
}

# Create Memorystore Redis
create_redis() {
    print_header "Creating Memorystore Redis"
    
    print_info "Creating Redis instance (this may take 5-10 minutes)..."
    gcloud redis instances create $PROJECT_NAME-redis \
        --size=1 \
        --region=$GCP_REGION \
        --redis-version=redis_7_0 \
        --project=$GCP_PROJECT_ID
    
    # Get Redis connection info
    REDIS_HOST=$(gcloud redis instances describe $PROJECT_NAME-redis \
        --region=$GCP_REGION \
        --project=$GCP_PROJECT_ID \
        --format="value(host)")
    REDIS_PORT=$(gcloud redis instances describe $PROJECT_NAME-redis \
        --region=$GCP_REGION \
        --project=$GCP_PROJECT_ID \
        --format="value(port)")
    
    print_success "Redis created: $REDIS_HOST:$REDIS_PORT"
}

# Setup MongoDB Atlas
setup_mongodb() {
    print_header "MongoDB Atlas Setup"
    
    print_info "MongoDB Atlas must be configured separately"
    print_info "Steps:"
    echo "1. Go to https://www.mongodb.com/cloud/atlas"
    echo "2. Create a free cluster in $GCP_REGION"
    echo "3. Create database user"
    echo "4. Whitelist Cloud Run IPs (0.0.0.0/0 for now)"
    echo "5. Get connection string"
    echo ""
    read -p "Enter MongoDB connection string: " MONGODB_URI
    
    if [ -z "$MONGODB_URI" ]; then
        print_warning "MongoDB URI not provided. You'll need to set it later."
        MONGODB_URI="mongodb://localhost:27017/constructai"
    fi
}

# Deploy backend to Cloud Run
deploy_backend() {
    print_header "Deploying Backend to Cloud Run"
    
    # Generate secure secrets
    JWT_SECRET=$(openssl rand -hex 32)
    JWT_REFRESH_SECRET=$(openssl rand -hex 32)
    SESSION_SECRET=$(openssl rand -hex 32)
    
    print_info "Deploying backend service..."
    gcloud run deploy $PROJECT_NAME-backend \
        --image gcr.io/$GCP_PROJECT_ID/$PROJECT_NAME-backend \
        --platform managed \
        --region $GCP_REGION \
        --allow-unauthenticated \
        --port 3001 \
        --set-env-vars "NODE_ENV=production,PORT=3001,DATABASE_URL=$MONGODB_URI,REDIS_URL=redis://$REDIS_HOST:$REDIS_PORT,JWT_SECRET=$JWT_SECRET,JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET,SESSION_SECRET=$SESSION_SECRET" \
        --project=$GCP_PROJECT_ID
    
    # Get backend URL
    BACKEND_URL=$(gcloud run services describe $PROJECT_NAME-backend \
        --region=$GCP_REGION \
        --project=$GCP_PROJECT_ID \
        --format="value(status.url)")
    
    print_success "Backend deployed: $BACKEND_URL"
}

# Deploy frontend to Cloud Run
deploy_frontend() {
    print_header "Deploying Frontend to Cloud Run"
    
    print_info "Deploying frontend service..."
    gcloud run deploy $PROJECT_NAME-frontend \
        --image gcr.io/$GCP_PROJECT_ID/$PROJECT_NAME-frontend \
        --platform managed \
        --region $GCP_REGION \
        --allow-unauthenticated \
        --port 80 \
        --set-env-vars "VITE_API_URL=$BACKEND_URL" \
        --project=$GCP_PROJECT_ID
    
    # Get frontend URL
    FRONTEND_URL=$(gcloud run services describe $PROJECT_NAME-frontend \
        --region=$GCP_REGION \
        --project=$GCP_PROJECT_ID \
        --format="value(status.url)")
    
    print_success "Frontend deployed: $FRONTEND_URL"
}

# Create Cloud Storage bucket for files
create_storage() {
    print_header "Creating Cloud Storage Bucket"
    
    BUCKET_NAME="$GCP_PROJECT_ID-$PROJECT_NAME-files"
    
    gsutil mb -p $GCP_PROJECT_ID -l $GCP_REGION gs://$BUCKET_NAME/ || print_warning "Bucket may already exist"
    gsutil uniformbucketlevelaccess set on gs://$BUCKET_NAME/
    
    print_success "Storage bucket created: gs://$BUCKET_NAME/"
}

# Setup Cloud CDN
setup_cdn() {
    print_header "Setting up Cloud CDN"
    
    print_info "Cloud CDN configuration requires additional setup"
    print_info "Follow: https://cloud.google.com/cdn/docs/setting-up-cdn-with-serverless"
}

# Save configuration
save_config() {
    print_header "Saving Configuration"
    
    cat > gcp-deployment-config.sh << EOF
#!/bin/bash
# GCP Deployment Configuration
# Generated on $(date)

export GCP_PROJECT_ID="$GCP_PROJECT_ID"
export GCP_REGION="$GCP_REGION"
export BACKEND_URL="$BACKEND_URL"
export FRONTEND_URL="$FRONTEND_URL"
export REDIS_HOST="$REDIS_HOST"
export REDIS_PORT="$REDIS_PORT"
export MONGODB_URI="$MONGODB_URI"
export STORAGE_BUCKET="$BUCKET_NAME"
EOF
    
    chmod +x gcp-deployment-config.sh
    print_success "Configuration saved to gcp-deployment-config.sh"
}

# Main deployment
main() {
    print_header "GCP Deployment for ConstructAI"
    
    print_warning "This will create GCP resources that may incur charges"
    read -p "Continue? (y/n) [n]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Deployment cancelled"
        exit 0
    fi
    
    check_prerequisites
    create_project
    enable_apis
    build_and_push_images
    create_redis
    setup_mongodb
    deploy_backend
    deploy_frontend
    create_storage
    setup_cdn
    save_config
    
    print_header "Deployment Complete"
    
    print_success "GCP deployment successful!"
    echo ""
    echo "Access your application:"
    echo "  Frontend: $FRONTEND_URL"
    echo "  Backend:  $BACKEND_URL"
    echo ""
    echo "Configuration saved to: gcp-deployment-config.sh"
    echo ""
    echo "Estimated monthly cost: $50-200 USD"
    echo ""
    echo "Next steps:"
    echo "1. Configure custom domain"
    echo "2. Setup Cloud CDN"
    echo "3. Configure monitoring and alerts"
    echo "4. Setup automated backups"
    echo ""
}

# Run main
main
