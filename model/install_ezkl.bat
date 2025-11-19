@echo off
REM Windows batch script to install EZKL
echo Installing EZKL and dependencies...

REM Try PyPI first
pip install ezkl
if %errorlevel% neq 0 (
    echo PyPI installation failed, trying GitHub...
    pip install git+https://github.com/zkonduit/ezkl.git
)

REM Install other dependencies
pip install torch numpy

REM Verify installation
python -c "import ezkl; print('EZKL installed successfully!')"
if %errorlevel% neq 0 (
    echo ERROR: EZKL installation failed!
    echo Please check: https://github.com/zkonduit/ezkl
    pause
) else (
    echo.
    echo Installation complete!
    pause
)

