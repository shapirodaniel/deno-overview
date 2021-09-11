# Deno: A Secure JavaScript and TypeScript Runtime

<br/>

# Config and Setup (VS Code)

<details>
  <summary>Installation, VS Code Integration, CLI Completion</summary><br/>

## Installation

Download instructions can be found [here](https://deno.land/manual@v1.13.2/getting_started/installation)
<br/><br/>

## Language Server Integration (VS Code)

Install the
[Deno VS Code language server extension](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno)

<code>ctrl + shift + p</code> to launch search, navigate to <code>Deno:
Initialize Workspace Configuration</code> to enable Deno namespace and url
imports

Note: it's not recommended to initialize these settings globally
<br/><br/>

## PowerShell Deno CLI Completions

Open PowerShell and run the following command, replacing the path to your system
powershell_profile.ps1

<code>deno completions powershell >
[path-to-system-powershell_profile.ps1-directory]/deno.ps1</code>

Then invoke the script in your <code>Microsoft.PowerShell_profile.ps1</code>

</details>
<br/>

# Security

<details>
  <summary>Intro to Deno sandbox and permissions</summary><br/>
Deno is secure by default, meaning that we'll need to grant explicit permissions for any privileged actions -- for instance, a web request

This command will fail without the <code>--allow-net</code> flag

deno run https://deno.land/std@0.106.0/examples/curl.ts https://example.com > ./web-response.html

Launch the fetched markup with live-server to check it out\

</details>
<br/>

# Deno namespace

<details>
  <summary>Key built-in APIs</summary><br/>

```typescript
function Deno.chdir(directory: string | URL): void {}
Deno.chdir("/home/userA") // equivalent to ls | Set-Location

function Deno.chmod(path: string | URL, mode: number): Promise<void> {}
// change permission of specific file/dir of specified path
await Deno.chmod("/path/to/file", 0o666) // where second arg is structured
/*
  mode: sequence of three octal numbers
  0o <owner-group-others>
  ex, 0o751, owner has read/write/execute, group has read/execute, others have execute only
  note: throws on Windows, requires --allow-write permission
*/

function Deno.close(rid: number): void {}
// close a given resource ID to avoid memory leaks
const file = await Deno.open("my_file.txt")
// do work with file object
Deno.close(file.rid)

function Deno.create(path: string | URL): Promise<File> {}
// create a file or truncate an existing file and resolve to an instance of Deno.File
const file = await Deno.create("/foo/bar.txt")
// requires --allow-read, --allow-write privileges

function Deno.exit(code?: number): never {}
// TypeScript never: function will not return to its end point or will always throw an exception {}
// Exit the Deno process with optional exit code; no code specified == 0
Deno.exit(1)

function Deno.fdatasync(rid: number): Promise<void> {}
// flush pending data ops of given file stream to disk
const file = await Deno.open("my_file.txt", { read: true, write: true, create: true });
await Deno.write(file.rid, new TextEncoder().encode("Hello World"));
await Deno.fdatasync(file.rid);
console.log(new TextDecoder().decode(await Deno.readFile("my_file.txt"))); // Hello World

function Deno.inspect(value: unknown, options?: InspectOptions): string {}
// convert input into string formatted like console.log() output
const obj = {
  a: 10,
  b: "hello",
};
const objAsString = Deno.inspect(obj); // { a: 10, b: "hello" }
console.log(obj);  // prints same value as objAsString, e.g. { a: 10, b: "hello" }

// register custom inspect functions via Symbol.for("Deno.customInspect")
class A {
  x = 10;
  y = "hello";
  [Symbol.for("Deno.customInspect")](): string {
    return "x=" + this.x + ", y=" + this.y;
  }
}
const inStringFormat = Deno.inspect(new A()); // "x=10, y=hello"
console.log(inStringFormat);  // prints "x=10, y=hello"

// specify depth to output nested types
Deno.inspect({a: {b: {c: {d: 'hello'}}}}, {depth: 2}); // { a: { b: [Object] } }

function Deno.memoryUsage(): MemoryUsage {}
// returns an object describing memory usage of Deno process measured in bytes

function Deno.mkdir(path: string | URL, options?: MkdirOptions): Promise<void> {}
// create a new dir with specified path
await Deno.mkdir("new_dir");
await Deno.mkdir("nested/directories", { recursive: true }); // nested dirs
await Deno.mkdir("restricted_access_dir", { mode: 0o700 }); // chmod specification
// default throws if dir already exists
// requires --allow-write

function Deno.open(path: string | URL, options?: OpenOptions): Promise<File> {}
// open and resolve to an instance of Deno.File
// will generate new file if create, createNew open options
// caller should close when through with file objec to prevent memory leaks
const file = await Deno.open("/foo/bar.txt", { read: true, write: true });
// Do work with file
Deno.close(file.rid);
// requires --allow-read and/or --allow-write depending on options

function Deno.readDir(path: string | URL): AsyncIterable<DirEntry> {}
// reads directory by path and returns async iterable of Deno.DirEntry
for await (const dirEntry of Deno.readDir("/")) {
  console.log(dirEntry.name);
}
// throws if path not directory, requires --allow-read

function Deno.readFile(path: string | URL, options?: ReadFileOptions): Promise<Uint8Array> {}
// reads and resolves to entire contents of file as byte array
// use TextDecoder to transform bytes to string if required
// reading directory == return empty data array
const decoder = new TextDecoder("utf-8");
const data = await Deno.readFile("hello.txt");
console.log(decoder.decode(data));
// requires --allow-read

function Deno.readTextFile(path: string | URL, options?: ReadFileOptions): Promise<string> {}
// async read and return entire contents of file as utf8 encoded string
// read dir throws
const data = await Deno.readTextFile("hello.txt");
console.log(data);
// requires --allow-read

function Deno.realPath(path: string | URL): Promise<string> {}
// resolves to absolute normalized path with symbolic links resolved
await Deno.symlink("file.txt", "symlink_file.txt")
const realPath = await Deno.realPath("./file.txt")
const realSymLinkPath = await Deno.realPath("./symlink_file.txt")
console.log(realPath === realSymLinkPath) // true
console.log(realPath) // "/home/alice/file.txt"
// requires --allow-read for target path and CWD if target path relative

function Deno.remove(path: string | URL, options?: RemoveOptions): Promise<void> {}
// remove named file or dir
await Deno.remove("/path/to/dir-or-file", { recursive: true })
// throws if permission denied, path not found, path is non-empty dir and recursive isn't set to true
// requires --allow-write

function Deno.rename(oldpath: string | URL, newpath: string | URL): Promise<void> {}
// rename (move) oldpath to newpath where either file or dir
// **if newpath already exists and isn't a dir, rename() replaces it
const renameIt = async () => await Deno.rename(oldpath, newPath)
renameIt() // this is for syntax highlighting convenience only -- md doesn't recognize top-level await
// throws differently on different platforms
// requires --allow-read, --allow-write

function Deno.resources(): ResourceMap {}
// returns map of open rid along with string rep
// an internal API, resource rep is 'any' type, can change anytime
const resources = Deno.resources()
console.log(resources) // { 0: "stdin", 1: "stdout", 2: "stderr" }

function Deno.run(opt: T): Process<T> {}
// spawns new subprocess -- RunOptions must contain minimally opt.cmd, array of program args, first is binary
const p = Deno.run({
  cmd: ["echo", "hello"],
})
// subprocess uses same pwd as parent process unless opt.cwd specified
// env vars from parent process can be cleared using opt.clearEnv
// doesn't guarantee opt.env are present, OS may set env var for processes
// env vars for subprocess can be specified using opt.env mapping
// default subprocess inherits stdio of parent -- to change opt.stdout, opt.stderr and opt.stdin can be specified independently -- rid of open file, or set to "inherit", "piped", "null"
/*
  "inherit": default, child inherits from parent descriptor
  "piped": new pipe should be arranged to connect parent, child
  "null": stream will be ignored -- equiv of attaching to /dev/null
*/
// details of spawned process are returned
// requires --allow-run

function Deno.seek(rid: number, offset: number, whence: SeekMode): Promise<number> {}
// seek a rid to given offest under mode given by whence
// call resolves to new position within the resource (bytes from start)
const file = await Deno.open('hello.txt', { read: true, write: true, truncate: true, create: true })
await Deno.write(file.rid, new TextEncoder().encode("Hello world"))
// advance 6 bytes
const cursorPosition = await Deno.seek(file.rid, 6, Deno.SeekMode.Start)
console.log(cursorPosition) // 6
const buf = new Uint8Array(100)
await file.read(buf)
console.log(new TextDecoder().decode(buf)) // 'world'

// seek modes
const file = await Deno.open('hello.txt', { read: true, write: true, truncate: true, create: true })
await Deno.write(file.rid, new TextEncoder().encode("Hello world"))
// week 6 bytes from start
console.log(await Deno.seek(file.rid, 6, Deno.SeekMode.Start)) // "6"
console.log(await Deno.seek(file.rid, 2, Deno.SeekMode.Current)) // "8"
console.log(await Deno.seek(file.rid, -2, Deno.SeekMode.End)) // "9"

function Deno.serveHttp(conn: Conn): HttpConn {}
// services HTTP requests given TCP/TLS socket
const conn = await Deno.connect({ port: 80, hostname: "127.0.0.1" })
const httpConn = Deno.serveHttp(conn)
const e = await httpConn.nextRequest()
if (e) {
  e.respondWith(new Response("Hello World"))
}
// if httpConn.nextRequest() encounters an error or returns null, underlying HttpConn resource is closed automatically

function Deno.shutdown(rid: number): Promise<void> {}
// shutdown socket send ops
// matches behavior of POSIX shutdown(3)

function Deno.stat(path: string | URL): Promise<FileInfo> {}
// resolves to a Deno.FileInfo for specified path -- always follows symlinks
import { assert } from "https://deno.land/std/testing/asserts.ts"
const fileInfo = await Deno.stat("hello.txt")
assert(fileInfo.isFile)
// requires --allow-read

function Deno.symlink(oldpath: string | URL, newpath: string | URL, options?: SymlinkOptions): Promise<void> {}
// create newpath as a symbolic link to oldpath
// options.type param can be set to file | dir, arg only available on Windows (ignored on Mac/Linux)
const linkem = async () => await Deno.symlink("old/name", "new/name")
// requires --allow-write

function Deno.test(t: TestDefinition): void {}
// register a test run with CLI deno test containing module that looks like test module
// can be async as necessary
import { assert, fail, assertEquals } from "https://deno.land/std/testing/asserts.ts"

Deno.test({
  name: "example test",
  fn(): void {
    assertEquals("world", "world")
  }
})

Deno.test({
  name: "example ignored test",
  ignore: Deno.build.os === "windows",
  fn(): void {
    // ignored on Windows machines only
  }
})

Deno.test({
  name: "example async test",
  async fn() {
    const decoder = new TextDeoder("utf-8")
    const data = await Deno.readFile("hellow_world.txt")
    assertEquals(decoder.decode(data), "Hello world")
  }
})

function Deno.truncate(name: string, len?: number): Promise<void> {}
// trucates/extends specified file to reach len
// if no len, entire file contents are truncated
const trunc = async () => await Deno.truncate("my_file.txt")
trunc()
// otherwise, truncated to part of file specified
const file = await Deno.makeTempFile()
await Deno.writeFile(file, new TextEncoder().encode("Hello World"))
await Deno.truncate(file, 7)
const data = await Deno.readFile(file)
console.log(new TextDecoder().decode(data))
// requires --allow-write

function Deno.watchFs(paths: string | string[], options?: { recursive: boolean }): FsWatcher {}
// watch for fs events against one or more paths (files or dirs)
// paths must already exist
// user action like touch test.file can generate multiple fs events
// user action can also result in multiple file paths in one event ie mv old_name.txt new_name.txt
// recursive option true by default, for dirs, will watch specified directory and all sub dir
// exact ordering of events can vary between OS
const watcher = Deno.watchFs("/")
for await (const event of watcher) {
  console.log(">>>> event", event)
  // { kind: "create", paths: ["/foo.txt"]}
}
// requires --allow-read
// call watcher.close() to stop watching

function Deno.writeFile(path: string | URL, data: Uint8Array, options?: WriteFileOptions): Promise<void> {}
// write data to given path, default create else ovewrite file
const encoder = new TextEncoder()
const data = encoder.encode("Hello world\n")
await Deno.writeFile("hello1.txt", data) // overwrite
await Deno.writeFile("hello2.txt", data, { create: false }) // throws if hello2.txt DNE
await Deno.writeFile("hello3.txt", data, { mode: 0o777 }) // highest permissions for all entities
await Deno.writeFile("hello4.txt", data, { append: true }) // add data to end of file
// requires --allow-write, --allow-read if options.create is false

function Deno.writeTextFile(path: string | URL, data: string, options?: WriteFileOptions): Promise<void> {}
// async write string data to given path, default create new file if needed else overwrite
const overwrite = async () => await Deno.writeTextFile("hello1.txt", "Hello world\n")
// requires --allow-write, --allow-read if options.create is false
```

</details>
</br>

# Web Assembly namespace

<details>
<summary>Key built-in APIs</summary><br/>

```typescript
function WebAssembly.compile(butes: BufferSource): Promise<Module> {}
// compiles WebAssembly binary into a WebAssembly.Module object
// useful to compile module before it can be instantiated
// otherwise use WebAssembly.instantiate()

function WebAssembly.compileStreaming(source: Response | Promise<Response>): Promise<Module> {}
// compiles a WebAssembly.Module directly from streamed underlying source
// useful if necessary to compile a module before it can be instantiated (see above note)

function WebAssembly.instantiate(bytes: BufferSource, importObject?: Imports): Promise<WebAssemblyInstantiateSource> {}
// compile and instantiate WebAssembly code
// overload takes binary code in form of typed array | ArrayBuffer
// performs compilation and instantiation in one step
// returned Promise resolves to compiled WebAssembly.Module and WebAssembly.Instance

function WebAssembly.instantiateStreaming(response: Response | PromiseLike<Response>, importObject?: Imports): Promise<WebAssemblyInstantiatedSource> {}
// compiles and instantiates a WebAssembly module directly from streamed underlying source
// most efficient / optimized way to load wasm

function WebAssembly.validate(bytes: BufferSource): boolean {}
// validates given typed array of WebAssembly binary
// returns whether bytes form a valid wasm module true | false
```

</details>
<br/>

# Variables

<details>
  <summary>CLI args, build-related args, environment variables, permissions, process IDs (pid), and std streams</summary><br/>
  
`Deno.args`

- returns script args to program
- if `$ deno run --allow-read https://deno.land/std/examples/cat.ts /etc/passwd`, Deno.args will contain "/etc/passwd"

`Deno.build`

- target: ""
- arch: "x86_64 | aarch64"
- os: "darwin | linux | windows"
- vendor: ""
- env: ""

`Deno.env`

- get(key: string): string | undefined,
- set(key: string, value: string): void,
- delete(key: string): void,
- toObject(): { index: string }
- requires --allow-env

`Deno.permissions`

- type: Permissions
- permissions management api

`Deno.pid`

- type: Number
- current process id of runtime

`Deno.stdin | Deno.stdout | Deno.stderr`

- for stderr, stdout T: Writer & WriterSync & Closer
- for stdin: Reader & ReaderSync & Closer
</details>
<br/>

# Permissions

<details>
  <summary>Deno sandbox API</summary><br/>

## Overview

- Deno is secure by default -- unless you specifically enable it, a program run with Deno has no file, network, or environment access
- Access is granted to an executing script through cli flags or a runtime permission prompt

<br/>

## Permissions flags

`--allow-env`: allow environment access, ie get/set env vars

- can specify an optional, comma-separated list of env vars to provide allow-list

`--allow-hrtime`: allow high-res time measurement

- prevents timing attacks / fingerprinting

`--allow-net`: allow network access

- comma-separated list of IP addresses / hostnames (opt, with ports) to build allow-list

`--allow-ffi`: allow loading of dynamic libs

- note: dynamic libraries are <em>not</em> run in sandbox, don't have same security restrictions as Deno process -- use with caution! (unstable feature)

`--allow-read`: allow file system read access

- specify optional, comma-separated list of dirs | files to provide allow-list

`--allow-run`: allow running subprocesses

- specify optional, comma-separated list of subprocesses for allow-list
- subprocesses don't run in sandbox, don't have same security restrictions as deno process
- use with caution!

`--allow-write`: allow file system write access

- comma-separated list of dir | file to provide allow-list

`-A, --allow-all`: disable all security

<br/>

## Permissions use cases

### File system access

`$ deno run --allow-read=/usr https://deno.land/std@0.106.0/examples/cat.ts /etc/passwd` will fail without --allow-read flag: prevents unauthorized file reads to sensitive data
<br/><br/>

### Network access

```javascript
const result = await fetch("https://deno.land/");
```

- multiple hostnames, all ports ok
  `$ deno run --allow-net=github.com,deno.land fetch.js`

- hostname at port 80
  `$ deno run --allow-net=deno.land:80 fetch.js`

- ipv4 addr on port 443
  `$ deno run --allow-net=1.1.1.1:443 fetch.js`

- ipv6 addr, all ports ok
  `$ deno run --allow-net=[2606:4700:4700:1111] fetch.js`

<em>note: fetch.js calls that aren't permitted will throw</em>
<br/><br/>

### Environment variables

```javascript
Deno.env.set("MY_VAR", "myVar");
```

`$ deno run --allow-env env.js` without --allow-env will throw
<br/><br/>

### Caveats

<strong>A word of caution on privilege escalation</strong>: subprocesses aren't restricted by Deno-level permissions

```javascript
const proc = Deno.run({ cmd: ["cat", "/etc/passwd"] });
```

- only spawn cat subprocess
  `$ deno run --allow-run=cat run.js`

- allow any subprocess to run
`$ deno run --allow-run run.js`
</details>
<br/>

# Wasm loading and execution

<details>
<summary>Handling WebAssembly</summary><br/>
<em>note: requires `application/wasm` MIME type</em>

```javascript
const { instance, module} = await WebAssembly.instantiateStreaming(
  fetch("https://wpt.live/wasm/incrementer.wasm")
)
const increment = instance.exports.increment as (input: number) => number
conosle.log(increment(42))
```

</details>
<br/>

# Debugging

<details>
<summary>Debugging options</summary><br/>
Deno supports V8 Inspector Protocol
Debug Deno programs using Chrome DevTools or VSCode

```
$ deno run --inspect-brk --allow-read --allow-net https://deno.land/std@0.106.0/http/file_server.ts
...Debugger listening on ws://127.0.0.1:9229/ws/...
```

- in chrome / edge, open chrome://inspect, click <code>Inspect</code> next to target

</details><br/>

# Stability and production-readiness

<details>
<summary>Overview of state of standard modules</summary><br/>

Deno's standard modules are <em>not yet stable</em>

- currently version the standard modules differently from CLI to reflect this
- unlike Deno namespace, use of standard modules do not require --unstable flag, unless standard module itself uses an unstable Deno feature
- note: this is a deviation from the general pattern requiring --unstable flags!
</details><br/>

# Query permissions at runtime

<details>
<summary>JIT permissions handling</summary><br/>

Occasionally you'll want to check whether permissions have been granted; for example, given the following:

```
$ deno run --allow-read=/foo main.ts
```

```typescript
const desc1 = { name: "read", path: "/foo/bar" } as const;
// PermissionStatus { state: "granted" }

// global write permission
const desc2 = { name: "write", path: "/foo" } as const;
// PermissionStatus { state: "prompt" }
// alert: Deno requests write access to "/foo". Grant? [y/n (y = yes allow, n = no deny)]
// n
// PermissionStatus { state: "denied" }
```

Downgrade permission from "granted" to "prompt"

```javascript
await Deno.permissions.revoke(desc1);

console.log(await Deno.permissions.query(desc1));
// PermissionStatus { state: "prompt" }
```

</details><br/>

# Web APIs

<details>
  <summary>Overview of Deno-supported Web APIs and modifications to ECMA standards</summary><br/>
<code>fetch</code>

- no cookie jar
- does not follow same-origin policy (Deno user agent has no concept of origins)
- Deno doesn't need to protet against leaking authenticated data cross origin!
- does not implement Origin header, CORS protocol, CORB, Cross-Origin-Resource-Policy header, atomic HTTP redirect handling, or opaquedirect response

<code>CustomEvent, EventTarget, EventListener</code>

- events don't bubble (Deno has no DOM hierarchy, no tree to bubble through)

<code>Web Worker API</code>

- execute code in separate thread
- no workers from blob URLs
- posted data is serialized to JSON rather than structured cloning algorithm which supports complex types, ex File, Blob, ArrayBuffer (and JSON)
- ownership can't be transferred between workers

Deno also supports:<br/>
<code>Blob</code><br/>
<code>Console</code><br/>
<code>FormData</code><br/>
<code>Performance</code><br/>
<code>setTimeout</code><br/>
<code>setInterval</code><br/>
<code>clearInterval</code><br/>
<code>Streams API</code><br/>
<code>URL</code><br/>
<code>URLSearchParams</code><br/>
<code>WebSocket</code><br/>

</details><br/>

# HTTP Server APIs

<details>
  <summary>Instantiating and handling server and network calls</summary><br/>

## HTTP

```typescript
const server = Deno.listen({ port: 8080 });

// listen for TLS
const server = Deno.listenTls({
  port: 8443,
  certFile: "localhost.crt", // req
  keyFile: "localhost.key", // req
  alpnProtocols: ["h2", "http/1.1"], // opt, necessary for HTTP/2 support (protocol negotiation happens during TLS handshake)
});
```

return value is a Deno.Listener, an async iterable that yields Deno.Conn and provides methods for handling connections

```typescript
const server = Deno.listen({ port: 8080 });

// iterable...
for await (const conn of server) {
  // handle connection
}

// or...
while (true) {
  try {
    const conn = await server.accept();
    // handle connection
  } catch (err) {
    // listener closed
    break;
  }
}

// close listener with .close() method
// to handle HTTP requests within server connections, IIFE or closure via function

const handleHTTP = async () => {
  const httpConn = Deno.serveHttp(conn);
  for await (const requestEvent of httpConn) {
    // handle requestEvent
  }
};

const server = Deno.listen({ port: 8080 });
for await (const conn of server) {
  handle(conn);
}

// .respondWith() to complete a request, takes a Response object of Promise resolving to a Response object
const handle(conn: Deno.Conn) = async () => {
  const httpConn = Deno.serveHttp(conn)
  for await (const requestEvent of httpConn){
    await requestEvent.respondWith(
      new Response("hello world", {
        status: 200,
      })
    )
  }
}
```

## Websockets

```typescript
const handle(conn: Deno.Conn) = async () => {
  const httpConn = Deno.serveHttp(conn)
  for await (const requestEvent of httpConn){
    await requestEvent.respondWith(
      handleReq(requestEvent.request)
    )
  }
}

const handleReq(req: Request): Response {
  if (req.headers.get("upgrade") !== "websocket"){
    return new Response("request isn't trying to upgrade to websocket")
  }

  const { socket, response } = Deno.upgradeWebSocket(req)
  socket.onopen = () => console.log("socket opened")

  socket.onmessage = e => {
    console.log("socket message:", e.data)
    socket.send(new Date().toString())
  }

  socket.onerror = e => console.log("socket errored", e.message)
  socket.onclose = () => console.log("socket closed")
  return response
}
```

## HTTPS

See server framework [Oak](https://github.com/oakserver/oak)

</details><br/>

# Local/SessionStorage

<details>
  <summary>Local data persistence</summary><br/>

Deno supports `localStorage` and `sessionStorage`  
note: `sessionStorage` boundary determined by process duration, `localStorage` persists across process restarts  
\*\* see [Web Storage APIs in Deno](https://medium.com/deno-the-complete-reference/web-storage-apis-in-deno-8e982ea90085)

</details><br/>

# Web Worker API

<details>
  <summary>Concurrency via spawned and offloaded processes</summary><br/>
Workers can be used to run code on multiple threads

- each Worker instance is run on a separate thread dedicated to that worker only
- Deno supports module type workers: pass `type: "module"` option when creating a new worker

```typescript
new Worker(new URL("./worker.js", import.meta.url).href, { type: "module" });
```

<br/>

Workers require --allow-read for local modules, --allow-net for remote modules

`unstable`: pass <code>{ deno: { namespace: true }}</code> in options to use Deno inside worker

```typescript
const worker = new Worker(new URL("./worker.js", import.meta.url).href, {
  type: "module",
  deno: {
    namespace: true,
  },
});

worker.postMessage({ filename: "./log.txt" });

// in worker.js
self.onmessage = async (e) => {
  const { filename } = e.data;
  const text = await Deno.readTextFile(filename);
  console.log(text);
  self.close();
};
```

<br/>

Workers can receive permissions field in options

```
options: {
  ...,
  permissions: {
    read: [
      "/path1.txt",
      "./worker/file_2.txt"
    ]
  }
}
```

</details><br/>

# Remote Import

<details>
  <summary>Best practices for import-export logic</summary><br/>

## Emulate node_modules through import, re-export

Specify version and import, re-export external libs in central `deps.ts` file: this is akin to `package.json` functionality

```typescript
// deps.ts
export {
  assert,
  assertEquals,
  assertStrContains,
} from "https://deno.land/std@0.106.0/testing/asserts.ts";

// elsewhere
import { assertEQuals, runTests, test } from "./deps.ts";
```

<br/>

## Hold deps in source control

Check $DENO_DIR into source control to avoid brittle servers and outages preventing access to deps
<br/><br/>

## Cache lock files to monitor deps

Cache and generate lock files to monitor subresource integrity and guarantee stable versions across project lifetime

`$ deno cache --lock=lock.json --lock-write src/deps.ts`
`$ git add -u lock.json`
`$ git commit -m "feat: add support for xyz with xyz-lib"`
`$ git push`

next collaborator reloads cache after pulling from source control
`$ deno cache --reload --lock=lock.json src/deps.ts`
`$ deno test --allow-read src`

always cache remote deps!
`$ deno run --lock=lock.json --cached-only mod.ts`

</details><br/>

# Private modules and tokens

<details>
  <summary>Accessing modules in private repositories</summary><br/>
You may want to import submodules from private repositories  
Deno provides an environment variable to handle authentication via token

`$ DENO_AUTH_TOKENS=a1b2c3@deno.land;f1e2g3h4@example.com:8080`

Deno will set Authorization header of request to value of `Bearer {token}`  
This allows the remote server to recognize authorized requests tied to specific, authenticated users and provide access to resources/modules for import

</details><br/>

# Node.js compatibility and differences

<details>
  <summary>Running Node.js packages and APIs in Deno</summary><br/>

## Interoperability

Deno standard library module std/node provides polyfills for Node.js built-ins
Most Node.js APIs work "out-of-the-box." Notable exceptions are listed below:

- no support for CommonJS, only ES Modules (no require statements)
- Node.js plugins are not supported, some built-ins like vm incompatible

<br/>

## Working with Node.js submodules that use CommonJS import syntax

To utilize Node.js submodules that require the `require` API, we build it

```javascript
const require = createRequire(import.meta.url);
const path = require("path"); // etc
```

</details><br/>

# File system events

<details>
  <summary>Responding to events emitted by OS (platform-dependent)</summary><br/>

Given file `watcher.ts`

```typescript
const watcher = Deno.watchFS(".");
for await (const event of watcher) {
  console.log(">>>> event", event);
  // Ex, { kind: "create", paths: ["/home/alice/deno/foo.txt"]}
}
```

`$ deno run --allow-read watcher.ts`

For additional info: [Listening to Windows OS Events](https://docs.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-readdirectorychangesw)

</details><br/>

# Testing in Deno

<details>
  <summary>Assertion, test-running, and coverage analysis</summary><br/>

Deno standard library has built-in [assertion module](https://deno.land/std@0.106.0/testing/asserts.ts)

## Assert API

```typescript
import { assert } from "https://deno.land/std@0.106.0/testing/asserts.ts";

Deno.test("Hello Test", () => {
  assert("Hello");
});
```

## Supported assertions

```typescript
// assert truthy
function assert(expr: unknown, msg = ""): string {}

// assert equality
function assertEquals(actual: unknown, expected: unknown, msg?: string): void {}
function assertNotEquals(
  actual: unknown,
  expected: unknown,
  msg?: string
): void {}
function assertStrictEquals(
  actual: unknown,
  expected: unknown,
  msg?: string
): void {}

// assert existence
function assertExists(actual: unknown, msg?: string): void {}

// assert contains
function assertStringIncludes(
  actual: string,
  expected: string,
  msg?: string
): void {}
function assertArrayIncludes(
  actual: unknown[],
  expected: unknown[],
  msg?: string
): void {}

// assert regex
function assertMatch(actual: string, expected: RegExp, msg?: string): void {}
function assertNotMatch(actual: string, expected: RegExp, msg?: string): void {}

// assert object matches a subset of props of object
function assertObjectMatch(
  actual: Record<PropertyKey, unknown>,
  expected: Record<PropertyKey, unknown>
): void {}

// assert expected error
function assertThrows(
  fn: () => void,
  ErrorClass?: Constructor,
  msgIncludes = "",
  msg?: string
): Error {}
function assertThrowsAsync(
  fn: () => Promise<void>,
  ErrorClass?: Constructor,
  msgIncludes = "",
  msg?: string
): Promise<Error> {}
```

<br/>

## Custom error messages

```typescript
Deno.test("Test Custom Message", () => {
  assertEquals(1, 2, "Values don't match");
});
```

## Custom assertions

```typescript
function assertPowerOf(actual: number, expected: number, msg?: string): void {
  let received = actual;
  while (received % expected === 0) {
    received /= expected;
  }
  if (received !== 1) {
    if (!msg) {
      msg = `actual: "${actual}" expected to be a power of: "${expected}"`;
    }
    throw new AssertionError(msg);
  }
}

Deno.test("Test Assert PowerOf", () => {
  assertPowerOf(8, 2);
  assertPowerOf(11, 4);
});
```

<br/>

## Test coverage analysis

- test coverage drawn from underlying V8 engine with `--coverage flag`
- default excludes files matching regex `test\.(js|mjs|ts|jsx|tsx)` (excludes remote files, can override this with `--exclude, --include`

`$ deno test --coverage=<output-directory>`

- tests are sanitized to avoid false success, preventing `Deno.exit(0)` for example which would skip the failing test that follows:

```javascript
Deno.test({
  name: "false success",
  fn() {
    Deno.exit(0);
  },
  sanitizeExit: false,
});

// This test never runs, because the process exits during "false success" test
Deno.test({
  name: "failing test",
  fn() {
    throw new Error("this test fails");
  },
});
```

</details><br/>

# Tools and utilities

<details>
  <summary>Built-in formatting, module bundling, documentation generation, dependency grapher, linter</summary><br/>

## Formatter

`$ deno fmt <specific-file1> ...`
`deno fmt --check`
`cat file.ts | deno fmt`

use `// deno-fmt-ignore` comment to skip formatting a block or ignore entire file with `// deno-fmt-ignore-file`
<br/><br/>

## Bundler

`$ deno bundle [URL] <name>.bundle.js` outputs a single JS file including all deps of input

- if out file omitted, bundle sent to <code>stdout</code>

run bundle like a module >> output is self-contained ES module where exports from main module supplied via CLI will be available
`$ deno run my.bundle.js`

```javascript
// target to be bundled as lib.bundle.js
export { foo } from "./foo.js"
export const bar = "bar"

// access imports
import { bar, foo}  from "./lib.bundle.js
```

```html
<!-- load in browser -->
<script type="module" src="my.bundle.js"></script>

<!-- import into consuming module -->
<script type="module">
  import * as website from "website.bundle.js";
</script>
```

<br/>

## Documentation Generator

`add.ts`

```javascript
/**
 * Adds x and y.
 * @param {number} x
 * @param {number} y
 * @returns {number} Sum of x and y
 */
export function add(x: number, y: number): number {
  return x + y;
}
```

`$ deno doc add.ts` >> outputs:

> function add(x: number, y: number): number
> </br>
> Adds x and y. @param {number} x @param {number} y @returns {number} Sum of x and y

<br/>

## Dependency Inspector

`$ deno info [URL]` inspects ES module and its deps

```
deno info https://deno.land/std@0.67.0/http/file_server.ts
Download https://deno.land/std@0.67.0/http/file_server.ts
...
local: /home/deno/.cache/deno/deps/https/deno.land/f57792e36f2dbf28b14a75e2372a479c6392780d4712d76698d5031f943c0020
type: TypeScript
compiled: /home/deno/.cache/deno/gen/https/deno.land/f57792e36f2dbf28b14a75e2372a479c6392780d4712d76698d5031f943c0020.js
deps: 23 unique (total 139.89KB)
https://deno.land/std@0.67.0/http/file_server.ts (10.49KB)
├─┬ https://deno.land/std@0.67.0/path/mod.ts (717B)
│ ├── https://deno.land/std@0.67.0/path/_constants.ts (2.35KB)
│ ├─┬ https://deno.land/std@0.67.0/path/win32.ts (27.36KB)
│ │ ├── https://deno.land/std@0.67.0/path/_interface.ts (657B)
│ │ ├── https://deno.land/std@0.67.0/path/_constants.ts *
│ │ ├─┬ https://deno.land/std@0.67.0/path/_util.ts (3.3KB)
│ │ │ ├── https://deno.land/std@0.67.0/path/_interface.ts *
│ │ │ └── https://deno.land/std@0.67.0/path/_constants.ts *
│ │ └── https://deno.land/std@0.67.0/_util/assert.ts (405B)
│ ├─┬ https://deno.land/std@0.67.0/path/posix.ts (12.67KB)
│ │ ├── https://deno.land/std@0.67.0/path/_interface.ts *
│ │ ├── https://deno.land/std@0.67.0/path/_constants.ts *
│ │ └── https://deno.land/std@0.67.0/path/_util.ts *
│ ├─┬ https://deno.land/std@0.67.0/path/common.ts (1.14KB)
│ │ └─┬ https://deno.land/std@0.67.0/path/separator.ts (264B)
│ │   └── https://deno.land/std@0.67.0/path/_constants.ts *
│ ├── https://deno.land/std@0.67.0/path/separator.ts *
│ ├── https://deno.land/std@0.67.0/path/_interface.ts *
│ └─┬ https://deno.land/std@0.67.0/path/glob.ts (8.12KB)
│   ├── https://deno.land/std@0.67.0/path/_constants.ts *
│   ├── https://deno.land/std@0.67.0/path/mod.ts *
│   └── https://deno.land/std@0.67.0/path/separator.ts *
├─┬ https://deno.land/std@0.67.0/http/server.ts (10.23KB)
│ ├── https://deno.land/std@0.67.0/encoding/utf8.ts (433B)
│ ├─┬ https://deno.land/std@0.67.0/io/bufio.ts (21.15KB)
│ │ ├── https://deno.land/std@0.67.0/bytes/mod.ts (4.34KB)
│ │ └── https://deno.land/std@0.67.0/_util/assert.ts *
│ ├── https://deno.land/std@0.67.0/_util/assert.ts *
│ ├─┬ https://deno.land/std@0.67.0/async/mod.ts (202B)
│ │ ├── https://deno.land/std@0.67.0/async/deferred.ts (1.03KB)
│ │ ├── https://deno.land/std@0.67.0/async/delay.ts (279B)
│ │ ├─┬ https://deno.land/std@0.67.0/async/mux_async_iterator.ts (1.98KB)
│ │ │ └── https://deno.land/std@0.67.0/async/deferred.ts *
│ │ └── https://deno.land/std@0.67.0/async/pool.ts (1.58KB)
│ └─┬ https://deno.land/std@0.67.0/http/_io.ts (11.25KB)
│   ├── https://deno.land/std@0.67.0/io/bufio.ts *
│   ├─┬ https://deno.land/std@0.67.0/textproto/mod.ts (4.52KB)
│   │ ├── https://deno.land/std@0.67.0/io/bufio.ts *
│   │ ├── https://deno.land/std@0.67.0/bytes/mod.ts *
│   │ └── https://deno.land/std@0.67.0/encoding/utf8.ts *
│   ├── https://deno.land/std@0.67.0/_util/assert.ts *
│   ├── https://deno.land/std@0.67.0/encoding/utf8.ts *
│   ├── https://deno.land/std@0.67.0/http/server.ts *
│   └── https://deno.land/std@0.67.0/http/http_status.ts (5.93KB)
├─┬ https://deno.land/std@0.67.0/flags/mod.ts (9.54KB)
│ └── https://deno.land/std@0.67.0/_util/assert.ts *
└── https://deno.land/std@0.67.0/_util/assert.ts *
```

<br/>

## Linter

`$ deno lint <file> --json`
`$ cat file.ts | deno lint -`

[deno_lint API](https://lint.deno.land/)

</details><br/>

# Deno and TypeScript

<details>
  <summary>First-class TypeScript support, config and types import (local and remote)</summary><br/>

## Overview

- Deno treats TypeScript like a first-class language (same way it handles JS, WASM)
- Deno CLI is all that's needed for TypeScript "out-of-the-box"
- TypeScript is compiled to JS via built-in TS compiler + Rust lib [swc](https://rustdoc.swc.rs/swc/)

<br/>

## Skipping type-checking to increase dev velocity

skip typechecks with `--no-check` flag at CLI invocation to avoid cost of compilation
`$ deno run --allow-net --no-check my_server.ts`

`.d.ts` is treated as type-definition file with no runnable code

<br/>

## Compiler-supported files

Deno TS compiler supports:

- /typescript (application, text)
- /vnd.dlna.mpeg-tts
- /mp2t
- /x-typescript
- /javascript (application, text)
- /ecmascript (application, text)
- /x-javascript
- /node
- /jsx
- /tsx
- /plain \*\* attempted
- /octet-stream \*\* attempted

<br/>

## Type-checking idiosyncracies

Typechecks performed in <code>strict mode</code> by default

\*\* note: type resolution errors cannot be resolved with usual ts pragmas

```typescript
// @ts-ignore
// @ts-expect-error
```

<br/>

## Config

To run a config file (not necessary -- out of the box, TypeScript is already configured for usual use cases)

- config may be incompatible with downstream consumers of this module, not advised!
- if config necessary, must be required to all consumers if parent module is distributed
  `$ deno run --config ./tsconfig.json main.ts`

Deno checks only <code>compilerOptions</code> field from the usual tsc

<br/>

## Types usage

inline types usage

```typescript
// @deno-types="./coolLib.d.ts"
import * as coolLib from "./coolLib.js";
// now, typechecking will use the deno-types rather than coolLib.js
```

include other files

```typescript
/// <reference types="./coolLib.d.ts" />
// javascript goes here...
```

use X-TypeScript-Types header to resolve and typecheck remote modules

```
HTTP/1.1 200 OK
Content-Type: application/javascript; charset=UTF-8
Content-Length: 648
X-TypeScript-Types: ./coolLib.d.ts
```

Use [Skypack.dev](https://docs.skypack.dev/skypack-cdn/code/deno) CDN to resolve types in remote module imports

- important! append `?dts` to URL

```typescript
import React from "https://cdn.skypack.dev/react?dts";
```

** Note: Deno supports a particular version of TypeScript bundled with the Deno release **
