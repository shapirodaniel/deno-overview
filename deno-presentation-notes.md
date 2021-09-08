# deno presentation

# config and setup

## VS Code

Install the
[Deno VS Code language server extension](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno)

<code>ctrl + shift + p</code> to launch search, navigate to <code>Deno:
Initialize Workspace Configuration</code> to enable Deno namespace and url
imports

Note: it's not recommended to initialize these settings globally

## PowerShell Deno CLI Completions

Open PowerShell and run the following command, replacing the path to your system
powershell_profile.ps1

<code>deno completions powershell >
[path-to-system-powershell_profile.ps1-directory]/deno.ps1</code>

Then invoke the script in your <code>Microsoft.PowerShell_profile.ps1</code>

# web request and intro to permissions

Deno is secure by default, meaning that we'll need to grant explicit permissions for any privileged actions -- for instance, a web request

This command will fail without the <code>--allow-net</code> flag

deno run https://deno.land/std@0.106.0/examples/curl.ts https://example.com > ./web-response.html

Launch the fetched markup with live-server to check it out

# Deno namespace and built-in APIs, some key ones

```typescript
function Deno.chdir(directory: string | URL): void
Deno.chdir("/home/userA") // equivalent to ls | Set-Location

function Deno.chmod(path: string | URL, mode: number): Promise<void>
// change permission of specific file/dir of specified path
await Deno.chmod("/path/to/file", 0o666) // where second arg is structured
/*
  mode: sequence of three octal numbers
  0o <owner-group-others>
  ex, 0o751, owner has read/write/execute, group has read/execute, others have execute only
  note: throws on Windows, requires --allow-write permission
*/

function Deno.close(rid: number): void
// close a given resource ID to avoid memory leaks
const file = await Deno.open("my_file.txt")
// do work with file object
Deno.close(file.rid)

function Deno.create(path: string | URL): Promise<File>
// create a file or truncate an existing file and resolve to an instance of Deno.File
const file = await Deno.create("/foo/bar.txt")
// requires --allow-read, --allow-write privileges

function Deno.exit(code?: number): never
// TypeScript never: function will not return to its end point or will always throw an exception
// Exit the Deno process with optional exit code; no code specified == 0
Deno.exit(1)

function Deno.fdatasync(rid: number): Promise<void>
// flush pending data ops of given file stream to disk
const file = await Deno.open("my_file.txt", { read: true, write: true, create: true });
await Deno.write(file.rid, new TextEncoder().encode("Hello World"));
await Deno.fdatasync(file.rid);
console.log(new TextDecoder().decode(await Deno.readFile("my_file.txt"))); // Hello World

function Deno.inspect(value: unknown, options?: InspectOptions): string
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

function Deno.memoryUsage(): MemoryUsage
// returns an object describing memory usage of Deno process measured in bytes

function Deno.mkdir(path: string | URL, options?: MkdirOptions): Promise<void>
// create a new dir with specified path
await Deno.mkdir("new_dir");
await Deno.mkdir("nested/directories", { recursive: true }); // nested dirs
await Deno.mkdir("restricted_access_dir", { mode: 0o700 }); // chmod specification
// default throws if dir already exists
// requires --allow-write

function Deno.open(path: string | URL, options?: OpenOptions): Promise<File>
// open and resolve to an instance of Deno.File
// will generate new file if create, createNew open options
// caller should close when through with file objec to prevent memory leaks
const file = await Deno.open("/foo/bar.txt", { read: true, write: true });
// Do work with file
Deno.close(file.rid);
// requires --allow-read and/or --allow-write depending on options

function Deno.readDir(path: string | URL): AsyncIterable<DirEntry>
// reads directory by path and returns async iterable of Deno.DirEntry
for await (const dirEntry of Deno.readDir("/")) {
  console.log(dirEntry.name);
}
// throws if path not directory, requires --allow-read

function Deno.readFile(path: string | URL, options?: ReadFileOptions): Promise<Uint8Array>
// reads and resolves to entire contents of file as byte array
// use TextDecoder to transform bytes to string if required
// reading directory == return empty data array
const decoder = new TextDecoder("utf-8");
const data = await Deno.readFile("hello.txt");
console.log(decoder.decode(data));
// requires --allow-read

function Deno.readTextFile(path: string | URL, options?: ReadFileOptions): Promise<string>
// async read and return entire contents of file as utf8 encoded string
// read dir throws
const data = await Deno.readTextFile("hello.txt");
console.log(data);
// requires --allow-read

function Deno.realPath(path: string | URL): Promise<string>
// resolves to absolute normalized path with symbolic links resolved
await Deno.symlink("file.txt", "symlink_file.txt")
const realPath = await Deno.realPath("./file.txt")
const realSymLinkPath = await Deno.realPath("./symlink_file.txt")
console.log(realPath === realSymLinkPath) // true
console.log(realPath) // "/home/alice/file.txt"
// requires --allow-read for target path and CWD if target path relative

function Deno.remove(path: string | URL, options?: RemoveOptions): Promise<void>
// remove named file or dir
await Deno.remove("/path/to/dir-or-file", { recursive: true })
// throws if permission denied, path not found, path is non-empty dir and recursive isn't set to true
// requires --allow-write

function Deno.rename(oldpath: string | URL, newpath: string | URL): Promise<void>
// rename (move) oldpath to newpath where either file or dir
// **if newpath already exists and isn't a dir, rename() replaces it
const renameIt = async () => await Deno.rename(oldpath, newPath)
renameIt() // this is for syntax highlighting convenience only -- md doesn't recognize top-level await
// throws differently on different platforms
// requires --allow-read, --allow-write

function Deno.resources(): ResourceMap
// returns map of open rid along with string rep
// an internal API, resource rep is 'any' type, can change anytime
const resources = Deno.resources()
console.log(resources) // { 0: "stdin", 1: "stdout", 2: "stderr" }

function Deno.run(opt: T): Process<T>
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

function Deno.seek(rid: number, offset: number, whence: SeekMode): Promise<number>
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

function Deno.serveHttp(conn: Conn): HttpConn
// services HTTP requests given TCP/TLS socket
const conn = await Deno.connect({ port: 80, hostname: "127.0.0.1" })
const httpConn = Deno.serveHttp(conn)
const e = await httpConn.nextRequest()
if (e) {
  e.respondWith(new Response("Hello World"))
}
// if httpConn.nextRequest() encounters an error or returns null, underlying HttpConn resource is closed automatically

function Deno.shutdown(rid: number): Promise<void>
// shutdown socket send ops
// matches behavior of POSIX shutdown(3)

function Deno.stat(path: string | URL): Promise<FileInfo>
// resolves to a Deno.FileInfo for specified path -- always follows symlinks
import { assert } from "https://deno.land/std/testing/asserts.ts"
const fileInfo = await Deno.stat("hello.txt")
assert(fileInfo.isFile)
// requires --allow-read

function Deno.symlink(oldpath: string | URL, newpath: string | URL, options?: SymlinkOptions): Promise<void>
// create newpath as a symbolic link to oldpath
// options.type param can be set to file | dir, arg only available on Windows (ignored on Mac/Linux)
const linkem = async () => await Deno.symlink("old/name", "new/name")
// requires --allow-write

function Deno.test(t: TestDefinition): void
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

function Deno.truncate(name: string, len?: number): Promise<void>
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

function Deno.watchFs(paths: string | string[], options?: { recursive: boolean }): FsWatcher
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

function Deno.writeFile(path: string | URL, data: Uint8Array, options?: WriteFileOptions): Promise<void>
// write data to given path, default create else ovewrite file
const encoder = new TextEncoder()
const data = encoder.encode("Hello world\n")
await Deno.writeFile("hello1.txt", data) // overwrite
await Deno.writeFile("hello2.txt", data, { create: false }) // throws if hello2.txt DNE
await Deno.writeFile("hello3.txt", data, { mode: 0o777 }) // highest permissions for all entities
await Deno.writeFile("hello4.txt", data, { append: true }) // add data to end of file
// requires --allow-write, --allow-read if options.create is false

function Deno.writeTextFile(path: string | URL, data: string, options?: WriteFileOptions): Promise<void>
// async write string data to given path, default create new file if needed else overwrite
const overwrite = async () => await Deno.writeTextFile("hello1.txt", "Hello world\n")
// requires --allow-write, --allow-read if options.create is false
```

