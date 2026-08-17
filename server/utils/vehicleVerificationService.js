const axios = require('axios');

/**
 * Service to verify vehicle details against an external RC verification provider.
 * Normalizes the response and scrubs sensitive information.
 */
async function verifyVehicleRegistration(plateNumber) {
  const normalizedPlate = String(plateNumber).replace(/\s+/g, '').toUpperCase();
  const apiUrl = process.env.RC_API_URL;
  const apiKey = process.env.RC_API_KEY;

  // Fallback if credentials are missing
  if (!apiUrl || !apiKey) {
    console.warn('[VehicleVerificationService] RC_API_URL or RC_API_KEY missing. Verification unavailable.');
    return {
      verified: false,
      source: 'Unavailable',
      lastVerifiedAt: new Date(),
      vehicle: null
    };
  }

  try {
    const response = await axios.get(`${apiUrl}/verify`, {
      params: { reg_no: normalizedPlate },
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000 // 5 seconds timeout
    });

    const data = response.data;

    // Simulate extracting only safe and normalized data from the provider
    // The exact fields depend on the actual provider's schema
    return {
      verified: true,
      source: 'RC Verification Provider',
      lastVerifiedAt: new Date(),
      vehicle: {
        registrationNumber: normalizedPlate,
        vehicleType: data.vehicle_type || 'Auto Rickshaw',
        fuelType: data.fuel_type || 'CNG',
        registrationDate: data.registration_date || null,
        registrationStatus: data.status || 'Active',
      }
    };
  } catch (error) {
    console.error(`[VehicleVerificationService] Verification failed for plate ${normalizedPlate}:`, error.message);
    // Return gracefully so the UI doesn't break
    return {
      verified: false,
      source: 'Verification Error',
      lastVerifiedAt: new Date(),
      vehicle: null
    };
  }
}

module.exports = {
  verifyVehicleRegistration
};
