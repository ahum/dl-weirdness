var http = require("http");

var results = [];
var j = 0;

require("http").globalAgent.maxSockets = 2; //Infinity;
const count = process.argv[2] || 80;
const URL = "http://www.mocky.io/v2/5c6e99593400005200892dde";
//const URL = "http://google.com";
console.log("count:", count);
console.time("loop");
// Make 1000 parallel requests:
for (i = 0; i < count; i++) {
  //const keepAliveAgent = new http.Agent({ keepAlive: true });
  http
    .get(
      URL,
      {
        headers: {
          Connection: "Close"
        }
      },
      function(res) {
        console.log(j);
        results.push(res.statusCode);
        j++;

        if (j == i) {
          // last request
          console.timeEnd("loop");
          process.exit();
          //console.log(JSON.stringify(results));
        }
      }
    )
    .end();
}
