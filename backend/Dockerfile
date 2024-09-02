FROM --platform=linux/amd64 python:3.10-slim-bullseye

RUN mkdir /app
# Copy to app folder
COPY . /app/
# Change the working directory.
WORKDIR /app

RUN apt-get update \
    # dependencies for building Python packages
    && apt-get install -y build-essential \
    # install portaudio
    && apt-get install -y portaudio19-dev python-all-dev \
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install poetry

# Install poetry dependencies
RUN poetry install --only main

# Command to run the application
# without debug
# CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--ws-ping-interval", "600", "--ws-ping-timeout", "600"]
# with debug
# CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--log-level", "debug", "--ws-ping-interval", "600", "--ws-ping-timeout", "600"]