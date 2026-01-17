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

http
  .createServer(async (req, res) => {
    const file = await prepareFile(req.url);
    const statusCode = file.found ? 200 : 404;
    const mimeType = MIME_TYPES[file.ext] || MIME_TYPES.default;
    res.writeHead(statusCode, { "Content-Type": mimeType });
    if (file.stream) file.stream.pipe(res);
    else res.end(file.body ?? "");
    console.log(`${req.method} ${req.url} ${statusCode}`);
  })
  .listen(PORT);

console.log(`Serving static files from: ${STATIC_PATH}`);
console.log(`Server running at http://127.0.0.1:${PORT}/`);