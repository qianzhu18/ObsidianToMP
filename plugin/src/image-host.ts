import { getBlobArrayBuffer, requestUrl } from 'obsidian';
import { AwsClient } from 'aws4fetch';
import { mimeToImageExt } from './utils';

export interface S3CompatibleImageHostConfig {
  enabled: boolean;
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
  pathPrefix: string;
  autoUploadOnCopyWithoutWx: boolean;
}

export interface CloudUploadResult {
  key: string;
  url: string;
}

function trimSlashes(input: string) {
  return input.replace(/^\/+|\/+$/g, '');
}

function trimTrailingSlash(input: string) {
  return input.replace(/\/+$/g, '');
}

function normalizeHttpUrl(input: string, fieldName: string, required = true) {
  const raw = input.trim();
  if (!raw) {
    if (required) {
      throw new Error(`请先配置云端图床 ${fieldName}`);
    }
    return '';
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch (error) {
    throw new Error(`云端图床 ${fieldName} 配置错误，请填写完整域名或 URL`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`云端图床 ${fieldName} 仅支持 http 或 https`);
  }
  return trimTrailingSlash(parsed.toString());
}

function normalizeFileName(fileName: string, contentType: string) {
  const cleanName = fileName.trim().replace(/[^\w.\-]/g, '_');
  if (cleanName.includes('.')) {
    return cleanName;
  }
  return cleanName + mimeToImageExt(contentType || 'image/jpeg');
}

function encodePath(path: string) {
  return path.split('/').map(encodeURIComponent).join('/');
}

function parseErrorMessage(status: number, text: string) {
  const t = text.trim();
  if (t.length === 0) {
    return `上传失败，HTTP ${status}`;
  }
  return `上传失败，HTTP ${status}: ${t.slice(0, 240)}`;
}

export class CloudImageUploader {
  config: S3CompatibleImageHostConfig;

  constructor(config: S3CompatibleImageHostConfig) {
    this.config = config;
  }

  private getEndpoint() {
    return normalizeHttpUrl(this.config.endpoint, 'Endpoint');
  }

  private getPublicBaseUrl() {
    return normalizeHttpUrl(this.config.publicBaseUrl || '', 'Public Base URL', false);
  }

  private validate() {
    this.getEndpoint();
    if (!this.config.bucket) {
      throw new Error('请先配置云端图床 Bucket');
    }
    if (!this.config.accessKeyId) {
      throw new Error('请先配置云端图床 AccessKey ID');
    }
    if (!this.config.secretAccessKey) {
      throw new Error('请先配置云端图床 Secret Access Key');
    }
  }

  private makeObjectKey(fileName: string, contentType: string) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).slice(2, 8);
    const normalizedName = normalizeFileName(fileName, contentType);
    const prefix = trimSlashes(this.config.pathPrefix || '');
    const filename = `${Date.now()}-${rand}-${normalizedName}`;
    if (prefix) {
      return `${prefix}/${yyyy}/${mm}/${dd}/${filename}`;
    }
    return `${yyyy}/${mm}/${dd}/${filename}`;
  }

  private getUploadUrl(key: string) {
    const endpoint = this.getEndpoint();
    const bucket = encodeURIComponent(this.config.bucket);
    return `${endpoint}/${bucket}/${encodePath(key)}`;
  }

  private getPublicUrl(key: string) {
    const encodedKey = encodePath(key);
    const customBase = this.getPublicBaseUrl();
    if (customBase.length > 0) {
      return `${customBase}/${encodedKey}`;
    }
    const endpoint = this.getEndpoint();
    const bucket = encodeURIComponent(this.config.bucket);
    return `${endpoint}/${bucket}/${encodedKey}`;
  }

  async uploadBlob(blob: Blob, fileName: string): Promise<CloudUploadResult> {
    this.validate();

    const region = this.config.region || 'auto';
    const objectKey = this.makeObjectKey(fileName, blob.type || 'image/jpeg');
    const uploadUrl = this.getUploadUrl(objectKey);

    const awsClient = new AwsClient({
      accessKeyId: this.config.accessKeyId,
      secretAccessKey: this.config.secretAccessKey,
      service: 's3',
      region,
    });

    const request = new Request(uploadUrl, {
      method: 'PUT',
      headers: {
        'content-type': blob.type || 'application/octet-stream',
      },
      body: blob,
    });
    const signed = await awsClient.sign(request);
    const headers: Record<string, string> = {};
    signed.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const res = await requestUrl({
      url: signed.url,
      method: 'PUT',
      throw: false,
      headers,
      body: await getBlobArrayBuffer(blob),
    });

    if (res.status < 200 || res.status >= 300) {
      throw new Error(parseErrorMessage(res.status, res.text || ''));
    }

    return {
      key: objectKey,
      url: this.getPublicUrl(objectKey),
    };
  }

  async uploadTestImage() {
    const base64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9lQw2CgAAAABJRU5ErkJggg==';
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: 'image/png' });
    return this.uploadBlob(blob, 'health-check.png');
  }
}
