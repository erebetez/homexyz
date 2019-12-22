 #!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER homez with password 'homez123';
    GRANT ALL PRIVILEGES ON DATABASE homez TO homez;
EOSQL
