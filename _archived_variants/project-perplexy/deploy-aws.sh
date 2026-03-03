#!/bin/bash

# ========================================
# AWS Deployment Script for ConstructAI
# ========================================
# This script automates the deployment of ConstructAI to AWS
# Prerequisites: AWS CLI configured with appropriate credentials

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
PROJECT_NAME="constructai"
ENVIRONMENT="${ENVIRONMENT:-production}"

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
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed"
        echo "Install from: https://aws.amazon.com/cli/"
        exit 1
    fi
    print_success "AWS CLI is installed"
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured"
        echo "Run: aws configure"
        exit 1
    fi
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    print_success "AWS credentials configured (Account: $ACCOUNT_ID)"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    print_success "Docker is installed"
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        print_warning "jq is not installed (recommended for JSON parsing)"
    fi
}

# Create VPC and networking
create_vpc() {
    print_header "Creating VPC and Networking"
    
    # Create VPC
    VPC_ID=$(aws ec2 create-vpc \
        --cidr-block 10.0.0.0/16 \
        --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=$PROJECT_NAME-vpc}]" \
        --region $AWS_REGION \
        --query 'Vpc.VpcId' \
        --output text)
    print_success "VPC created: $VPC_ID"
    
    # Enable DNS hostnames
    aws ec2 modify-vpc-attribute \
        --vpc-id $VPC_ID \
        --enable-dns-hostnames \
        --region $AWS_REGION
    
    # Create Internet Gateway
    IGW_ID=$(aws ec2 create-internet-gateway \
        --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=$PROJECT_NAME-igw}]" \
        --region $AWS_REGION \
        --query 'InternetGateway.InternetGatewayId' \
        --output text)
    print_success "Internet Gateway created: $IGW_ID"
    
    # Attach Internet Gateway to VPC
    aws ec2 attach-internet-gateway \
        --vpc-id $VPC_ID \
        --internet-gateway-id $IGW_ID \
        --region $AWS_REGION
    
    # Create subnets in different AZs
    SUBNET1_ID=$(aws ec2 create-subnet \
        --vpc-id $VPC_ID \
        --cidr-block 10.0.1.0/24 \
        --availability-zone ${AWS_REGION}a \
        --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$PROJECT_NAME-subnet-1}]" \
        --region $AWS_REGION \
        --query 'Subnet.SubnetId' \
        --output text)
    print_success "Subnet 1 created: $SUBNET1_ID"
    
    SUBNET2_ID=$(aws ec2 create-subnet \
        --vpc-id $VPC_ID \
        --cidr-block 10.0.2.0/24 \
        --availability-zone ${AWS_REGION}b \
        --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$PROJECT_NAME-subnet-2}]" \
        --region $AWS_REGION \
        --query 'Subnet.SubnetId' \
        --output text)
    print_success "Subnet 2 created: $SUBNET2_ID"
    
    # Create route table
    RT_ID=$(aws ec2 create-route-table \
        --vpc-id $VPC_ID \
        --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=$PROJECT_NAME-rt}]" \
        --region $AWS_REGION \
        --query 'RouteTable.RouteTableId' \
        --output text)
    print_success "Route table created: $RT_ID"
    
    # Create route to Internet Gateway
    aws ec2 create-route \
        --route-table-id $RT_ID \
        --destination-cidr-block 0.0.0.0/0 \
        --gateway-id $IGW_ID \
        --region $AWS_REGION
    
    # Associate route table with subnets
    aws ec2 associate-route-table \
        --subnet-id $SUBNET1_ID \
        --route-table-id $RT_ID \
        --region $AWS_REGION
    
    aws ec2 associate-route-table \
        --subnet-id $SUBNET2_ID \
        --route-table-id $RT_ID \
        --region $AWS_REGION
    
    # Enable auto-assign public IP
    aws ec2 modify-subnet-attribute \
        --subnet-id $SUBNET1_ID \
        --map-public-ip-on-launch \
        --region $AWS_REGION
    
    aws ec2 modify-subnet-attribute \
        --subnet-id $SUBNET2_ID \
        --map-public-ip-on-launch \
        --region $AWS_REGION
    
    print_success "VPC networking configured"
}

