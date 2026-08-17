// Geocoding using Photon (Komoot) - built on OSM but better fuzzy search
export const searchLocations = async (query) => {
  if (!query || query.length < 3) return [];
  try {
    // We add a location bias for Nagpur (lat: 21.1458, lon: 79.0882)
    const response = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=21.1458&lon=79.0882&limit=5`
    );
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.features.map(item => {
      const p = item.properties;
      const displayName = [p.name, p.street, p.locality, p.city, p.state].filter(Boolean).join(', ');
      return {
        id: p.osm_id || Math.random().toString(),
        name: p.name || p.street || 'Unknown Location',
        displayName: displayName,
        lat: item.geometry.coordinates[1],
        lng: item.geometry.coordinates[0]
      };
    });
  } catch (error) {
    console.error("Geocoding error:", error);
    return [];
  }
};

// Routing using OSRM to get real road distance
export const calculateRouteInfo = async (coordinates) => {
  // coordinates should be an array of {lat, lng} objects in order: [pickup, drop1, drop2, ...]
  if (!coordinates || coordinates.length < 2) return null;
  
  try {
    // OSRM expects coordinates as lon,lat
    const coordsString = coordinates.map(c => `${c.lng},${c.lat}`).join(';');
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`
    );
    
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }
    
    const route = data.routes[0];
    
    // We need to return cumulative distances for each drop point
    // The OSRM API returns legs (segments between waypoints)
    const legs = route.legs;
    let cumulativeDistance = 0;
    const distances = []; // Array to store cumulative distance up to each waypoint (drop point)
    
    for (let i = 0; i < legs.length; i++) {
      // legs[i].distance is in meters
      const legDistanceKm = legs[i].distance / 1000;
      cumulativeDistance += legDistanceKm;
      distances.push(Number(cumulativeDistance.toFixed(2)));
    }
    
    return {
      totalDistance: Number((route.distance / 1000).toFixed(2)),
      distances: distances, // Cumulative distance to drop1, drop2...
      geometry: route.geometry
    };
  } catch (error) {
    console.error("Routing error:", error);
    return null;
  }
};
