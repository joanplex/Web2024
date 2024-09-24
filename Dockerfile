FROM mysql:latest

# Set environment variables
ENV MYSQL_DATABASE=disaster_relief
ENV MYSQL_ROOT_PASSWORD=Triwnierarxwn15!
ENV MYSQL_TCP_PORT=3306

COPY ./init.sql /docker-entrypoint-initdb.d/

# Expose the custom MySQL port
EXPOSE 3306