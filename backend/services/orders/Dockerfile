FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY services/orders/requirements.txt .
COPY shared/requirements.txt ./shared-requirements.txt
RUN pip install --no-cache-dir --user -r requirements.txt -r shared-requirements.txt

COPY shared /app/shared

FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app

COPY --from=builder /root/.local /home/appuser/.local
COPY --from=builder /app/shared /app/shared

COPY services/orders/app /app/app
COPY services/orders/alembic /app/alembic
COPY services/orders/alembic.ini /app/alembic.ini

ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONPATH=/app

USER appuser

EXPOSE 8005

CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8005"]
