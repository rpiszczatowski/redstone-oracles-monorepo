import http from "k6/http";

export default function () {
  let res1 = http.get("https://cache-service-direct-1.a.redstone.finance");
  console.log(`Response time for cache service 1: ${res1.timings.duration}`);

  let res2 = http.get("https://cache-service-direct-2.a.redstone.finance");
  console.log(`Response time for cache service 2: ${res2.timings.duration}`);

  let res3 = http.get("https://cache-service-streamr-1.a.redstone.finance");
  console.log(`Response time for cache service 3: ${res3.timings.duration}`);

  let res4 = http.get("http://3.127.215.221");
  console.log(`Response time for cache service 4: ${res4.timings.duration}`);
}
