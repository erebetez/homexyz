FROM postgres:12-alpine

VOLUME /var/lib/postgresql/data

FROM postgres
ENV POSTGRES_DB homez
COPY setup/* /docker-entrypoint-initdb.d/

EXPOSE 5432
CMD ["postgres"] 
