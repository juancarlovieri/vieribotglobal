docker build -t vieribot .
docker run -d --mount source=vieribot,target=/usr/src/bot/Discord/datas/ vieribot