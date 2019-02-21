const _ = require("lodash");
const count = process.argv[2] || 80;
const http = require("http");

console.log("count:", count);
require("http").globalAgent.maxSockets = Infinity;

const nHttp = () => {
  return new Promise((resolve, reject) => {
    http
      .get(URL, res => {
        const { statusCode } = res;
        const contentType = res.headers["content-type"];

        let error;
        if (statusCode !== 200) {
          error = new Error("Request Failed.\n" + `Status Code: ${statusCode}`);
        } else if (!/^application\/json/.test(contentType)) {
          error = new Error(
            "Invalid content-type.\n" +
              `Expected application/json but received ${contentType}`
          );
        }
        if (error) {
          console.error(error.message);
          // consume response data to free up memory
          res.resume();
          return;
        }

        res.setEncoding("utf8");
        let rawData = "";
        res.on("data", chunk => {
          rawData += chunk;
        });
        res.on("end", () => {
          try {
            const parsedData = JSON.parse(rawData);
            resolve(parsedData);
            // console.log(parsedData);
          } catch (e) {
            reject(e);
            // console.error(e.message);
          }
        });
      })
      .on("error", e => {
        reject(e);
      });
  });
};

const series = arr => {
  return arr.reduce((acc, pf) => {
    return acc.then(r => {
      return pf().then(pr => [...r, pr]);
    });
  }, Promise.resolve([]));
};

const URL = "http://www.mocky.io/v2/5c6e99593400005200892dde";


const logRun = async (n, fn) => {
  console.log(n, "...");
  console.time(n);
  const result = await fn();
  console.timeEnd(n);
  return result;
};

const run = async () => {
  const counts = _.times(count);

  await logRun("serialHttp", () => series(counts.map(n => () => nHttp(n))));
  await logRun("parallelHttp", () => Promise.all(counts.map(n => nHttp(n))));

};

run().catch(e => console.error(e));