# Create security groups
create_security_groups() {
    print_header "Creating Security Groups"
    
    # Backend security group
    BACKEND_SG_ID=$(aws ec2 create-security-group \
        --group-name "$PROJECT_NAME-backend-sg" \
        --description "Security group for backend" \
        --vpc-id $VPC_ID \
        --region $AWS_REGION \
        --query 'GroupId' \
        --output text)
    print_success "Backend security group created: $BACKEND_SG_ID"
    
    # Allow HTTP/HTTPS from anywhere
    aws ec2 authorize-security-group-ingress \
        --group-id $BACKEND_SG_ID \
        --protocol tcp \
        --port 3001 \
        --cidr 0.0.0.0/0 \
        --region $AWS_REGION
    
    # Database security group
    DB_SG_ID=$(aws ec2 create-security-group \
        --group-name "$PROJECT_NAME-db-sg" \
        --description "Security group for database" \
        --vpc-id $VPC_ID \
        --region $AWS_REGION \
        --query 'GroupId' \
        --output text)
    print_success "Database security group created: $DB_SG_ID"
    
    # Allow MongoDB from backend
    aws ec2 authorize-security-group-ingress \
        --group-id $DB_SG_ID \
        --protocol tcp \
        --port 27017 \
        --source-group $BACKEND_SG_ID \
        --region $AWS_REGION
    
    # Redis security group  
    REDIS_SG_ID=$(aws ec2 create-security-group \
        --group-name "$PROJECT_NAME-redis-sg" \
        --description "Security group for Redis" \
        --vpc-id $VPC_ID \
        --region $AWS_REGION \
        --query 'GroupId' \
        --output text)
    print_success "Redis security group created: $REDIS_SG_ID"
    
    # Allow Redis from backend
    aws ec2 authorize-security-group-ingress \
        --group-id $REDIS_SG_ID \
        --protocol tcp \
        --port 6379 \
        --source-group $BACKEND_SG_ID \
        --region $AWS_REGION
}

# Create ECR repositories
create_ecr() {
    print_header "Creating ECR Repositories"
    
    # Create backend repository
    aws ecr create-repository \
        --repository-name "$PROJECT_NAME/backend" \
        --region $AWS_REGION \
        2>/dev/null || print_warning "Backend ECR repository may already exist"
    print_success "Backend ECR repository ready"
    
    # Create frontend repository
    aws ecr create-repository \
        --repository-name "$PROJECT_NAME/frontend" \
        --region $AWS_REGION \
        2>/dev/null || print_warning "Frontend ECR repository may already exist"
    print_success "Frontend ECR repository ready"
}

# Build and push Docker images
build_and_push_images() {
    print_header "Building and Pushing Docker Images"
    
    # Login to ECR
    aws ecr get-login-password --region $AWS_REGION | \
        docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    print_success "Logged in to ECR"
    
    # Build and push backend
    print_info "Building backend image..."
    docker build -t $PROJECT_NAME/backend:latest packages/backend
    docker tag $PROJECT_NAME/backend:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME/backend:latest
    docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME/backend:latest
    print_success "Backend image pushed to ECR"
    
    # Build and push frontend
    print_info "Building frontend image..."
    docker build -t $PROJECT_NAME/frontend:latest packages/frontend
    docker tag $PROJECT_NAME/frontend:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME/frontend:latest
    docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME/frontend:latest
    print_success "Frontend image pushed to ECR"
}

# Create ECS cluster
create_ecs_cluster() {
    print_header "Creating ECS Cluster"
    
    aws ecs create-cluster \
        --cluster-name $PROJECT_NAME-cluster \
        --region $AWS_REGION
    print_success "ECS cluster created"
}

# Create Application Load Balancer
create_alb() {
    print_header "Creating Application Load Balancer"
    
    ALB_ARN=$(aws elbv2 create-load-balancer \
        --name $PROJECT_NAME-alb \
        --subnets $SUBNET1_ID $SUBNET2_ID \
        --security-groups $BACKEND_SG_ID \
        --region $AWS_REGION \
        --query 'LoadBalancers[0].LoadBalancerArn' \
        --output text)
    print_success "ALB created: $ALB_ARN"
    
    # Get ALB DNS name
    ALB_DNS=$(aws elbv2 describe-load-balancers \
        --load-balancer-arns $ALB_ARN \
        --region $AWS_REGION \
        --query 'LoadBalancers[0].DNSName' \
        --output text)
    print_success "ALB DNS: $ALB_DNS"
}

