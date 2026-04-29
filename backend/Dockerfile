FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY ml-requirements.txt .
RUN pip install --no-cache-dir --timeout=300 --retries=5 -r ml-requirements.txt

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput
RUN chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]
