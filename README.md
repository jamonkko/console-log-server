# console-log-server
Logs all requests to command line console (stdout) and responds 200 OK.

Useful for quickly viewing what kind of requests your app is sending.

## Usage

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
    --no-color
    --version
    --help

  Examples
    $ console-log-server -p 3000
```
