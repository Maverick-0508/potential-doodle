// Next.js API route for MPESA timeout callbacks
// This route handles MPESA timeout notifications

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      message: 'Method not allowed',
      success: false 
    });
  }

  try {
    // Log the timeout callback
    console.log('MPESA Timeout callback received:', {
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Forward timeout to backend for processing
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${backendUrl}/api/wallet/mpesa/timeout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-From': 'frontend-timeout',
      },
      body: JSON.stringify(req.body)
    });

    const result = await response.json();

    // Return success response to MPESA
    return res.status(200).json({ 
      ResultCode: 0,
      ResultDesc: "Timeout processed successfully",
      success: true
    });

  } catch (error) {
    console.error('MPESA Timeout error:', error);
    
    // Still return success to MPESA to avoid retries
    return res.status(200).json({ 
      ResultCode: 0,
      ResultDesc: "Timeout acknowledged",
      success: false,
      error: error.message 
    });
  }
}