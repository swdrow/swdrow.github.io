#!/bin/bash

# RowCast Production Build and Deploy Script
# This script builds the website for production and prepares it for deployment

set -e  # Exit on any error

echo "🚀 Starting RowCast production build..."

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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_status "Checking Node.js and npm versions..."
node --version
npm --version

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf dist/

# Install dependencies
print_status "Installing/updating dependencies..."
npm ci

# Run build
print_status "Building for production..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    print_error "Build failed - dist directory not created"
    exit 1
fi

print_success "Build completed successfully!"

# Display build size information
print_status "Build size information:"
du -sh dist/
ls -la dist/

# Check for required files
required_files=("index.html" "assets")
for file in "${required_files[@]}"; do
    if [ ! -e "dist/$file" ]; then
        print_error "Required file/directory missing: $file"
        exit 1
    fi
done

print_success "All required files present in build"

# Optional: Test the build locally
read -p "Would you like to preview the build locally? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting preview server..."
    npm run preview &
    PREVIEW_PID=$!
    
    print_success "Preview server started at http://localhost:4173"
    print_warning "Press Ctrl+C to stop the preview server"
    
    # Wait for user to stop
    wait $PREVIEW_PID
fi

print_success "Production build ready for deployment!"
print_status "Deploy the 'dist' folder to your web server"
print_status "Make sure the API is accessible at '/api/*' endpoint"

echo
print_status "Deployment options:"
echo "  1. Cloudflare Pages: Connect repository and set build command to 'npm run build'"
echo "  2. GitHub Pages: Deploy the 'dist' folder contents"
echo "  3. Custom server: Upload 'dist' folder and configure API proxy"

print_success "Build process completed! 🎉"
