// Next.js API route for MPESA callback
// This route handles MPESA payment callbacks and forwards them to the backend

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      message: 'Method not allowed',
      success: false 
    });
  }

  try {
    // Log the incoming callback for debugging
    console.log('MPESA Callback received:', {
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Forward the callback to the backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${backendUrl}/api/wallet/mpesa/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-From': 'frontend-callback',
      },
      body: JSON.stringify(req.body)
    });

    const result = await response.json();

    // Return the backend response
    return res.status(response.status).json(result);

  } catch (error) {
    console.error('MPESA Callback error:', error);
    
    return res.status(500).json({ 
      message: 'Internal server error processing callback',
      success: false,
      error: error.message 
    });
  }
}