import { cp, mkdir, rm } from 'node:fs/promises';
// Only generated build output is replaced; personal data lives in the browser.
await mkdir('dist', { recursive: true });
// Remove retired bundled books from previous generated builds.
await rm('dist/content', { recursive: true, force: true });
for (const item of ['index.html', 'manifest.webmanifest', 'sw.js', 'src', 'assets', 'content']) {
  await cp(item, `dist/${item}`, { recursive: true });
}
console.log('Static app built in dist/');
