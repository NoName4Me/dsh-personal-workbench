import { spawn, spawnSync } from "node:child_process"
import { cpSync, existsSync, mkdirSync, readFileSync, watch } from "node:fs"
import { homedir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
const name = manifest.name
const version = manifest.version
const supported = String(manifest.engines?.dsh ?? "").split("||").map(value => value.trim()).filter(Boolean)
const dshBin = process.env.DSH_BIN || "dsh"
const dshHome = process.env.DSH_HOME ? resolve(process.env.DSH_HOME) : join(homedir(), ".dsh")
const options = {
  profile: process.env.DSH_DEV_PROFILE || "workbench-dev",
  from: process.env.DSH_DEV_FROM || "web",
  port: process.env.DSH_DEV_PORT || "5273",
  open: true,
  watch: true,
  build: true,
  allowVersion: false,
  extra: [],
}

const usage = `Usage: pnpm dev [options] [-- <dsh web args>]

Built the plugin, link it into an isolated DSH profile, and boot the web UI.
Source changes rebuild automatically and reload in the open page through DSH client HMR.

Options:
  --profile <name>   DSH profile to install into (default: workbench-dev)
  --from <name>      profile to clone on first run (default: web)
  --port <port>      web UI port (default: 5273; 0 lets the OS choose)
  --no-open          do not open the browser
  --no-watch         build and boot without watching source files
  --no-build         skip the initial build
  --allow-version    grant an exact-version exemption when dsh does not match engines.dsh
  -h, --help         show this help

Environment: DSH_BIN, DSH_HOME, DSH_DEV_PROFILE, DSH_DEV_FROM, DSH_DEV_PORT`

function fail(message) {
  process.stderr.write(`[dev] ${message}\n`)
  process.exit(1)
}

function value(args, index, flag) {
  const next = args[index]
  if (next === undefined || next.startsWith("-")) fail(`${flag} needs a value`)
  return next
}

const argv = process.argv.slice(2)
for (let index = 0; index < argv.length; index++) {
  const argument = argv[index]
  if (argument === "--") {
    options.extra.push(...argv.slice(index + 1))
    break
  }
  switch (argument) {
    case "--profile": options.profile = value(argv, ++index, argument); break
    case "--from": options.from = value(argv, ++index, argument); break
    case "--port": options.port = value(argv, ++index, argument); break
    case "--no-open": options.open = false; break
    case "--no-watch": options.watch = false; break
    case "--no-build": options.build = false; break
    case "--allow-version": options.allowVersion = true; break
    case "-h":
    case "--help": process.stdout.write(`${usage}\n`); process.exit(0)
    default:
      if (argument.startsWith("-")) fail(`unknown option ${argument}\n\n${usage}`)
      options.extra.push(argument)
  }
}

if (options.profile.toLowerCase() === "desktop") {
  fail("the desktop profile is managed exclusively by DSH Desktop; use the default workbench-dev profile or --profile web")
}
if (!/^\d+$/.test(options.port)) fail(`--port must be a non-negative integer, got ${JSON.stringify(options.port)}`)

const profileDir = join(dshHome, "profiles", options.profile)

function runtimeVersion() {
  const result = spawnSync(dshBin, ["--version"], { cwd: root, encoding: "utf8" })
  if (result.error !== undefined) {
    fail(`cannot run ${dshBin} (${result.error.message}); install it with "pnpm add -g @deepseek-ai/dsh@${supported.at(-1)}" or set DSH_BIN`)
  }
  const output = `${result.stdout ?? ""}`.trim().split(/\s+/).pop()
  if (result.status !== 0 || output === undefined) fail(`"${dshBin} --version" failed: ${`${result.stderr ?? ""}`.trim()}`)
  return output
}

function runDsh(args, stdio = "inherit") {
  const result = spawnSync(dshBin, args, { cwd: root, stdio, encoding: "utf8" })
  if (result.error !== undefined) fail(`cannot run ${dshBin}: ${result.error.message}`)
  return result
}

function ensureProfile() {
  if (existsSync(join(profileDir, "package.json"))) return
  const source = join(dshHome, "profiles", options.from)
  mkdirSync(profileDir, { recursive: true })
  if (existsSync(join(source, "package.json"))) {
    for (const file of ["package.json", "cordis.patch.yml", "pnpm-workspace.yaml", ".npmrc"]) {
      if (existsSync(join(source, file))) cpSync(join(source, file), join(profileDir, file))
    }
    process.stdout.write(`[dev] created profile ${options.profile} from ${options.from}\n`)
    return
  }
  process.stdout.write(`[dev] profile ${options.from} not found; initializing ${options.profile} from the shipped web template\n`)
  const result = runDsh([options.profile, "--from-default-profile", "web", "--dump-config"], "ignore")
  if (result.status !== 0 || !existsSync(join(profileDir, "package.json"))) {
    fail(`could not initialize profile ${options.profile}; run "dsh ${options.profile} --from-default-profile web" once, then retry`)
  }
}

function build() {
  process.stdout.write("[dev] building dist/client.js\n")
  const result = spawnSync(process.execPath, [join(root, "scripts/build.mjs")], { cwd: root, stdio: "inherit" })
  if (result.error !== undefined) throw result.error
  if (result.status !== 0) throw new Error("build failed")
}

function install() {
  const result = runDsh(["plugin", "--profile", options.profile, "add", `link:${root}`])
  if (result.status !== 0) {
    fail(`could not install ${name} into ${options.profile}; see the pnpm output above`)
  }
  const installed = JSON.parse(readFileSync(join(profileDir, "package.json"), "utf8"))
  const dependency = installed.dependencies?.[name]
  if (typeof dependency !== "string" || !dependency.startsWith("link:")) {
    fail(`profile ${options.profile} does not depend on ${name} through a link: spec`)
  }
  if (!Array.isArray(installed.dsh?.profile?.bundles) || !installed.dsh.profile.bundles.includes(name)) {
    fail(`profile ${options.profile} did not activate ${name}; check the plugin bundle patch`)
  }
  if (!installed.dsh.profile.bundles.includes("@deepseek-ai/dsh-web-app")) {
    fail(`profile ${options.profile} is not a web profile; use the default profile or --from web`)
  }
}

function grantVersionExemption(runtime) {
  process.stderr.write(
    `[dev] warning: dsh ${runtime} is not one of ${supported.join(", ")};`
    + ` granting an exact-version exemption in ${options.profile} only\n`,
  )
  const result = runDsh([
    "plugin", "--profile", options.profile, "allow-version", `${name}@${version}`,
    "--dsh-version", runtime, "--accept-risk",
  ])
  if (result.status !== 0) fail("could not grant the version exemption")
}

function boot() {
  const args = [options.profile]
  if (options.port !== "0") args.push("--port", options.port)
  else args.push("--port", "0")
  if (!options.open) args.push("--no-open")
  args.push(...options.extra)
  process.stdout.write(`[dev] booting dsh ${options.profile}${options.port === "0" ? "" : ` on port ${options.port}`}\n`)
  const child = spawn(dshBin, args, { cwd: process.cwd(), stdio: "inherit", env: process.env })
  child.on("error", error => fail(`could not start ${dshBin}: ${error.message}`))
  return child
}

function watchSource() {
  let timer
  let building = false
  let queued = false
  const rebuild = () => {
    if (building) {
      queued = true
      return
    }
    building = true
    try {
      build()
      process.stdout.write("[dev] rebuilt; the open DSH page reloads the plugin through client HMR\n")
    } catch (error) {
      process.stderr.write(`[dev] ${error instanceof Error ? error.message : String(error)}\n`)
    } finally {
      building = false
      if (queued) {
        queued = false
        rebuild()
      }
    }
  }
  const watcher = watch(join(root, "src"), { recursive: true }, () => {
    clearTimeout(timer)
    timer = setTimeout(rebuild, 120)
  })
  process.stdout.write("[dev] watching src/** — save a file to rebuild\n")
  return () => {
    clearTimeout(timer)
    watcher.close()
  }
}

const runtime = runtimeVersion()
if (!supported.includes(runtime)) {
  if (!options.allowVersion) {
    fail(
      `dsh ${runtime} is not one of ${supported.join(", ")}; upgrade with`
      + ` "pnpm add -g @deepseek-ai/dsh@${supported.at(-1)}", or pass --allow-version to test on this runtime`,
    )
  }
}
ensureProfile()
if (!supported.includes(runtime)) {
  grantVersionExemption(runtime)
}
if (options.build) {
  try {
    build()
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error))
  }
}
install()

const child = boot()
const stopWatching = options.watch ? watchSource() : () => {}
let stopping = false
const stop = (signal) => {
  if (stopping) return
  stopping = true
  stopWatching()
  if (child.exitCode === null && child.signalCode === null) child.kill(signal)
}
process.on("SIGINT", () => stop("SIGINT"))
process.on("SIGTERM", () => stop("SIGTERM"))
child.on("exit", (code, signal) => {
  stopWatching()
  if (signal !== null) process.exit(0)
  process.exit(code ?? 0)
})
