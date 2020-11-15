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
  Usage
    $ console-log-server

  Options
    --port, -p Port Number
    --hostname, -h Host name
    --result-code, -c Response result code
    --result-body, -b Response content
    --result-header, -H Response header
    --no-color
    --version
    --help

  Examples

    # basic usage
    $ console-log-server -p 3000

    # customized response
    $ console-log-server -p 3000 -c 201 -b 'cool type content' --result-header='Content-Type:application/cool' --result-header='key:value'
```
