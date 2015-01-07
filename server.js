var express = require("express");
var path = require("path");
var port = process.env.PORT || '8080';

app = express();

app.use(express.static(path.resolve(__dirname + '/mockup')));
app.use(require('prerender-node')).set('protocol', 'https');

app.use('/', function (req, res) {
  res.sendFile(path.resolve(__dirname + '/index.html'));
});

app.listen(port, function () {
  console.log('Server Listen on', port);
});