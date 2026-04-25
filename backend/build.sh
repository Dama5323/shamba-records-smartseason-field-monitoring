#!/bin/bash

# Force pip usage
export POETRY_VERSION=""

echo "=== Installing dependencies with pip ==="
pip install --upgrade pip
pip install -r requirements.txt

echo "=== Running migrations ==="
python manage.py migrate --noinput

# Setup demo users and data
python manage.py setup_demo

echo "=== Collecting static files ==="
python manage.py collectstatic --noinput --clear

echo "=== Build completed! ==="