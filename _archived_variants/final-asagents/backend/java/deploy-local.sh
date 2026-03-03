#!/bin/bash
# Local Deployment Script for ASAgents Java Backend
# Version: 1.0.0 - Post Upgrade to Java 21 & Spring Boot 3.4.1

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}ASAgents Java Backend - Local Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JAR_NAME="multimodal-backend-1.0.0.jar"
JAR_PATH="$PROJECT_DIR/target/$JAR_NAME"
PID_FILE="$PROJECT_DIR/application.pid"
LOG_FILE="$PROJECT_DIR/logs/application.log"
PORT=4001

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"

# Function to check if application is running
is_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Function to stop application
stop_app() {
    echo -e "${YELLOW}Stopping application...${NC}"
    if is_running; then
        PID=$(cat "$PID_FILE")
        kill "$PID" 2>/dev/null || true
        
        # Wait for process to stop (max 30 seconds)
        for i in {1..30}; do
            if ! ps -p "$PID" > /dev/null 2>&1; then
                break
            fi
            sleep 1
        done
        
        # Force kill if still running
        if ps -p "$PID" > /dev/null 2>&1; then
            echo -e "${YELLOW}Force stopping...${NC}"
            kill -9 "$PID" 2>/dev/null || true
        fi
        
        rm -f "$PID_FILE"
        echo -e "${GREEN}✓ Application stopped${NC}"
    else
        echo -e "${YELLOW}Application is not running${NC}"
    fi
}

# Function to start application
start_app() {
    echo -e "${YELLOW}Starting application...${NC}"
    
    if is_running; then
        echo -e "${RED}✗ Application is already running (PID: $(cat $PID_FILE))${NC}"
        echo -e "${YELLOW}  Use './deploy-local.sh restart' to restart${NC}"
        exit 1
    fi
    
    # Check if JAR exists
    if [ ! -f "$JAR_PATH" ]; then
        echo -e "${RED}✗ JAR file not found: $JAR_PATH${NC}"
        echo -e "${YELLOW}  Building application first...${NC}"
        build_app
    fi
    
    # Check if port is available
    if lsof -i :"$PORT" > /dev/null 2>&1; then
        echo -e "${RED}✗ Port $PORT is already in use${NC}"
        lsof -i :"$PORT"
        exit 1
    fi
    
    # Start application in background
    echo -e "${BLUE}Starting Java backend on port $PORT...${NC}"
    nohup java -jar "$JAR_PATH" > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    
    # Wait for application to start
    echo -e "${YELLOW}Waiting for application to start...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:$PORT/actuator/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Application started successfully!${NC}"
            echo -e "${GREEN}  PID: $(cat $PID_FILE)${NC}"
            echo -e "${GREEN}  Port: $PORT${NC}"
            echo -e "${GREEN}  Health: http://localhost:$PORT/actuator/health${NC}"
            echo -e "${GREEN}  Logs: tail -f $LOG_FILE${NC}"
            return 0
        fi
        sleep 1
    done
    
    echo -e "${RED}✗ Application failed to start${NC}"
    echo -e "${YELLOW}  Check logs: tail -f $LOG_FILE${NC}"
    exit 1
}

# Function to build application
build_app() {
    echo -e "${YELLOW}Building application...${NC}"
    cd "$PROJECT_DIR"
    mvn clean package -DskipTests
    echo -e "${GREEN}✓ Build complete${NC}"
}

# Function to show status
show_status() {
    echo -e "${BLUE}Application Status:${NC}"
    if is_running; then
        PID=$(cat "$PID_FILE")
        echo -e "${GREEN}  Status: Running${NC}"
        echo -e "  PID: $PID"
        echo -e "  Port: $PORT"
        echo -e "  Memory: $(ps -p $PID -o rss= | awk '{printf "%.2f MB", $1/1024}')"
        echo -e "  Uptime: $(ps -p $PID -o etime= | xargs)"
        
        # Check health endpoint
        if curl -s http://localhost:$PORT/actuator/health > /dev/null 2>&1; then
            echo -e "${GREEN}  Health: UP${NC}"
        else
            echo -e "${RED}  Health: DOWN${NC}"
        fi
    else
        echo -e "${RED}  Status: Stopped${NC}"
    fi
}

# Function to show logs
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE"
    else
        echo -e "${RED}✗ Log file not found: $LOG_FILE${NC}"
    fi
}

# Main script logic
case "${1:-start}" in
    start)
        start_app
        ;;
    stop)
        stop_app
        ;;
    restart)
        stop_app
        sleep 2
        start_app
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    build)
        build_app
        ;;
    deploy)
        build_app
        stop_app
        sleep 2
        start_app
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|build|deploy}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the application"
        echo "  stop    - Stop the application"
        echo "  restart - Restart the application"
        echo "  status  - Show application status"
        echo "  logs    - Tail application logs"
        echo "  build   - Build the application"
        echo "  deploy  - Build and deploy (stop, build, start)"
        exit 1
        ;;
esac
