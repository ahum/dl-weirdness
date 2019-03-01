var http = require("http");

var results = [];
const maxSockets = process.argv[3] || Infinity;

require("http").globalAgent.maxSockets = maxSockets;
const count = process.argv[2] || 80;
const URL = "http://www.mocky.io/v2/5c6e99593400005200892dde";
console.log("count:", count);
console.log("maxSockets:", maxSockets);
console.time("loop");

const opts = {
  headers: {
    Connection: "Close"
  }
};

const run = (label, agent, done) => {
  var j = 0;
  console.log(`\n${label}...`);
  console.time(label);

  for (i = 0; i < count; i++) {
    //const keepAliveAgent = new http.Agent({ keepAlive: true });

    let a = typeof agent === "function" ? agent() : agent;
    //agent = agentType === 'none' ? false : agentType === 'new' ? new http.Agent({keepAlive: true})
    http
      .get(URL, { agent: a }, function(res) {
        // console.log(j);
        results.push(res.statusCode);
        j++;

        if (j == i) {
          // last request
          console.timeEnd(label);
          done();
        }
      })
      .end();
  }
};

run("agent:false", false, () => {
  run("agent:undefined", undefined, () => {
    run(
      "agent:new:keepAlive:true",
      () => new http.Agent({ keepAlive: true }),
      () => {
        run(
          "agent:new:keepAlive:false",
          () => new http.Agent({ keepAlive: false }),
          () => {
            process.exit(0);
          }
        );
      }
    );
  });
});
