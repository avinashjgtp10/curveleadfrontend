// Static demo data for the Super Admin mock console (frontend-only, no backend calls).

export const MOCK_SUPERADMIN_CREDENTIALS = {
  email: 'admin@curved.com',
  password: '12345678',
};

export const MOCK_SESSION_KEY = 'curvelead_mock_superadmin';

export const SERVICE_OPTIONS = ['Haircut', 'Facial', 'Spa', 'Manicure', 'Pedicure', 'Massage'];

export const INITIAL_LEADS = [
  { id: 1, name: 'Sneha Patil', phone: '8765432101', email: 'sneha@gmail.com', service: 'Haircut', status: 'Interested', createdAt: '2 hours ago' },
  { id: 2, name: 'Rohit Sharma', phone: '9876543210', email: 'rohit@gmail.com', service: 'Facial', status: 'Contacted', createdAt: '3 hours ago' },
  { id: 3, name: 'Pooja Desai', phone: '9988776655', email: 'pooja@gmail.com', service: 'Spa', status: 'New', createdAt: '5 hours ago' },
  { id: 4, name: 'Aditya Kulkarni', phone: '9123456780', email: 'aditya@gmail.com', service: 'Haircut', status: 'Interested', createdAt: '6 hours ago' },
  { id: 5, name: 'Neha More', phone: '9328765431', email: 'neha@gmail.com', service: 'Facial', status: 'Contacted', createdAt: '8 hours ago' },
];

export const MOCK_BOOKINGS = [
  { id: 1, customer: 'Sneha Patil', service: 'Haircut', salon: 'Glam Salon', datetime: '27 Apr, 11:00 AM', status: 'Confirmed' },
  { id: 2, customer: 'Rohit Sharma', service: 'Facial', salon: 'Beauty Lounge', datetime: '27 Apr, 02:30 PM', status: 'Pending' },
  { id: 3, customer: 'Pooja Desai', service: 'Spa', salon: 'Urban Salon', datetime: '28 Apr, 10:00 AM', status: 'Confirmed' },
  { id: 4, customer: 'Neha More', service: 'Haircut', salon: 'Style Studio', datetime: '28 Apr, 01:00 PM', status: 'Completed' },
  { id: 5, customer: 'Aditya Kulkarni', service: 'Facial', salon: 'Glam Salon', datetime: '29 Apr, 12:00 PM', status: 'Canceled' },
];

export const MOCK_CUSTOMERS = [
  { id: 1, name: 'Sneha Patil', phone: '8765432101', email: 'sneha@gmail.com', totalBookings: 3, lastVisit: '27 Apr, 2025' },
  { id: 2, name: 'Rohit Sharma', phone: '9876543210', email: 'rohit@gmail.com', totalBookings: 2, lastVisit: '20 Apr, 2025' },
  { id: 3, name: 'Pooja Desai', phone: '9988776655', email: 'pooja@gmail.com', totalBookings: 1, lastVisit: '15 Apr, 2025' },
  { id: 4, name: 'Neha More', phone: '9328765431', email: 'neha@gmail.com', totalBookings: 4, lastVisit: '26 Apr, 2025' },
  { id: 5, name: 'Aditya Kulkarni', phone: '9123456780', email: 'aditya@gmail.com', totalBookings: 2, lastVisit: '18 Apr, 2025' },
];

export const MOCK_SALONS = [
  { id: 1, name: 'Glam Salon', location: 'Pune, Maharashtra', status: 'Active', totalBookings: 45 },
  { id: 2, name: 'Beauty Lounge', location: 'Mumbai, Maharashtra', status: 'Active', totalBookings: 32 },
  { id: 3, name: 'Style Studio', location: 'Bangalore, Karnataka', status: 'Active', totalBookings: 28 },
  { id: 4, name: 'Urban Salon', location: 'Delhi, Delhi', status: 'Active', totalBookings: 20 },
  { id: 5, name: 'Wellness Spa', location: 'Hyderabad, Telangana', status: 'Active', totalBookings: 16 },
];

export const MOCK_LEAD_GROWTH = [
  { day: 'Apr 21', Total: 60, Converted: 6 },
  { day: 'Apr 22', Total: 68, Converted: 8 },
  { day: 'Apr 23', Total: 78, Converted: 9 },
  { day: 'Apr 24', Total: 88, Converted: 11 },
  { day: 'Apr 25', Total: 100, Converted: 12 },
  { day: 'Apr 26', Total: 114, Converted: 14 },
  { day: 'Apr 27', Total: 124, Converted: 15 },
];

export const MOCK_LEAD_DETAIL_EXTRA = {
  source: 'Website',
  automation: 'Enabled',
  progress: [
    { label: 'Lead Created', time: 'Apr 27, 2025 10:15 AM', done: true },
    { label: 'WhatsApp Sent', time: 'Apr 27, 2025 10:16 AM', done: true },
    { label: 'Customer Reply', time: 'Apr 27, 2025 11:36 AM', done: true },
    { label: 'Follow-up (1h)', time: 'Scheduled', done: false },
    { label: 'Follow-up (24h)', time: 'Scheduled', done: false },
    { label: 'Booking', time: 'Pending', done: false },
  ],
};
