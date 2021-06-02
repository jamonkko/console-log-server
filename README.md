# console-log-server

Logs all requests to command line console (stdout) and responds 200 OK.

Useful for quickly viewing what kind of requests your app is sending.

## Usage

```sh
$ npx console-log-server -p 8000
```

or using the old fashioned way

```sh
$ npm install console-log-server --global
$ console-log-server -p 8000
```

<p align="center">
  <img src="./resources/console-log-server-demo.gif" alt="Demo" width="700"/> 
</p>

## Command line options

```sh
  Logs all http requests to console

  Usage
    $ console-log-server

  Options
    --port, -p Port Number
    --hostname, -h Host name. You can provide multiple hostname flags (with optional matching port flags) to listen many hostnames. 
    --proxy, -P Host(s) to proxy the request to using https://www.npmjs.com/package/express-http-proxy. Syntax: [<path>>]<url>. You can provide different proxies for separate paths.
    --response-code, -c Response response code (ignored if proxied)
    --response-body, -b Response content (ignored if proxied)
    --response-header, -H Response header (ignored if proxied)
    --log-response, -r Log also the response. Enabled by default only for proxied requests. Logged response is fully read to a buffer which might change your api behaviour since response is not streamed directly to client, consider turning off if that is a problem.
    --no-color
    --version
    --date-format, -d Date format supported by https://www.npmjs.com/package/dateformat (default "yyyy-mm-dd'T'HH:MM:sso")
    --help
    --default-cors, -C Add "default" cors using https://www.npmjs.com/package/cors default values. By default only enabled for non-proxied responses. Turn on to enable also for proxy responses, turn off to disable completely.

  Examples

    # basic usage
    $ console-log-server -p 3000

    # customized response
    $ console-log-server -p 3000 -c 201 -b "cool type content" --response-header='Content-Type:application/cool' --response-header='key:value'

    # Log date with UTC date format instead of local with offset
    $ console-log-server -d "isoUtcDateTime"

    # Proxy the request to other host. Response will be the actual response from the proxy. 
    $ console-log-server -P http://api.example.com

    # Proxy the requests to multiple hosts based on paths.
    $ console-log-server --proxy="/api/1>http://api-1.example.com" --proxy="/api/2>http://api-2.example.com"

    # Proxy the request to path under other host. Response will be the actual response (with cors headers injected) from the proxy.
    $ console-log-server -P http://api.example.com/v1/cats -C yes

    # Turn off response logging
    $ console-log-server -r no

    # Turn on response logging for all requests
    $ console-log-server -r yes

    # Don't add default (allow all) cors headers at all
    $ console-log-server -C no

    # Start server to your local IP and localhost. Might be useful when debugging devices connected to your own machine. Ports can be given for each hostname with --port flag(s).
    $ console-log-server -h localhost -h 192.168.0.2 
```
