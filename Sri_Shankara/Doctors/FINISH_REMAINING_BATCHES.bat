@echo off
cd /d "%~dp0.."
echo Running update script to complete batches 9-14 (doctors 81-137)...
python update_doctor_pages.py
pause
