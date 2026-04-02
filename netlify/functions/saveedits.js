const https = require('https');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = process.env.GITHUB_TOKEN;
  const repo  = process.env.GITHUB_REPO; // e.g. "kendrivendio/kendrivendio.github.io"

  if (!token || !repo) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Missing env vars' }) };
  }

  let edits;
  try {
    edits = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid JSON' }) };
  }

  const path    = 'edits.json';
  const content = Buffer.from(JSON.stringify(edits, null, 2)).toString('base64');
  const apiHost = 'api.github.com';
  const apiPath = `/repos/${repo}/contents/${path}`;

  // First GET to find the current SHA (needed to update an existing file)
  async function githubRequest(method, apiPath, body) {
    return new Promise((resolve, reject) => {
      const data = body ? JSON.stringify(body) : null;
      const req = https.request({
        hostname: apiHost,
        path: apiPath,
        method,
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent':    'kendri-portfolio',
          'Content-Type':  'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      }, res => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
          catch { resolve({ status: res.statusCode, body: raw }); }
        });
      });
      req.on('error', reject);
      if (data) req.write(data);
      req.end();
    });
  }

  // Get current file SHA if it exists
  let sha;
  const getRes = await githubRequest('GET', apiPath);
  if (getRes.status === 200) sha = getRes.body.sha;

  // PUT new content
  const putBody = {
    message: 'Update edits.json via portfolio editor',
    content,
    ...(sha ? { sha } : {}),
  };

  const putRes = await githubRequest('PUT', apiPath, putBody);

  if (putRes.status === 200 || putRes.status === 201) {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } else {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: putRes.body.message || 'GitHub API error' }),
    };
  }
};
