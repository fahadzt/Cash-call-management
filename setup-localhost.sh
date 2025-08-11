#!/bin/bash

echo "🚀 Setting up Enhanced Cash Call Management System for Localhost"
echo "================================================================"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file..."
    cp env.template .env.local
    echo "⚠️  Please edit .env.local and add your Supabase credentials:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo ""
    echo "   You can get these from your Supabase project dashboard."
    echo ""
    read -p "Press Enter after you've updated .env.local..."
else
    echo "✅ .env.local already exists"
fi

# Check if environment variables are set
if grep -q "your_supabase_project_url_here" .env.local; then
    echo "❌ Please update .env.local with your actual Supabase credentials"
    echo "   Run this script again after updating the credentials"
    exit 1
fi

echo "✅ Environment variables configured"

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Set up your Supabase database (if not already done)"
echo "2. Run the database migration scripts"
echo "3. Start the development server"
echo ""
echo "Would you like to:"
echo "1. Set up Supabase database and run migrations"
echo "2. Start the development server"
echo "3. Both"
echo ""
read -p "Enter your choice (1, 2, or 3): " choice

case $choice in
    1)
        echo "📊 Setting up database..."
        echo "Please run the following commands in your Supabase SQL editor:"
        echo ""
        echo "1. Run: scripts/08-enhanced-data-model.sql"
        echo "2. Run: scripts/09-seed-enhanced-data.sql"
        echo ""
        echo "Or use the Supabase CLI if you have it installed:"
        echo "supabase db push"
        ;;
    2)
        echo "🚀 Starting development server..."
        pnpm dev
        ;;
    3)
        echo "📊 Setting up database..."
        echo "Please run the following commands in your Supabase SQL editor:"
        echo ""
        echo "1. Run: scripts/08-enhanced-data-model.sql"
        echo "2. Run: scripts/09-seed-enhanced-data.sql"
        echo ""
        echo "After database setup, starting development server..."
        pnpm dev
        ;;
    *)
        echo "Invalid choice. Please run the script again."
        exit 1
        ;;
esac 