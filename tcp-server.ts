import { copy } from "https://deno.land/std@0.106.0/io/util.ts";
const hostname = "0.0.0.0";
const port = 8080;
const listener = Deno.listen({ hostname, port });
console.log(`Listening on ${hostname}:${port}`);
for await (const conn of listener) {
  console.log("hello world -- someone pinged me");
  copy(conn, conn);
}
// will fail without --allow-net
