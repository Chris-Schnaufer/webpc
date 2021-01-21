FROM node:current-alpine as build
WORKDIR /app/react_frontend
COPY ./package.json ./
COPY ./package-lock.json ./
RUN npm ci
COPY ./ ./
RUN npm run build

FROM python:3.9-slim-buster
WORKDIR /app/flask_backend
ENV PYTHONPATH "${PYTHONPATH}:/app"

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

COPY --from=build /app/react_frontend/build/* ./static/
RUN mkdir ./templates && \
    mv ./static/index.html ./templates/ && \
    mv ./static/manifest.json ./ && \
    mv ./static/favicon.ico ./ 

COPY ./*.py ./

#CMD python3 /app/flask_backend/main.py
#CMD . venv/bin/activate && FLASK_APP=main.py python3 -m flask run
# CMD python3 main.py
CMD gunicorn -b 5000 main:app