## Web Assembly namespace and apis, some key ones

```typescript
function WebAssembly.compile(butes: BufferSource): Promise<Module>
// compiles WebAssembly binary into a WebAssembly.Module object
// useful to compile module before it can be instantiated
// otherwise use WebAssembly.instantiate()

function WebAssembly.compileStreaming(source: Response | Promise<Response>): Promise<Module>
// compiles a WebAssembly.Module directly from streamed underlying source
// useful if necessary to compile a module before it can be instantiated (see above note)

function WebAssembly.instantiate(bytes: BufferSource, importObject?: Imports): Promise<WebAssemblyInstantiateSource>
// compile and instantiate WebAssembly code
// overload takes binary code in form of typed array | ArrayBuffer
// performs compilation and instantiation in one step
// returned Promise resolves to compiled WebAssembly.Module and WebAssembly.Instance

function WebAssembly.instantiateStreaming(response: Response | PromiseLike<Response>, importObject?: Imports): Promise<WebAssemblyInstantiatedSource>
// compiles and instantiates a WebAssembly module directly from streamed underlying source
// most efficient / optimized way to load wasm

function WebAssembly.validate(bytes: BufferSource): boolean
// validates given typed array of WebAssembly binary
// returns whether bytes form a valid wasm module true | false
```

# Variables

