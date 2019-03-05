FROM ruby:latest

WORKDIR /app

RUN gem install sequel pg sqlite3

COPY ./db.sqlite3 .

RUN useradd -ms /bin/bash prisma
USER prisma

CMD ["sequel", "-C", "sqlite://db.sqlite3", "postgres://localhost/prisma"]