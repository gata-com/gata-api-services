#!/bin/bash

# Build verification script
echo "🔍 Verifying build configuration..."

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi

echo "✅ package.json found"

# Check if tsconfig.json exists
if [ ! -f "tsconfig.json" ]; then
    echo "❌ tsconfig.json not found"
    exit 1
fi

echo "✅ tsconfig.json found"

# Check if src directory exists
if [ ! -d "src" ]; then
    echo "❌ src directory not found"
    exit 1
fi

echo "✅ src directory found"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found, installing dependencies..."
    npm install
fi

echo "✅ node_modules found"

# Check critical dependencies
echo "🔍 Checking critical dependencies..."

REQUIRED_DEPS=("typescript" "ts-node" "tsconfig-paths" "@types/node" "typeorm")

for dep in "${REQUIRED_DEPS[@]}"; do
    if ! npm list "$dep" > /dev/null 2>&1; then
        echo "❌ Required dependency '$dep' not found"
        exit 1
    else
        echo "  ✅ $dep"
    fi
done

# Clean old build
if [ -d "dist" ]; then
    echo "🧹 Cleaning old build..."
    rm -rf dist
fi

# Build
echo "🔨 Building application..."
npm run build

# Verify build output
if [ ! -d "dist" ]; then
    echo "❌ Build failed: dist directory not created"
    exit 1
fi

if [ ! -f "dist/server.js" ]; then
    echo "❌ Build failed: server.js not found in dist"
    exit 1
fi

# Count files in dist
FILE_COUNT=$(find dist -type f | wc -l)
echo "📦 Build created $FILE_COUNT files"

# Check if key files exist
KEY_FILES=("dist/server.js" "dist/app.js" "dist/config/database.js")

for file in "${KEY_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ⚠️  $file not found (may be normal)"
    fi
done

echo ""
echo "✅ Build verification completed successfully!"
echo ""
echo "Next steps:"
echo "1. Test locally: npm start"
echo "2. Deploy to VPS: git push origin main"
echo "3. Check PM2 status: pm2 list"
echo "4. View logs: pm2 logs gata-api-services"
