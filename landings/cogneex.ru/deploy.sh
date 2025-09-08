#!/bin/bash

# Deploy script for Cogneex.ru landing page
# Copies built files to production server via SCP/rsync

# Configuration
SERVER="root@api.enchantstory.ru"
REMOTE_PATH="/www/wwwroot/cogneex.ru"
LOCAL_PATH="./dist/"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    echo -e "${2}${1}${NC}"
}

# Check if dry-run flag is passed
DRY_RUN=""
if [ "$1" == "--dry-run" ]; then
    DRY_RUN="--dry-run"
    print_message "🔍 Running in DRY-RUN mode (no files will be copied)" "$YELLOW"
fi

# Step 1: Build the project
print_message "📦 Building the project..." "$YELLOW"
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    print_message "❌ Build failed! Aborting deployment." "$RED"
    exit 1
fi

print_message "✅ Build completed successfully!" "$GREEN"

# Step 2: Check if dist directory exists
if [ ! -d "$LOCAL_PATH" ]; then
    print_message "❌ Error: dist directory not found!" "$RED"
    exit 1
fi

# Step 3: Deploy to server using rsync
print_message "🚀 Deploying to $SERVER..." "$YELLOW"
print_message "   Target path: $REMOTE_PATH" "$NC"

# Use rsync for efficient file transfer
# -r: recursive
# -l: copy symlinks as symlinks
# -p: preserve permissions
# -t: preserve times
# -v: verbose
# -z: compress during transfer
# --delete: remove files on destination that don't exist locally
# --exclude: exclude certain files/directories
# Note: Using individual flags instead of -a to avoid extended attributes issues
rsync -rlptvz --delete \
    --exclude '.DS_Store' \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '*.map' \
    $DRY_RUN \
    -e "ssh -o StrictHostKeyChecking=no" \
    ${LOCAL_PATH}* $SERVER:$REMOTE_PATH/

# Check if deployment was successful
if [ $? -eq 0 ]; then
    if [ -z "$DRY_RUN" ]; then
        print_message "✅ Deployment completed successfully!" "$GREEN"
        print_message "🌐 Site is live at: https://cogneex.ru" "$GREEN"
    else
        print_message "✅ Dry-run completed. No files were copied." "$GREEN"
        print_message "   Run without --dry-run flag to deploy." "$NC"
    fi
else
    print_message "❌ Deployment failed!" "$RED"
    exit 1
fi

# Optional: Clear CDN cache or restart services
# Uncomment if needed:
# print_message "🔄 Clearing cache..." "$YELLOW"
# ssh $SERVER "systemctl reload nginx"

print_message "🎉 Done!" "$GREEN"