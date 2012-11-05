var app, clientID, clientSecret, connect, express, fs, gdataClient, querystring, request, scope, token;

request = require("request");
querystring = require("querystring");
fs = require("fs");

clientID = process.argv[2];
clientSecret = process.argv[3];

if (!(clientID && clientSecret)) {
  console.error("usage: node test.js <clientID> <clientSecret>");
  process.exit(1);
}

gdataClient = require("./gdata")(clientID, clientSecret, "http://localhost:8553/");
scope = "https://www.googleapis.com/auth/drive";
express = require("express");
connect = require("connect");

app = express.createServer(connect.bodyParser());

token = void 0;

app.get("/", function(req, res) {
  return gdataClient.getAccessToken({
    scope: scope,
    access_type: "offline",
    approval_prompt: "force"
  }, req, res, function(err, _token) {
    if (err) {
      console.error("oh noes!", err);
      res.writeHead(500);
      return res.end("error: " + JSON.stringify(err));
    } else {
      token = _token;
      console.log("got token:", token);
      return res.redirect("/getStuff");
    }
  });
});

app.get("/getStuff", function(req, res) {
  var params;
  params = {
    key: "AIzaSyAN_8wdN-q8lVhAeQm47mrtaTWMXsBeYuU"
  };
  return gdataClient.getFeed("https://www.googleapis.com/drive/v2/files?key=AIzaSyAN_8wdN-q8lVhAeQm47mrtaTWMXsBeYuU", {}, function(err, feed) {
    var doc, i, _results;
    console.log("Error" + err);
    console.log("Feed" + feed);
    i = 0;
    _results = [];
    while (i < feed.items.length) {
      doc = feed.items[i];
      console.log(doc.title);
      res.write(JSON.stringify(doc.title));
      res.write("\n\n");
      _results.push(i++);
    }
    return _results;
  });
});

app.get("/refresh", function(req, res) {
  console.log("forcing refresh...");
  return gdataClient._refreshToken(function(err, result) {
    console.log("err,", err);
    console.log("result,", result);
    return console.log("token,", token);
  });
});

gdataClient.on("tokenRefresh", function() {
  return console.log("token refresh!", token);
});

app.listen(process.argv[4] || 8553);

console.log("open http://localhost:8553");
