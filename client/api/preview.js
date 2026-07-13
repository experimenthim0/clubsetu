export default async function handler(req, res) {
  const { slug } = req.query;
  const host = req.headers.host || '';
  
  // Use the production backend domain if VITE_API_URL is not set
  const apiUrl = process.env.VITE_API_URL || 'https://clubsetu-backend.onrender.com';
  
  try {
    // Fetch event details from backend
    const eventRes = await fetch(`${apiUrl}/api/events/${slug}`);
    if (!eventRes.ok) {
      throw new Error('Event not found');
    }
    const event = await eventRes.json();
    
    // Construct preview metadata
    const title = `${event.title} | CampusNode`;
    const description = event.description || "Join this amazing event on CampusNode!";
    const imageUrl = event.imageUrl || `https://${host}/CLUBSETU.png`;
    
    // Return crawler-friendly HTML with OG and Twitter tags pre-rendered in <head>
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate'); // cache on Vercel edge for 10 minutes
    res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:url" content="https://${host}/event/${slug}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
</head>
<body>
  <p>Redirecting to event details...</p>
  <script>
    window.location.href = "/event/${slug}";
  </script>
</body>
</html>`);
  } catch (error) {
    console.error('Preview generation failed:', error);
    // Return a generic fallback HTML page
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CampusNode - Event Management</title>
  <meta name="description" content="Discover, organize, and manage campus events, club activities, and lost & found reports in one place." />
  <meta property="og:title" content="CampusNode - Event Management" />
  <meta property="og:description" content="Discover, organize, and manage campus events, club activities, and lost & found reports in one place." />
  <meta property="og:image" content="https://${host}/CLUBSETU.png" />
  <meta property="og:url" content="https://${host}/event/${slug}" />
  <meta property="og:type" content="website" />
</head>
<body>
  <p>Redirecting...</p>
  <script>
    window.location.href = "/event/${slug}";
  </script>
</body>
</html>`);
  }
}
