#!/bin/bash
# Linux/Mac script to install EZKL

echo "Installing EZKL and dependencies..."

# Try PyPI first
pip install ezkl || {
    echo "PyPI installation failed, trying GitHub..."
    pip install git+https://github.com/zkonduit/ezkl.git
}

# Install other dependencies
pip install torch numpy

# Verify installation
python -c "import ezkl; print('EZKL installed successfully!')" || {
    echo "ERROR: EZKL installation failed!"
    echo "Please check: https://github.com/zkonduit/ezkl"
    exit 1
}

echo "Installation complete!"

