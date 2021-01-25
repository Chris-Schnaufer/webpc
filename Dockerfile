FROM node:current-alpine as build
WORKDIR /app/react_frontend
COPY ./package.json ./
COPY ./package-lock.json ./
RUN npm ci
COPY ./ ./
RUN npm run build

FROM python:3.9-slim-buster
WORKDIR /app/flask_backend

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libgdal-dev \
        gcc \
        g++ \
        python-dev && \
    python3 -m pip install --upgrade --no-cache-dir \
        setuptools && \
    python3 -m pip install --upgrade --no-cache-dir \
        wheel && \
    python3 -m pip install --upgrade --no-cache-dir \
        gunicorn && \
    python3 -m pip install --upgrade --no-cache-dir \
        pygdal==2.4.0.* && \
    apt-get remove -y \
        gcc \
        g++ \
        python-dev && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN python3 -m pip install -r requirements.txt

COPY --from=build /app/react_frontend/build/* ./
RUN mkdir ./templates && \
    mv ./index.html ./templates/

COPY ./*.py ./
COPY ./*.sh ./
RUN chmod a+x *.sh

EXPOSE 5000

ENV PYTHONPATH="${PYTHONPATH}:/app/react_frontend"  \
    SERVER_DIR="/app/flask_backend"

CMD gunicorn -w 4 -b 0.0.0.0:5000 --access-logfile '-' main:app
