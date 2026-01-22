import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";

const PORT = 8000;

const MIME_TYPES = {
  default: "application/octet-stream",
  html: "text/html; charset=UTF-8",
  js: "text/javascript",
  css: "text/css",
  mp3: "audio/mpeg",
  png: "image/png",
  jpg: "image/jpeg",
  gif: "image/gif",
  ico: "image/x-icon",
  svg: "image/svg+xml",
};


const STATIC_PATH = path.resolve(process.argv[2] ?? path.join(process.cwd(), "static"));

const toBool = [() => true, () => false];

const prepareFile = async (url) => {
  let requestPath = new URL(url, "http://localhost").pathname;
  try {
    requestPath = decodeURIComponent(requestPath);
  } catch {
    // Ignore invalid URL encoding
  }

  const relativePath = requestPath.replace(/^\/+/, "");
  const hasExtension = path.extname(relativePath) !== "";
  const candidates = [];

  if (requestPath.endsWith("/")) {
    candidates.push(path.join(relativePath, "index.html"));
  } else {
    candidates.push(relativePath);
    if (!hasExtension) {
      candidates.push(path.join(relativePath, "index.html"));
      candidates.push(`${relativePath}.html`);
    }
  }

  const withinRoot = (absolutePath) =>
    absolutePath === STATIC_PATH || absolutePath.startsWith(`${STATIC_PATH}${path.sep}`);

  for (const candidate of candidates) {
    const filePath = path.resolve(STATIC_PATH, candidate);
    if (!withinRoot(filePath)) continue;
    const stat = await fs.promises.stat(filePath).catch(() => null);
    if (stat?.isFile()) {
      const ext = path.extname(filePath).substring(1).toLowerCase();
      return { found: true, ext, stream: fs.createReadStream(filePath) };
    }
  }

  const notFoundPath = path.resolve(STATIC_PATH, "404.html");
  const notFoundExists = withinRoot(notFoundPath) && (await fs.promises.access(notFoundPath).then(...toBool));
  if (notFoundExists) {
    const ext = path.extname(notFoundPath).substring(1).toLowerCase();
    return { found: false, ext, stream: fs.createReadStream(notFoundPath) };
  }

  return { found: false, ext: "txt", body: "404 Not Found\n" };
};

const requestHandler = async (req, res) => {
  const file = await prepareFile(req.url);
  const statusCode = file.found ? 200 : 404;
  const mimeType = MIME_TYPES[file.ext] || MIME_TYPES.default;
  res.writeHead(statusCode, { "Content-Type": mimeType });
  if (file.stream) file.stream.pipe(res);
  else res.end(file.body ?? "");
  console.log(`${req.method} ${req.url} ${statusCode}`);
};

console.log(`Serving static files from: ${STATIC_PATH}`);

// Listen on both IPv6 and IPv4 loopback to support localhost and 127.0.0.1
const servers = [];

const listen = (host, label) => {
  const srv = http.createServer(requestHandler);
  srv.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      console.warn(`Port ${PORT} already bound for ${host}, skipping.`);
    } else if (err && (err.code === "EADDRNOTAVAIL" || err.code === "EAFNOSUPPORT")) {
      console.warn(`Address ${host} not available, skipping.`);
    } else {
      console.error(`Server error on ${host}:`, err);
    }
  });
  srv.listen({ port: PORT, host }, () => {
    console.log(`Server running at http://${label}:${PORT}/`);
  });
  servers.push(srv);
};

// Try IPv6 loopback first (works when localhost resolves to ::1)
listen("::1", "[::1]");
// Also bind IPv4 loopback so 127.0.0.1 works even if IPv6 is v6-only
listen("127.0.0.1", "127.0.0.1");