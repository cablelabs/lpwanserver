FROM ruby:latest

WORKDIR /app

RUN gem install sequel pg sqlite3

ARG DB_FILE
ARG POSTGRES_USER

ENV DB_FILE ${DB_FILE}
ENV POSTGRES_HOST=localhost

COPY ./$DB_FILE .
COPY ./transfer.sh .

RUN useradd -ms /bin/bash $POSTGRES_USER
USER $POSTGRES_USER

CMD sh transfer.sh