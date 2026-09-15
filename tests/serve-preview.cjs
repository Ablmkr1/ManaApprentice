const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json'};
http.createServer((req,res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/tests/overhaul-preview.html') {
    const html = fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<head>', '<head><base href="/">').replace(/src="save\.js[^\"]*"/, 'src="/tests/overhaul-preview-save.js"').replace('</body>', '<script src="/tests/overhaul-preview.js"></script></body>');
    res.writeHead(200, {'Content-Type':'text/html','Cache-Control':'no-store'});res.end(html);return;
  }
  if (url.pathname === '/tests/overhaul-preview-save.js') {
    const script = fs.readFileSync(path.join(root,'save.js'),'utf8').replace('"manaApprenticeSaveV1"','"manaApprenticeOverhaulDisposableQA"').replace('let saveSuppressed = false','let saveSuppressed = true');
    res.writeHead(200, {'Content-Type':'text/javascript','Cache-Control':'no-store'});res.end(script);return;
  }
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname === '/' ? '/index.html' : new URL(req.url,'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err,data) => { res.writeHead(err ? 404 : 200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store'}); res.end(err ? 'Not found' : data); });
}).listen(8765,'127.0.0.1',()=>console.log('Preview: http://localhost:8765'));
