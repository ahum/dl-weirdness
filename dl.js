const _ = require("lodash");
const debug = require("debug");
const fetch = require("node-fetch");
const { exec } = require("child_process");
const count = 10;
const BPromise = require("bluebird");

const testText = _.times(100)
  .map(
    n => `This is test text ${n}
`
  )
  .join("");

const log = debug("dl");

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

  await logRun("serialCurl", () => series(counts.map(n => () => curl(n))));

  await logRun("parallelWithFetch", () =>
    Promise.all(counts.map(n => withFetch(n)))
  );

  await logRun("bluebirdWithFetch", () =>
    BPromise.all(counts.map(n => withFetch(n)))
  );
};

run().catch(e => console.error(e));
