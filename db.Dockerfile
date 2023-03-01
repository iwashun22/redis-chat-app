FROM --platform=linux/x86_64 redis:6.2.7

RUN apt-get update
RUN apt-get install -y locales curl
RUN locale-gen en_US.UTF-8
RUN localedef -f UTF-8 -i en_US en_US
USER redis
ENV LANG=en_US.UTF-8
ENV TZ=Asia/Bangkok

CMD ["mkdir", "-p", "data"]