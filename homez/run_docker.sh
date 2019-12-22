sudo docker run --rm -P -e POSTGRES_PASSWORD=post123 --name homez_test homez

sudo docker run --rm -d -e POSTGRES_PASSWORD=post123 -v $HOME/docker/volumes/postgres:/var/lib/postgresql/data --name homez_test homez
 
