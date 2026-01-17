# Websites of Bára Černá

At the moment, just simple static content.

## License

See [LICENSE](LICENSE). In short: all rights reserved; no permission is granted to reuse repository contents.
In particular, images and audio (MP3) are not licensed for reuse without a separate written license.

---


### Local development

```
Run
node local-webserver.js [STATIC_PATH]

Examples:
node local-webserver.js ./static
node local-webserver.js ./baracerna.cz
node local-webserver.js ./baracerna.com
```


Other option is to use following package
```
npm install -g local-web-server
```

### Adding SSL using Lets Encrypt - Apache
* set DNS record to the destination server
* create `.conf` file for Apache, serving html version
* install Certbot
```
apt-get update
apt-get install certbot
apt-get install python3-certbot-nginx
```
* call certbot to do the rest
```
certbot --apache
```
It will show you all domains at local server, served by Apache. You just select the domain for which you need SSL.
It will reconfigure Apache to make it working. (Based on `domainName.conf`, it will create `domainName-le-ssl.conf` for https version and add redirects as well.)

```
# check you have renewal timer activated
systemctl status certbot.timer
# check that renewal will work
certbot renew --dry-run
#or manually renew after 90 days by
certbot renew
certbot renew --quiet
```

* [Lets encrypt/certbot documentation](https://certbot.eff.org/docs/)