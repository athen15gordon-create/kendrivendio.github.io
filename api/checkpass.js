export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const correct = process.env.UPLOAD_PASSWORD;
  if (!correct) {
    return res.status(500).json({ ok: false, error: 'Server misconfigured' });
  }

  let given;
  try {
    const raw = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });
    given = JSON.parse(raw).password;
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid request body' });
  }

  return res.status(200).json({ ok: given === correct });
}
