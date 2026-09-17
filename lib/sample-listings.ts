export type SampleListing = {
  id: string;
  title: string;
  price: string;
  city: string;
  cloudeSlug: string;
  category: string;
  postedAgo: string;
  image: string;
};

// Placeholder demo data so pages render with realistic content before the
// backend/database is connected. Replace with data fetched from /api/listings.
export const sampleListings: SampleListing[] = [
  { id: '1', title: 'Handmade Terracotta Pooja Thali Set', price: '₹1,299', city: 'Ghaziabad', cloudeSlug: 'skill', category: 'Creative Handmade Small Business', postedAgo: '2 days ago', image: 'https://images.unsplash.com/photo-1572798089532-487718bc9d26' },
  { id: '2', title: 'AC Repair & Gas Refill — Same Day', price: 'Contact for price', city: 'Noida', cloudeSlug: 'skill', category: 'Skilled Workers', postedAgo: '5 hours ago', image: 'https://images.unsplash.com/photo-1698479603408-1a66a6d9e80f' },
  { id: '3', title: '2BHK Flat for Rent near Metro', price: '₹18,500/mo', city: 'Ghaziabad', cloudeSlug: 'property', category: 'Residential', postedAgo: '1 day ago', image: 'https://images.unsplash.com/photo-1757970326337-95d7cca56fa1' },
  { id: '4', title: 'Wedding Banquet Hall — 500 pax', price: '₹1,20,000/day', city: 'Delhi', cloudeSlug: 'wedding', category: 'Hotel / Banquet Hall / Venue', postedAgo: '3 days ago', image: 'https://images.unsplash.com/photo-1677768062274-fdd45caac233' },
  { id: '5', title: 'Home Tutor for Class 10 Maths & Science', price: '₹800/session', city: 'Ghaziabad', cloudeSlug: 'education', category: 'Home Tutors', postedAgo: '6 hours ago', image: 'https://images.unsplash.com/photo-1698954634383-eba274a1b1c7' },
  { id: '6', title: 'Fresh Farm Vegetables — Wholesale', price: '₹22/kg onwards', city: 'Meerut', cloudeSlug: 'agriculture', category: 'Vegetables', postedAgo: '1 day ago', image: 'https://images.unsplash.com/photo-1757627550652-30788bfce978' },
  { id: '7', title: 'Self-Drive Car Rental — Swift Dzire', price: '₹1,499/day', city: 'Noida', cloudeSlug: 'rent', category: 'Vehicle Rent', postedAgo: '4 hours ago', image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb' },
  { id: '8', title: 'Full Stack Web Developer — Freelance', price: '₹400/hr', city: 'Remote', cloudeSlug: 'software', category: 'Web Development', postedAgo: '2 days ago', image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4' },
];

export type SampleJob = {
  id: string;
  title: string;
  company: string;
  salary: string;
  location: string;
  type: string;
  experience: string;
  postedAgo: string;
};

export const sampleJobs: SampleJob[] = [
  { id: 'j1', title: 'Electrician — Residential Projects', company: 'UrbanFix Services', salary: '₹18,000–24,000/mo', location: 'Ghaziabad', type: 'Full-time', experience: '1–3 yrs', postedAgo: '1 day ago' },
  { id: 'j2', title: 'Delivery Executive', company: 'QuickCart Logistics', salary: '₹15,000–20,000/mo', location: 'Noida', type: 'Full-time', experience: 'Fresher', postedAgo: '3 hours ago' },
  { id: 'j3', title: 'Graphic Designer', company: 'Pixel Nest Studio', salary: '₹25,000–35,000/mo', location: 'Remote', type: 'Work from home', experience: '1–3 yrs', postedAgo: '2 days ago' },
  { id: 'j4', title: 'Field Sales Executive', company: 'Sunrise Distributors', salary: '₹12,000 + Incentives', location: 'Ghaziabad', type: 'Field job', experience: 'Fresher', postedAgo: '5 hours ago' },
];
