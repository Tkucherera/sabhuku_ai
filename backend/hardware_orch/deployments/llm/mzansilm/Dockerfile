ARG BASE_IMAGE=pytorch/pytorch:2.3.1-cuda12.1-cudnn8-runtime
FROM ${BASE_IMAGE}

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV HF_HOME=/models/huggingface
ENV TRANSFORMERS_CACHE=/models/huggingface
ENV LLM_MODEL_PATH=/app/model
ENV LLM_MODEL_MODULE=mzansilm
ENV LLM_MODEL_CLASS=Mzansilm

WORKDIR /app

COPY mzansilm/requirements.txt .
RUN pip install --no-cache-dir --timeout=300 --retries=5 -r requirements.txt

COPY runtime/ ./runtime/
COPY mzansilm/mzansilm.py ./model/mzansilm.py
COPY mzansilm/mzansilm-125m/ ./model/mzansilm-125m/

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=5)"

CMD ["uvicorn", "runtime.api:app", "--host", "0.0.0.0", "--port", "8000"]
