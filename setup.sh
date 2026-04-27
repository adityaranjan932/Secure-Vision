#!/bin/bash
# Secure Vision - Setup Script

echo "============================================"
echo "  SECURE VISION - Setup Script"
echo "============================================"
echo ""

# Check if python3-venv is installed
echo "Checking dependencies..."
if ! python3 -m venv --help &> /dev/null; then
    echo "⚠️  python3-venv is not installed!"
    echo ""
    echo "Please run:"
    echo "  sudo apt install -y python3.13-venv"
    echo ""
    exit 1
fi

echo "✓ python3-venv is available"
echo ""

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

echo ""
echo "Activating virtual environment..."
source venv/bin/activate

echo "✓ Virtual environment activated"
echo ""

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

echo ""
echo "Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "Frontend build (React):"
echo "  Install Node.js and run:"
echo "    cd frontend"
echo "    npm install"
echo "    npm run build"

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "To run the server:"
echo "  1. Activate the virtual environment:"
echo "     source venv/bin/activate"
echo ""
echo "  2. Start the server:"
echo "     python run_web.py"
echo ""
echo "  3. Build the frontend if you want the React UI:"
echo "     cd frontend && npm install && npm run build"
echo ""
echo "  4. Open browser to:"
echo "     http://localhost:8000"
echo ""
echo "============================================"
