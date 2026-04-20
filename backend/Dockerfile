FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8080", "--access-logfile", "-", "--error-logfile", "-", "--capture-output", "--log-level", "info"]