```typescript
const Deno.args: string[]
// returns script args to program
`deno run --allow-read https://deno.land/std/examples/cat.ts /etc/passwd`
// Deno.args will contain "/etc/passwd"

const Deno.build
// build related info
// props:
target: string
arch: "x86_64" | "aarch64"
os: "darwin" | "linux" | "windows"
vendor: string
env: string

const Deno.env: {
  get(key: string): string | undefined,
  set(key: string, value: string): void,
  delete(key: string): void,
  toObject(): {
    index: string
  }
}
// requires --allow-env

const Deno.permissions: Permissions
// permissions management api

const Deno.pid: number
// current process id of runtime

const Deno.stdin|stdout|stderr
// handle for stdin, stdout, stderr
// for stderr, stdout T: Writer & WriterSync & Closer
// for stdin: Reader & ReaderSync & Closer
```

## Permissions

Deno is secure by default -- unless you specifically enable it, a program run with Deno has no:

- file
- network
- environment access

Access is granted to an executing script through cli flags or a runtime permission prompt

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

### Permissions use cases

1. File system ccess

`$ deno run --allow-read=/usr https://deno.land/std@0.106.0/examples/cat.ts /etc/passwd`

- will fail without --allow-read flag, prevents unauthorized file reads to sensitive data

2. Network access

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

- fetch.js calls that aren't permitted will throw

3. Env vars

```javascript
Deno.env.set("MY_VAR", "myVar");
```

- without --allow-env, will throw
  `$ deno run --allow-env env.js`

4. Caution: privilege escalation
   Subprocesses aren't restricted by Deno-level permissions

```javascript
const proc = Deno.run({ cmd: ["cat", "/etc/passwd"] });
```

- only spawn cat subprocess
  `$ deno run --allow-run=cat run.js`

- allow any subprocess to run
  `$ deno run --allow-run run.js`

## Load and run wasm

Note: requires `application/wasm` MIME type

```javascript
const { instance, module} = await WebAssembly.instantiateStreaming(
  fetch("https://wpt.live/wasm/incrementer.wasm")
)
const increment = instance.exports.increment as (input: number) => number
conosle.log(increment(42))
```

## Debugging

Deno supports V8 Inspector Protocol
Debug Deno programs using Chrome DevTools or VSCode
`$ deno run --inspect-brk --allow-read --allow-net https://deno.land/std@0.106.0/http/file_server.ts`
...Debugger listening on ws://127.0.0.1:9229/ws/...

> > in chrome / edge, open chrome://inspect, click <code>Inspect</code> next to target

## Stability and production-readiness

Deno's standard modules are <em>not yet stable</em>

- currently version the standard modules differently from CLI to reflect this
- unlike Deno namespace, use of standard modules do not require --unstable flag, unless standard module itself uses an unstable Deno feature
- note: this is a deviation from the general pattern requiring --unstable flags!

## Query permissions at runtime

Occasionally you'll want to check whether permissions have been granted

given: `$ deno run --allow-read=/foo main.ts`

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
