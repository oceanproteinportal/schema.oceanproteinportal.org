# Start from scratch image and add in a precompiled binary
# docker build  --tag="oceanproteinportal/vocab:0.1.2"  .
# docker run -d -p 9900:9900 oceanproteinportal/vocab:latest
FROM scratch

# Add in the static elements (could also mount these from local filesystem)
# later as the indexes grow
ADD schema /
ADD ./html/ ./html

# Add our binary
CMD ["/schema"]

# Document that the service listens on this port
EXPOSE 9900
