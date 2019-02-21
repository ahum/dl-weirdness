const { Storage } = require("@google-cloud/storage");
const { google } = require("googleapis");
const _ = require("lodash");
const debug = require("debug");
const fetch = require("node-fetch");
const { exec } = require("child_process");
const bucketName = "dl-test-bucket";
const count = 20;

var BPromise = require("bluebird");

const testText = _.times(100)
  .map(
    n => `This is test text ${n}
`
  )
  .join("");

const resetBucket = async b => {
  const [exists] = await b.exists();
  if (exists) {
    await b.deleteFiles();
    // await b.delete();
    return;
  }

  await b.create();
  return;
};

const log = debug("dl-test");
const series = arr => {
  return arr.reduce((acc, pf) => {
    return acc.then(r => {
      console.log("series run...");
      return pf().then(pr => [...r, pr]);
    });
  }, Promise.resolve([]));
};

const getUrl = u => {
  return "http://www.mocky.io/v2/5c6e99593400005200892dde";
  //return u;
};
const withFetch = async (filename, bucketName, accessToken) => {
  // curl \
  // 'https://www.googleapis.com/storage/v1/b/dl-test-bucket/o/test-file-0.txt' \
  // --header 'Authorization: Bearer [YOUR_ACCESS_TOKEN]' \
  // --header 'Accept: application/json' \
  // --compressed
  const url = `https://www.googleapis.com/storage/v1/b/${bucketName}/o/${filename}`;
  log(filename, "fetch - start");

  return fetch(getUrl(url), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    }
  }).then(r => {
    log(filename, "fetch - done");
    return r.json();
  });
};

const curl = (filename, bucketName, accessToken) => {
  const u = `https://www.googleapis.com/storage/v1/b/${bucketName}/o/${filename}`;
  const url = getUrl(u);
  log(filename, "curl - start");
  return new Promise((resolve, reject) => {
    const cmd = `curl \
   '${url}' \
   --header 'Authorization: Bearer ${accessToken}' \
   --header 'Accept: application/json' \
   --compressed`;
    exec(cmd, (err, stdout) => {
      if (err) {
        reject(err);
      } else {
        log(filename, "curl - done");
        resolve(JSON.parse(stdout));
      }
    });
  });
};
// const batch = () => {

//   google.storage("v1").objects.
// }

const handrolled = async (filename, auth, bucket) => {
  const result = await google
    .storage("v1")
    .objects.get({ object: filename, auth, bucket });
  return result;
};

const logRun = async (n, fn) => {
  console.time(n);
  const result = await fn();
  console.timeEnd(n);
  return result;
};

const run = async () => {
  const s = new Storage({ projectId: process.env.PROJECT_ID });

  const accessToken = await s.authClient.getAccessToken();
  console.log("token:", accessToken);
  console.log("projectId:", await s.authClient.getProjectId());
  // const b = s.bucket(bucketName);
  // console.log("resetting bucket");
  // await resetBucket(b);
  const filenames = _.times(count).map(n => `test-file-${n}.txt`);
  // console.log("running...");
  // console.time("save");
  // // was using parallel but has the same issue as below..
  // const saved = await series(
  //   filenames.map(n => async () => {
  //     const f = b.file(n);
  //     await f.save(testText);
  //     return f;
  //   })
  // );
  // console.timeEnd("save");

  // console.time("serialGet");

  // const serialResult = await series(filenames.map(p => () => b.file(p).get()));
  // console.timeEnd("serialGet");

  console.time("serialFetch");

  const sr = await series(filenames.map(p => () => withFetch(p)));

  console.timeEnd("serialFetch");

  console.time("serialCurl");
  const sc = await series(filenames.map(p => () => curl(p)));
  console.timeEnd("serialCurl");

  // console.time("parallelHandrolled");
  // const parallelHandrolled = await Promise.all(
  //   filenames.map(p => handrolled(p, s.authClient, bucketName))
  // );
  // console.timeEnd("parallelHandrolled");

  logRun("parallelWithFetch", () =>
    Promise.all(filenames.map(p => withFetch(p, bucketName, accessToken)))
  );
  logRun("bluebirdWithFetch", () =>
    BPromise.all(filenames.map(p => withFetch(p, bucketName, accessToken)))
  );

  // console.time("parallelWithFetch");
  // const parallelWithFetch = await Promise.all(
  //   filenames.map(p => withFetch(p, bucketName, accessToken))
  // );
  // console.timeEnd("parallelWithFetch");

  // console.time("parallelWithFetch");
  // const parallelWithFetch = await Promise.all(
  //   filenames.map(p => withFetch(p, bucketName, accessToken))
  // );
  // console.timeEnd("parallelWithFetch");
  // console.time("parallelWithCurl");
  // const parallelWithCurl = await Promise.all(
  //   filenames.map(p => curl(p, bucketName, accessToken))
  // );
  // console.timeEnd("parallelWithCurl");

  // console.time("parallelGet");

  // const parallelResult = await Promise.all(filenames.map(p => b.file(p).get()));
  // console.timeEnd("parallelGet");
};

run().catch(e => console.error(e));
