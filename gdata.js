var EventEmitter, doPost, oauthBase, querystring, request;

doPost = function(body, callback) {
  var options;
  options = {
    method: "POST",
    uri: "https://accounts.google.com/o/oauth2/token",
    form: body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  };
  console.log(options);
  return request(options, function(error, response, body) {
    console.log(response.statusCode);
    if (!error && response.statusCode === 200) {
      return callback(null, JSON.parse(body));
    } else if (error) {
      return callback(error, null);
    } else {
      console.error("Unknown error - Data:", body.toString());
      return callback(body.toString);
    }
  });
};

querystring = require("querystring");

request = require("request");

EventEmitter = require("events").EventEmitter;

oauthBase = "https://accounts.google.com/o/oauth2";

module.exports = function(client_id, client_secret, redirect_uri) {
  var client, clientID, clientSecret, doRequest, redirectURI, refreshToken, token;
  doRequest = function(url, params, callback) {
    var options;
    options = {
      method: "GET",
      uri: url,
      headers: {
        Authorization: "Bearer " + params.oauth_token
      }
    };
    return request(options, function(error, response, body) {
      var docList;
      if (response.statusCode === 200) {
        docList = JSON.parse(body);
        return callback(null, JSON.parse(body));
      } else {
        console.log("error: " + response.statusCode);
        return callback(error, null);
      }
    });
  };
  refreshToken = function(callback) {
    console.log("calling doPost from get refresh access token");
    return doPost({
      client_id: clientID,
      client_secret: clientSecret,
      refresh_token: token.refresh_token,
      grant_type: "refresh_token"
    }, function(err, result) {
      if (err || !result || !result.access_token) {
        console.error("err", err);
        console.error("result", result);
      }
      return callback(err, result);
    });
  };
  clientID = client_id;
  clientSecret = client_secret;
  redirectURI = redirect_uri;
  token = void 0;
  client = new EventEmitter();
  client.getAccessToken = function(options, req, res, callback) {
    var height, resp, width;
    if (req.query.error) {
      return callback(req.query.error);
    } else if (!req.query.code) {
      options.client_id = clientID;
      options.redirect_uri = options.redirect_uri || redirectURI;
      options.response_type = "code";
      var direct = options.direct;
      options.direct = undefined;
      if (direct) {
        return res.redirect(oauthBase + "/auth?" + querystring.stringify(options));
      } else {
        height = 750;
        width = 980;
        resp = "<script type='text/javascript'>" + "var left= (screen.width / 2) - (" + width + " / 2);" + "var top = (screen.height / 2) - (" + height + " / 2);" + "window.open('" + oauthBase + "/auth?" + querystring.stringify(options) + "', 'auth', 'menubar=no,toolbar=no,status=no,width=" + width + ",height=" + height + ",toolbar=no,left=' + left + 'top=' + top);" + "</script>";
        return res.end(resp + "<a target=_new href='" + oauthBase + "/auth?" + querystring.stringify(options) + "'>Authenticate</a>");
      }
    } else {
      return doPost({
        grant_type: "authorization_code",
        code: req.query.code,
        client_id: clientID,
        client_secret: clientSecret,
        redirect_uri: redirectURI
      }, function(err, tkn) {
        if (!err && tkn && !tkn.error) {
          token = tkn;
        }
        return callback(err, tkn);
      });
    }
  };
  client.setToken = function(tkn) {
    return token = tkn;
  };
  client.getFeed = function(url, params, callback) {
    if (!callback && typeof params === "function") {
      callback = params;
      params = {};
    }
    params.oauth_token = token.access_token;
    return doRequest(url, params, function(err, body) {
      return callback(err, body);
    });
  };
  client._refreshToken = refreshToken;
  return client;
};
