#!/bin/bash

# Cash Call Management - Service Maintenance Manager
# This script allows you to put individual services in maintenance mode

GATEWAY_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Available services
SERVICES=(
    "auth-service"
    "user-service"
    "dashboard-service"
    "cash-call-service"
    "affiliate-service"
    "document-service"
    "notification-service"
    "reporting-service"
)

# Function to print colored output
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
    echo -e "${BLUE}  Service Maintenance Manager${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to check if gateway is running
check_gateway() {
    if ! curl -s "$GATEWAY_URL/health" > /dev/null; then
        print_error "Gateway is not running at $GATEWAY_URL"
        print_error "Please start the gateway first"
        exit 1
    fi
}

# Function to enable maintenance mode for a service
enable_maintenance() {
    local service=$1
    print_status "Enabling maintenance mode for $service..."
    
    response=$(curl -s -X POST "$GATEWAY_URL/maintenance/$service/enable")
    
    if [[ $response == *"maintenance mode enabled"* ]]; then
        print_status "Maintenance mode enabled for $service"
    else
        print_error "Failed to enable maintenance mode for $service"
        print_error "Response: $response"
    fi
}

# Function to disable maintenance mode for a service
disable_maintenance() {
    local service=$1
    print_status "Disabling maintenance mode for $service..."
    
    response=$(curl -s -X POST "$GATEWAY_URL/maintenance/$service/disable")
    
    if [[ $response == *"maintenance mode disabled"* ]]; then
        print_status "Maintenance mode disabled for $service"
    else
        print_error "Failed to disable maintenance mode for $service"
        print_error "Response: $response"
    fi
}

# Function to show service status
show_status() {
    print_status "Checking service status..."
    
    response=$(curl -s "$GATEWAY_URL/health")
    
    if [[ $response == *"services"* ]]; then
        echo "$response" | jq -r '.services[] | "\(.name): \(.health)"' 2>/dev/null || {
            print_warning "Could not parse JSON response. Raw response:"
            echo "$response"
        }
    else
        print_error "Failed to get service status"
        print_error "Response: $response"
    fi
}

# Function to show help
show_help() {
    print_header
    echo ""
    echo "Usage: $0 [COMMAND] [SERVICE]"
    echo ""
    echo "Commands:"
    echo "  enable <service>    Enable maintenance mode for a service"
    echo "  disable <service>   Disable maintenance mode for a service"
    echo "  status             Show status of all services"
    echo "  list               List all available services"
    echo "  help               Show this help message"
    echo ""
    echo "Available Services:"
    for service in "${SERVICES[@]}"; do
        echo "  - $service"
    done
    echo ""
    echo "Examples:"
    echo "  $0 enable dashboard-service"
    echo "  $0 disable cash-call-service"
    echo "  $0 status"
    echo ""
}

# Function to list services
list_services() {
    print_header
    echo ""
    echo "Available Services:"
    echo ""
    for service in "${SERVICES[@]}"; do
        echo "  - $service"
    done
    echo ""
}

# Main script logic
main() {
    local command=$1
    local service=$2

    # Check if gateway is running
    check_gateway

    case $command in
        "enable")
            if [[ -z $service ]]; then
                print_error "Please specify a service to enable maintenance mode"
                echo "Usage: $0 enable <service>"
                exit 1
            fi
            
            if [[ " ${SERVICES[@]} " =~ " ${service} " ]]; then
                enable_maintenance "$service"
            else
                print_error "Unknown service: $service"
                echo "Use '$0 list' to see available services"
                exit 1
            fi
            ;;
            
        "disable")
            if [[ -z $service ]]; then
                print_error "Please specify a service to disable maintenance mode"
                echo "Usage: $0 disable <service>"
                exit 1
            fi
            
            if [[ " ${SERVICES[@]} " =~ " ${service} " ]]; then
                disable_maintenance "$service"
            else
                print_error "Unknown service: $service"
                echo "Use '$0 list' to see available services"
                exit 1
            fi
            ;;
            
        "status")
            show_status
            ;;
            
        "list")
            list_services
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

# Run main function with all arguments
main "$@"
