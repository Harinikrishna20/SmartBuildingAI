export const demoLabel = 'Demo data only — this simulated view is for product demonstration.'

export const waterHistory = [
  { date: '2026-09-01 06:00', usage: 470 },
  { date: '2026-09-02 06:00', usage: 520 },
  { date: '2026-09-03 06:00', usage: 560 },
  { date: '2026-09-04 06:00', usage: 490 },
  { date: '2026-09-05 06:00', usage: 610 },
  { date: '2026-09-06 06:00', usage: 720 },
  { date: '2026-09-07 06:00', usage: 790 },
  { date: '2026-09-08 06:00', usage: 820 },
]

export const electricityHistory = [
  { date: '2026-09-01', usage: 8.2 },
  { date: '2026-09-02', usage: 8.7 },
  { date: '2026-09-03', usage: 9.3 },
  { date: '2026-09-04', usage: 9.5 },
  { date: '2026-09-05', usage: 10.2 },
  { date: '2026-09-06', usage: 12.6 },
  { date: '2026-09-07', usage: 15.4 },
  { date: '2026-09-08', usage: 16.1 },
]

export const waterPrediction = {
  current: 850,
  average: 610,
  predicted: 850,
  normalMin: 500,
  normalMax: 600,
  anomaly: 'High anomaly risk',
  status: 'Above normal',
  explanation: [
    "Today's usage is 42% above normal.",
    'Consumption increased for 3 consecutive readings.',
    'This pattern is uncommon in historical data.'
  ]
}

export const electricityPrediction = {
  current: 16.2,
  average: 9.8,
  predicted: 16.2,
  normalMin: 8,
  normalMax: 11,
  anomaly: 'High consumption trend',
  status: 'Higher-than-usual electricity consumption predicted.',
  recommendation: 'Check whether high-consumption appliances are running longer than usual.'
}

export const demoResidents = [
  {
    id: 'resident-1',
    fullName: 'Harini Perera',
    email: 'harini@smartbuilding.ai',
    phone: '+94 77 123 4567',
    password: 'demo123',
    role: 'resident',
    location: 'Colombo 07',
    latitude: 6.9271,
    longitude: 79.8612,
    address: '2nd Floor, Orchard Apartments, Colombo 07'
  }
]

export const demoServiceProviders = [
  {
    id: 'provider-1',
    fullName: 'Raj Kumar',
    email: 'raj@smartbuilding.ai',
    phone: '+94 71 321 4567',
    password: 'provider123',
    role: 'serviceProvider',
    serviceCategory: 'Plumber',
    workingLocation: 'Colombo 06',
    availability: 'Available',
    experience: '7 years',
    latitude: 6.9261,
    longitude: 79.8687
  },
  {
    id: 'provider-2',
    fullName: 'Suresh Fernando',
    email: 'suresh@smartbuilding.ai',
    phone: '+94 75 998 1122',
    password: 'provider123',
    role: 'serviceProvider',
    serviceCategory: 'Plumber',
    workingLocation: 'Colombo 05',
    availability: 'Available',
    experience: '5 years',
    latitude: 6.932,
    longitude: 79.847
  },
  {
    id: 'provider-3',
    fullName: 'Nimal Senanayake',
    email: 'nimal@smartbuilding.ai',
    phone: '+94 77 446 5544',
    password: 'provider123',
    role: 'serviceProvider',
    serviceCategory: 'Electrician',
    workingLocation: 'Borella',
    availability: 'Busy',
    experience: '9 years',
    latitude: 6.909,
    longitude: 79.881
  }
]

