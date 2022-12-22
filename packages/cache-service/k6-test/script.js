import http from "k6/http";
import { sleep } from "k6";

/* 
  vus -> Virtual Users, defines how many users make HTTP requests
  iterations -> defines how many each vus make HTTP requests
  executor -> defines how vus and iterations are scheduled, more: https://k6.io/docs/using-k6/scenarios/executors/
*/

export const options = {
  scenarios: {
    firstPublicCacheScenario: {
      executor: "ramping-vus",
      exec: "firstPublicCacheTest",
      // vus: 1000,
      // iterations: 100,
      // startTime: "0s",
      // maxDuration: "10m",
      stages: [
        { duration: "10s", target: 100 }, // below normal load
        { duration: "1m", target: 100 },
        { duration: "10s", target: 1400 }, // spike to 1400 users
        { duration: "3m", target: 1400 }, // stay at 1400 for 3 minutes
        { duration: "10s", target: 100 }, // scale down. Recovery stage.
        { duration: "3m", target: 100 },
        { duration: "10s", target: 0 },
      ],
    },
    secondPublicCacheScenario: {
      executor: "ramping-vus",
      exec: "secondPublicCacheTest",
      // vus: 1000,
      // iterations: 100,
      // startTime: "5m",
      // maxDuration: "10m",
      stages: [
        { duration: "10s", target: 100 }, // below normal load
        { duration: "1m", target: 100 },
        { duration: "10s", target: 1400 }, // spike to 1400 users
        { duration: "3m", target: 1400 }, // stay at 1400 for 3 minutes
        { duration: "10s", target: 100 }, // scale down. Recovery stage.
        { duration: "3m", target: 100 },
        { duration: "10s", target: 0 },
      ],
    },
    firstStreamrCacheScenario: {
      executor: "ramping-vus",
      exec: "firstStreamrCacheTest",
      // vus: 1000,
      // iterations: 100,
      // startTime: "10m",
      // maxDuration: "10m",
      stages: [
        { duration: "10s", target: 100 }, // below normal load
        { duration: "1m", target: 100 },
        { duration: "10s", target: 1400 }, // spike to 1400 users
        { duration: "3m", target: 1400 }, // stay at 1400 for 3 minutes
        { duration: "10s", target: 100 }, // scale down. Recovery stage.
        { duration: "3m", target: 100 },
        { duration: "10s", target: 0 },
      ],
    },
    secondStreamrCacheScenario: {
      executor: "ramping-vus",
      exec: "secondStreamrCacheTest",
      // vus: 1000,
      // iterations: 100,
      // startTime: "15m",
      // maxDuration: "10m",
      stages: [
        { duration: "10s", target: 100 }, // below normal load
        { duration: "1m", target: 100 },
        { duration: "10s", target: 1400 }, // spike to 1400 users
        { duration: "3m", target: 1400 }, // stay at 1400 for 3 minutes
        { duration: "10s", target: 100 }, // scale down. Recovery stage.
        { duration: "3m", target: 100 },
        { duration: "10s", target: 0 },
      ],
    },
  },
};

export const firstPublicCacheTest = () => {
  http.get("https://cache-service-direct-1.a.redstone.finance");
  sleep(1);
};

export const secondPublicCacheTest = () => {
  http.get("https://cache-service-direct-2.a.redstone.finance");
  sleep(1);
};

export const firstStreamrCacheTest = () => {
  http.get("https://cache-service-streamr-1.a.redstone.finance");
  sleep(1);
};

export const secondStreamrCacheTest = () => {
  http.get("http://3.127.215.221");
  sleep(1);
};
