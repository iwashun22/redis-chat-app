FROM --platform=linux/x86_64 node:18.8.0

RUN apt-get update
RUN apt-get install -y locales tmux curl
RUN locale-gen en_US.UTF-8
RUN localedef -f UTF-8 -i en_US en_US

ENV LANG=en_US.UTF-8
ENV TZ=Asia/Bangkok

WORKDIR /app