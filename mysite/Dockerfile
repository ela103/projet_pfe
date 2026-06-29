FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r /app/requirements.txt

COPY docker/backend-entrypoint.sh /app/docker/backend-entrypoint.sh
RUN sed -i 's/\r$//' /app/docker/backend-entrypoint.sh \
    && chmod +x /app/docker/backend-entrypoint.sh

COPY . /app

EXPOSE 8000

ENTRYPOINT ["/app/docker/backend-entrypoint.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
