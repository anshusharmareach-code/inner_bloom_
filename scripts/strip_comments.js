const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'src');
const exts = new Set(['.js', '.jsx', '.ts', '.tsx', '.css']);

function walk(dir) {
  const results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of list) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function stripCommentsFromJS(content) {

    let out = content.replace(/\/\*[\s\S]*?\*\//g, '');
    out = out.replace(/(^|[^:\\])\/\/.*$/gm, '$1');
    return out;
}

function stripCommentsFromCSS(content) {
    return content.replace(/\/\*[\s\S]*?\*\//g, '');
}

function processFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!exts.has(ext)) return false;

  const content = fs.readFileSync(filePath, 'utf8');
  let stripped = content;

  if (ext === '.css') {
    stripped = stripCommentsFromCSS(content);
  } else {
    stripped = stripCommentsFromJS(content);
  }


  stripped = stripped.replace(/\n[ \t]+\n/g, '\n\n');

  if (stripped !== content) {
    fs.writeFileSync(filePath + '.bak', content, 'utf8');
    fs.writeFileSync(filePath, stripped, 'utf8');
    return true;
  }
  return false;
}

function main() {
  console.log('Scanning', root);
  const files = walk(root);
  let changed = 0;
  for (const f of files) {
    try {
      if (processFile(f)) {
        console.log('Updated:', f);
        changed++;
      }
    } catch (err) {
      console.error('Error processing', f, err);
    }
  }
  console.log('Done. Files changed:', changed);
}

main();
