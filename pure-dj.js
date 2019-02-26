var http = require("http");

var results = [];
var j = 0;

//require("http").globalAgent.maxSockets = 2; //Infinity;
const count = process.argv[2] || 80;
const URL = "http://www.mocky.io/v2/5c6e99593400005200892dde";
console.log("count:", count);
console.time("loop");

const opts = {
  headers: {
    Connection: "Close"
  }
};

for (i = 0; i < count; i++) {
  //const keepAliveAgent = new http.Agent({ keepAlive: true });
  http
    .get(URL, { agent: false }, function(res) {
      console.log(j);
      results.push(res.statusCode);
      j++;

      if (j == i) {
        // last request
        console.timeEnd("loop");
        process.exit();
      }
    })
    .end();
}