# Create DocumentDB cluster
create_documentdb() {
    print_header "Creating DocumentDB Cluster"
    
    print_warning "DocumentDB is expensive (~$200/month minimum)"
    read -p "Continue with DocumentDB? (y/n) [n]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Skipping DocumentDB. Use MongoDB Atlas instead."
        print_info "Sign up at: https://www.mongodb.com/cloud/atlas"
        return
    fi
    
    # Create subnet group
    aws docdb create-db-subnet-group \
        --db-subnet-group-name $PROJECT_NAME-docdb-subnet \
        --db-subnet-group-description "Subnet group for DocumentDB" \
        --subnet-ids $SUBNET1_ID $SUBNET2_ID \
        --region $AWS_REGION
    
    # Create DocumentDB cluster
    aws docdb create-db-cluster \
        --db-cluster-identifier $PROJECT_NAME-docdb \
        --engine docdb \
        --master-username admin \
        --master-user-password "$(openssl rand -base64 32)" \
        --vpc-security-group-ids $DB_SG_ID \
        --db-subnet-group-name $PROJECT_NAME-docdb-subnet \
        --region $AWS_REGION
    print_success "DocumentDB cluster created"
}

# Create ElastiCache Redis
create_elasticache() {
    print_header "Creating ElastiCache Redis"
    
    # Create subnet group
    aws elasticache create-cache-subnet-group \
        --cache-subnet-group-name $PROJECT_NAME-redis-subnet \
        --cache-subnet-group-description "Subnet group for Redis" \
        --subnet-ids $SUBNET1_ID $SUBNET2_ID \
        --region $AWS_REGION
    
    # Create Redis cluster
    aws elasticache create-cache-cluster \
        --cache-cluster-id $PROJECT_NAME-redis \
        --engine redis \
        --cache-node-type cache.t3.micro \
        --num-cache-nodes 1 \
        --security-group-ids $REDIS_SG_ID \
        --cache-subnet-group-name $PROJECT_NAME-redis-subnet \
        --region $AWS_REGION
    print_success "ElastiCache Redis cluster created"
}

# Save configuration
save_config() {
    print_header "Saving Configuration"
    
    cat > aws-deployment-config.sh << EOF
#!/bin/bash
# AWS Deployment Configuration
# Generated on $(date)

export AWS_REGION="$AWS_REGION"
export AWS_ACCOUNT_ID="$ACCOUNT_ID"
export VPC_ID="$VPC_ID"
export SUBNET1_ID="$SUBNET1_ID"
export SUBNET2_ID="$SUBNET2_ID"
export BACKEND_SG_ID="$BACKEND_SG_ID"
export DB_SG_ID="$DB_SG_ID"
export REDIS_SG_ID="$REDIS_SG_ID"
export ALB_ARN="$ALB_ARN"
export ALB_DNS="$ALB_DNS"
EOF
    
    chmod +x aws-deployment-config.sh
    print_success "Configuration saved to aws-deployment-config.sh"
}

# Main deployment
main() {
    print_header "AWS Deployment for ConstructAI"
    
    print_warning "This will create AWS resources that may incur charges"
    read -p "Continue? (y/n) [n]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Deployment cancelled"
        exit 0
    fi
    
    check_prerequisites
    create_vpc
    create_security_groups
    create_ecr
    build_and_push_images
    create_ecs_cluster
    create_alb
    create_elasticache
    create_documentdb
    save_config
    
    print_header "Deployment Complete"
    
    print_success "AWS resources created successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Review aws-deployment-config.sh for resource IDs"
    echo "2. Create ECS task definitions (see aws-ecs-task-def.json)"
    echo "3. Create ECS services"
    echo "4. Configure environment variables"
    echo "5. Access your application at: http://$ALB_DNS"
    echo ""
    echo "Estimated monthly cost: $200-500 USD"
    echo ""
}

# Run main
main
