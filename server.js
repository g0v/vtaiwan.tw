var express = require("express");
var path = require("path");
var port = process.env.PORT || '8080';

app = express();

// Enable CORS, set up UTF-8 encoding
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,If-Modified-Since');
  res.header('Access-Control-Allow-Methods', 'GET');
  if ((req != null ? req.method : void 8) === 'OPTIONS') { return res.send(204); }
  if (/.*\.js$/.test(req.path)) { res.type('application/javascript; charset=UTF-8'); }
  if (/.*\.json$/.test(req.path)) { res.type('application/json; charset=UTF-8'); }
  if (/.*\.html$/.test(req.path)) { res.type('text/html; charset=UTF-8'); }
  next();
});
app.use(express.static(path.resolve(__dirname + '/mockup')));
app.use(require('prerender-node')).set('protocol', 'https');

app.use('/', function (req, res) {
  res.type('text/html; charset=UTF-8');
  res.sendFile(path.resolve(__dirname + '/index.html'));
});

app.listen(port, function () {
  console.log('Server Listen on', port);
});
