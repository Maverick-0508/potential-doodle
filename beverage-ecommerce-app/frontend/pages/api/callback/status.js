// Next.js API route for payment status callbacks
// This route handles payment status updates and notifications

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'POST':
      return handleCallback(req, res);
    case 'GET':
      return getCallbackStatus(req, res);
    default:
      return res.status(405).json({ 
        message: `Method ${method} not allowed`,
        success: false 
      });
  }
}

async function handleCallback(req, res) {
  try {
    const { type, data, reference } = req.body;

    console.log('Payment callback received:', {
      type,
      reference,
      timestamp: new Date().toISOString()
    });

    // Forward to backend for processing
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${backendUrl}/api/callback/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-From': 'frontend-callback',
      },
      body: JSON.stringify(req.body)
    });

    const result = await response.json();

    return res.status(response.status).json({
      message: 'Callback processed successfully',
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Callback processing error:', error);
    
    return res.status(500).json({ 
      message: 'Failed to process callback',
      success: false,
      error: error.message 
    });
  }
}

async function getCallbackStatus(req, res) {
  const { reference } = req.query;

  if (!reference) {
    return res.status(400).json({
      message: 'Reference parameter is required',
      success: false
    });
  }

  try {
    // Forward status check to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${backendUrl}/api/callback/status?reference=${reference}`, {
      method: 'GET',
      headers: {
        'X-Forwarded-From': 'frontend-callback',
      }
    });

    const result = await response.json();

    return res.status(response.status).json(result);

  } catch (error) {
    console.error('Status check error:', error);
    
    return res.status(500).json({ 
      message: 'Failed to check callback status',
      success: false,
      error: error.message 
    });
  }
}