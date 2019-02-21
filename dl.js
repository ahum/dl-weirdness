const _ = require("lodash");
const debug = require("debug");
const fetch = require("node-fetch");
const { exec } = require("child_process");
const count = 20;
const http = require("http");

const BPromise = require("bluebird");

const testText = _.times(100)
  .map(
    n => `This is test text ${n}
`
  )
  .join("");

const log = debug("dl");

const dummy = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 300);
  });
};

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

const withFetch = async count => {
  log(count, "fetch - start");

  return fetch(URL, {
    headers: {
      Accept: "application/json"
    }
  }).then(r => {
    log(count, "fetch - done");
    return r.json();
  });
};

const curl = count => {
  log(count, "curl - start");
  return new Promise((resolve, reject) => {
    const cmd = `curl \
   '${URL}' \
   --header 'Accept: application/json'`;
    exec(cmd, (err, stdout) => {
      if (err) {
        reject(err);
      } else {
        log(count, "curl - done");
        resolve(JSON.parse(stdout));
      }
    });
  });
};

const logRun = async (n, fn) => {
  console.log(n, "...");
  console.time(n);
  const result = await fn();
  console.timeEnd(n);
  return result;
};

const run = async () => {
  const counts = _.times(count);

  await logRun("serialFetch", () =>
    series(counts.map(n => () => withFetch(n)))
  );

  await logRun("dummy", () => Promise.all(counts.map(n => dummy(n))));

  await logRun("serialCurl", () => series(counts.map(n => () => curl(n))));
  await logRun("parallelCurl", () => Promise.all(counts.map(n => curl(n))));
  await logRun("parallelHttp", () => Promise.all(counts.map(n => nHttp(n))));

  // await logRun("parallelWithFetch", () =>
  //   Promise.all(counts.map(n => withFetch(n)))
  // );

  // await logRun("bluebirdWithFetch", () =>
  //   BPromise.all(counts.map(n => withFetch(n)))
  // );
};

run().catch(e => console.error(e));
