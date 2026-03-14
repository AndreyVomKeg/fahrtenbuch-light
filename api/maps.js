export default async function handler(req, res) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not configured' });
  }

  const { origin, destination } = req.query;
  if (!origin || !destination) {
    return res.status(400).json({ error: 'origin and destination required' });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}&language=de&units=metric`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.rows?.[0]?.elements?.[0]?.status === 'OK') {
      const el = data.rows[0].elements[0];
      return res.status(200).json({
        distance: el.distance.text,
        duration: el.duration.text,
        distanceMeters: el.distance.value,
        durationSeconds: el.duration.value
      });
    }

    return res.status(400).json({ error: 'Route not found', raw: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
