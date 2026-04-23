#!/bin/sh
set -eu

python manage.py migrate --noinput

exec gunicorn backend.wsgi:application \
  --bind 0.0.0.0:8080 \
  --access-logfile - \
  --error-logfile - \
  --capture-output \
  --log-level info
