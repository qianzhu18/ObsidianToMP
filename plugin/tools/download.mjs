import fs from 'node:fs';
import https from 'node:https';

const owner = 'sunbooshi';
const repo = 'mweb-themes';
const assetName = 'assets.zip';
const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;

function requestJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'ObsidianToMP release tool' } }, (res) => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`GitHub API failed: HTTP ${res.statusCode} ${data}`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, target) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'ObsidianToMP release tool' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(res.headers.location, target).then(resolve, reject);
        return;
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        reject(new Error(`Download failed: HTTP ${res.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(target);
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
      file.on('error', reject);
    }).on('error', reject);
  });
}

const releaseInfo = await requestJson(apiUrl);
const asset = Array.isArray(releaseInfo.assets)
  ? releaseInfo.assets.find(item => item.name === assetName)
  : null;

if (!asset?.browser_download_url) {
  throw new Error(`未找到 ${assetName} 文件`);
}

console.log(`下载 ${assetName}: ${asset.browser_download_url}`);
await downloadFile(asset.browser_download_url, assetName);
console.log(`${assetName} 下载完成`);
