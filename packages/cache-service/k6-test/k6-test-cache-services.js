// import { group } from "k6";
// import { check } from "k6";
import http from "k6/http";
// import { Trend } from "k6/metrics";
// import { Trend /*, Rate, Counter */ } from "k6/metrics";
// import { Counter } from "k6/metrics";

const cachServicesURL = [
  "https://cache-service-direct-1.a.redstone.finance",
  "https://cache-service-direct-2.a.redstone.finance",
  "https://cache-service-streamr-1.a.redstone.finance",
  "http://3.127.215.221",
];

// const TrendArray = [cachServicesURL.size()];

// for (let i=0; i<cacheServicesURL.size(); i++) {
//   TrendArray[i] = new Trend(waiting_time_for_)

// }

// const myTrend = new Trend("accumulated_waiting_time_cs?");
// // // const myCounter = new Counter("total_time_cs1");
// export const TrendRTT = new Trend("RTT");

// export const RateContentOK = new Rate("Content OK");
// export const CounterErrors = new Counter("Errors");

// import { sleep } from "k6";
export const options = {
  // vus: 10,
  // duration: "30s",
  stages: [
    { duration: "10s", target: 100 }, // simulate ramp-up of traffic from 1 to 100 users over 10 seconds.
    { duration: "10s", target: 100 }, // stay at 100 users for 10 seconds.
    { duration: "5s", target: 0 }, // ramp-down to 0 users
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"], // http errors should be less than 1%
    // 'http_req_duration{type:API}': ['p(95)<500'], // threshold on API requests only
    // 90% of requests must finish within 200ms, 95% within 300ms, and 99.9% within 1s.
    http_req_duration: ["p(90) < 200", "p(95) < 300", "p(99.9) < 1000"],
  },
  // stages: [
  //   { duration: '30s', target: 20 },
  //   { duration: '1m30s', target: 10 },
  //   { duration: '20s', target: 0 },
  // ],
};

// let res1Time = 0.0;

// batch() to send parallel requests
// export default function () {
//   let res1 = http.get("https://cache-service-direct-1.a.redstone.finance");
//   check(res1, {
//     "is status 200": (r) => r.status === 200,
//   });
//   myTrend.add(res1.timings.waiting);
//   TrendRTT.add(res1.timings.duration);
//   // myCounter.add(1);
//   // console.log(myTrend.name);
//   // check(res, { 'status was 200': (r) => r.status == 200 });
//   // console.log(`Response time for cache service 1: ${res1.timings.duration}`);
//   // console.log(typeof res1.timings.duration);
//   // res1Time += res1.timings.duration;
//   // sleep(1);

//   let res2 = http.get("https://cache-service-direct-2.a.redstone.finance");
//   // console.log(`Response time for cache service 2: ${res2.timings.duration}`);

//   let res3 = http.get("https://cache-service-streamr-1.a.redstone.finance");
//   // console.log(`Response time for cache service 3: ${res3.timings.duration}`);

//   let res4 = http.get("http://3.127.215.221");
//   // console.log(`Response time for cache service 4: ${res4.timings.duration}`);
// }

// console.log(`Total response time for cache service 1: ${res1Time}`);
// k6 run --vus 10 --duration 30s script.js

// export default function () {
//   // let res = http.get(cachServicesURL[0]);
//   for (const cacheServiceURL of cachServicesURL) {
//     group(cachServicesURL, function () {
//       http.get(cacheServiceURL);
//       // check(res, {
//       //   "is status 200": (r) => r.status === 200,
//       // });
//       // myTrend.add(res.timings.waiting);
//       // TrendRTT.add(res.timings.duration);
//     });
//   }
// }
export default function () {
  for (const cacheServiceURL of cachServicesURL) {
    // group(cachServicesURL, function () {
    /*const res =*/ http.get(cacheServiceURL);
    // check(res, {
    //   "is status 200": (r) => r.status === 200,
    // });
    // myTrend.add(res.timings.waiting);
    // TrendRTT.add(res.timings.duration);
    // });
  }
}
