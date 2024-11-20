# Stage 1: Build Environment
FROM python:3.10-slim-bullseye AS builder

# Set working directory and copy files
WORKDIR /app
COPY . .

# Install dependencies required to build other packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential portaudio19-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install poetry

# Install dependencies using Poetry
RUN poetry config virtualenvs.create false && \
    poetry install --only main --no-root

# Download NLTK 'punkt' model
RUN poetry run python -m nltk.downloader punkt

# Stage 2: Production Environment
FROM python:3.10-slim-bullseye

# Copy only the essential files from the builder stage
WORKDIR /app
COPY --from=builder /app /app
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /usr/local/bin/poetry /usr/local/bin/poetry

# Final clean-up to reduce the image size
RUN apt-get purge -y --auto-remove build-essential && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /root/.cache

# Command to run the application
CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--ws-ping-interval", "600", "--ws-ping-timeout", "600"]
