#!/bin/bash

# Cash Call Management - Microservices Development Startup Script
# This script starts all microservices in development mode

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  Starting Microservices${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to check if a port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to start a service
start_service() {
    local service_name=$1
    local port=$2
    local directory=$3
    
    print_status "Starting $service_name on port $port..."
    
    if check_port $port; then
        print_warning "Port $port is already in use. Skipping $service_name"
        return 1
    fi
    
    if [ ! -d "$directory" ]; then
        print_error "Directory $directory does not exist. Skipping $service_name"
        return 1
    fi
    
    # Start the service in the background
    cd "$directory" && npm run dev > "../logs/$service_name.log" 2>&1 &
    local pid=$!
    echo $pid > "../logs/$service_name.pid"
    
    # Wait a moment for the service to start
    sleep 3
    
    # Check if the service started successfully
    if check_port $port; then
        print_status "$service_name started successfully (PID: $pid)"
        return 0
    else
        print_error "Failed to start $service_name"
        return 1
    fi
}

# Function to stop all services
stop_services() {
    print_status "Stopping all services..."
    
    if [ -d "logs" ]; then
        for pid_file in logs/*.pid; do
            if [ -f "$pid_file" ]; then
                local pid=$(cat "$pid_file")
                local service_name=$(basename "$pid_file" .pid)
                
                if kill -0 $pid 2>/dev/null; then
                    print_status "Stopping $service_name (PID: $pid)..."
                    kill $pid
                    rm "$pid_file"
                fi
            fi
        done
    fi
    
    print_status "All services stopped"
}

# Function to show service status
show_status() {
    print_status "Service Status:"
    echo ""
    
    local services=(
        "Gateway:3000:gateway"
        "Auth Service:3001:core/auth-service"
        "User Service:3002:core/user-service"
        "Dashboard Service:3003:features/dashboard-service"
        "Cash Call Service:3004:features/cash-call-service"
        "Affiliate Service:3005:features/affiliate-service"
        "Document Service:3006:features/document-service"
        "Notification Service:3007:features/notification-service"
        "Reporting Service:3008:features/reporting-service"
    )
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r name port directory <<< "$service_info"
        
        if check_port $port; then
            echo -e "  ${GREEN}✓${NC} $name (Port $port) - Running"
        else
            echo -e "  ${RED}✗${NC} $name (Port $port) - Stopped"
        fi
    done
    echo ""
}

# Function to show help
show_help() {
    print_header
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start              Start all microservices"
    echo "  stop               Stop all microservices"
    echo "  restart            Restart all microservices"
    echo "  status             Show status of all services"
    echo "  logs <service>     Show logs for a specific service"
    echo "  help               Show this help message"
    echo ""
    echo "Available Services:"
    echo "  - gateway"
    echo "  - auth-service"
    echo "  - user-service"
    echo "  - dashboard-service"
    echo "  - cash-call-service"
    echo "  - affiliate-service"
    echo "  - document-service"
    echo "  - notification-service"
    echo "  - reporting-service"
    echo ""
}

# Function to show logs
show_logs() {
    local service=$1
    
    if [ -z "$service" ]; then
        print_error "Please specify a service name"
        echo "Usage: $0 logs <service>"
        exit 1
    fi
    
    local log_file="logs/$service.log"
    
    if [ -f "$log_file" ]; then
        print_status "Showing logs for $service:"
        echo ""
        tail -f "$log_file"
    else
        print_error "Log file not found for $service"
        exit 1
    fi
}

# Main script logic
main() {
    local command=$1
    local service=$2
    
    # Create logs directory if it doesn't exist
    mkdir -p logs
    
    case $command in
        "start")
            print_header
            
            # Start services in order
            start_service "gateway" 3000 "gateway"
            start_service "auth-service" 3001 "core/auth-service"
            start_service "user-service" 3002 "core/user-service"
            start_service "dashboard-service" 3003 "features/dashboard-service"
            start_service "cash-call-service" 3004 "features/cash-call-service"
            start_service "affiliate-service" 3005 "features/affiliate-service"
            start_service "document-service" 3006 "features/document-service"
            start_service "notification-service" 3007 "features/notification-service"
            start_service "reporting-service" 3008 "features/reporting-service"
            
            print_status "All services started!"
            echo ""
            show_status
            ;;
            
        "stop")
            stop_services
            ;;
            
        "restart")
            print_status "Restarting all services..."
            stop_services
            sleep 2
            $0 start
            ;;
            
        "status")
            show_status
            ;;
            
        "logs")
            show_logs "$service"
            ;;
            
        "help"|"--help"|"-h"|"")
            show_help
            ;;
            
        *)
            print_error "Unknown command: $command"
            echo "Use '$0 help' to see available commands"
            exit 1
            ;;
    esac
}

# Handle Ctrl+C to stop all services
trap 'echo ""; print_warning "Received interrupt signal"; stop_services; exit 0' INT

# Run main function with all arguments
main "$@"
