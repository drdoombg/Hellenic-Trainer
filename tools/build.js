// Builds index.html from the parts in /src.   Run:  node tools/build.js
const fs=require('fs'),path=require('path');
const src=path.join(__dirname,'..','src'),rd=f=>fs.readFileSync(path.join(src,f),'utf8');
const HEAD=`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#1c5aa6">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="assets/icon.svg" type="image/svg+xml">
`;
let out=HEAD+rd('p1-head.html').replace('</style>','</style>\n</head>\n<body>');
for(const f of ['p2-hx.js','p3-scale.js','p4-fops8.js','p5-fopsx.js'])
  out+='\n<script>\n'+rd(f).replace(/\s+$/,'')+'\n</script>\n';
out+='</body>\n</html>\n';
fs.writeFileSync(path.join(__dirname,'..','index.html'),out);
console.log('index.html',(out.length/1024).toFixed(0)+' KB');
