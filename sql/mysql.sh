#!/bin/sh

docker start esc-mysql
docker exec -it esc-mysql mysql --password=sudipta