export const initialRequests = [
  {
    id: 'REQ-1024',
    residentId: 'resident-1',
    residentName: 'Harini Perera',
    category: 'Water Leakage',
    issueCategory: 'Plumbing',
    description: 'Water is leaking underneath the kitchen sink.',
    photo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    location: 'Colombo 07',
    latitude: 6.9271,
    longitude: 79.8612,
    requestedAt: '2026-09-08 09:15',
    priority: 87,
    priorityLabel: 'High',
    status: 'accepted',
    providerId: 'provider-1',
    providerName: 'Raj Kumar',
    providerCategory: 'Plumber',
    distance: '0.8 km',
    aiClassification: 'Plumbing → Water Leakage',
    aiReason: 'Possible water-related issue with potential property damage.',
    timeline: ['Request submitted', 'Provider accepted', 'Work in progress']
  },
  {
    id: 'REQ-1025',
    residentId: 'resident-1',
    residentName: 'Harini Perera',
    category: 'Electrical Issue',
    issueCategory: 'Electrical Issue',
    description: 'Power fluctuation in the kitchen circuit breaker area.',
    photo: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
    location: 'Colombo 07',
    latitude: 6.9271,
    longitude: 79.8612,
    requestedAt: '2026-09-08 13:10',
    priority: 98,
    priorityLabel: 'Critical',
    status: 'requested',
    providerId: null,
    providerName: null,
    providerCategory: null,
    distance: '1.2 km',
    aiClassification: 'Electrical Issue',
    aiReason: 'Potential electrical hazard if left untreated.',
    timeline: ['Request submitted']
  },
  {
    id: 'REQ-1026',
    residentId: 'resident-1',
    residentName: 'Harini Perera',
    category: 'Appliance Repair',
    issueCategory: 'Appliance Repair',
    description: 'Washing machine is making a loud grinding noise during spin cycle.',
    photo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    location: 'Colombo 07',
    latitude: 6.9271,
    longitude: 79.8612,
    requestedAt: '2026-09-07 09:00',
    priority: 50,
    priorityLabel: 'Medium',
    status: 'completed',
    providerId: 'provider-3',
    providerName: 'Nimal Senanayake',
    providerCategory: 'Electrician',
    distance: '2.1 km',
    aiClassification: 'Appliance Repair',
    aiReason: 'Possible appliance wear or alignment issue.',
    timeline: ['Request submitted', 'Provider accepted', 'Work in progress', 'Completed']
  }
]

export const notificationList = [
  { id: 1, type: 'AI Alert', title: 'Unusual water consumption detected.', read: false, time: '2 mins ago' },
  { id: 2, type: 'Maintenance', title: 'Raj Kumar accepted your plumbing request.', read: true, time: '35 mins ago' },
  { id: 3, type: 'Maintenance', title: 'Your service request is now In Progress.', read: false, time: '1 hour ago' },
  { id: 4, type: 'Maintenance', title: 'Your repair request has been completed.', read: true, time: 'Yesterday' }
]

export const providerNotifications = [
  { id: 1, type: 'New Request', title: 'New nearby plumbing request — 0.8 km', read: false, time: '2 mins ago' },
  { id: 2, type: 'Request Update', title: 'Your request has been accepted.', read: true, time: '20 mins ago' },
  { id: 3, type: 'Job Update', title: 'Job marked In Progress.', read: false, time: '1 hour ago' },
  { id: 4, type: 'Job Update', title: 'Job completed.', read: true, time: 'Yesterday' }
]

export const nearbyProviders = [
  {
    id: 'prov-1',
    name: 'Raj Kumar',
    serviceCategory: 'Plumber',
    distance: '0.8 km away',
    availability: 'Available',
    matchScore: 94,
    provider: {
      fullName: 'Raj Kumar',
      serviceCategory: 'Plumber',
      workingLocation: 'Colombo 06',
      availability: 'Available',
      experience: '7 years'
    }
  },
  {
    id: 'prov-2',
    name: 'Suresh',
    serviceCategory: 'Plumber',
    distance: '2.4 km away',
    availability: 'Available',
    matchScore: 78,
    provider: {
      fullName: 'Suresh Fernando',
      serviceCategory: 'Plumber',
      workingLocation: 'Colombo 05',
      availability: 'Available',
      experience: '5 years'
    }
  },
  {
    id: 'prov-3',
    name: 'Nimal Senanayake',
    serviceCategory: 'Electrician',
    distance: '1.6 km away',
    availability: 'Busy',
    matchScore: 72,
    provider: {
      fullName: 'Nimal Senanayake',
      serviceCategory: 'Electrician',
      workingLocation: 'Borella',
      availability: 'Busy',
      experience: '9 years'
    }
  }
]
