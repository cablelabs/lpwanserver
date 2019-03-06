FROM ruby:latest

WORKDIR /app

RUN gem install sequel pg sqlite3

ARG DB_FILE=db-schema.sqlite3
ARG POSTGRES_USER=prisma

ENV DB_FILE ${DB_FILE}
ENV POSTGRES_HOST=localhost
ENV DATABASE=lpwanserver

COPY ./$DB_FILE .
COPY ./transfer.sh .

RUN useradd -ms /bin/bash $POSTGRES_USER
USER $POSTGRES_USER

# CMD sequel -C sqlite://${DB_FILE} postgres://${POSTGRES_HOST}/${DATABASE}

CMD sh transfer.sh