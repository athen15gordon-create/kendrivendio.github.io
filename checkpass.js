exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ ok: false }) };
  }

  const correct = process.env.UPLOAD_PASSWORD;
  const given   = body.password;

  if (!correct) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Server misconfigured' }) };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: given === correct }),
  };
};
