// Static fallback catalogue — mirrors backend/prisma/seed.ts.
// Used so the frontend renders meaningfully even before the API/database is connected.

export type CloudeCategory = { name: string; slug: string };
export type CloudeGroup = { slug: string; title: string; icon: string; image: string; items: CloudeCategory[] };
export type CloudeTab = { name: string; slug: string; anchor?: string };
export type Cloude = {
  name: string;
  slug: string;
  description: string;
  icon: string; // lucide-react icon name
  categories: CloudeCategory[];
  groups?: CloudeGroup[];
  subTabs?: CloudeTab[];
  sellerCount?: string;
  /** Browse layout: categories in a left sidebar, all shops (or the selected category's) on the right. */
  sidebarBrowse?: boolean;
  /** Jobs & Freelancing: recruiters post jobs straight into a category (no shop), shown as job cards. */
  jobBoard?: boolean;
  /**
   * Financing: this Cloude lists shops AND accepts job posts — an agency, mini bank or CA firm
   * hiring field officers or accountants posts the vacancy in the same finance sub-category,
   * and it appears under the shops with the same Apply flow as the Jobs Cloude.
   */
  jobPosts?: boolean;
};

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

type RawGroup = { title: string; icon: string; image: string; items: string[] };
type RawTab = { name: string; anchor?: string };
type RawCloude = Omit<Cloude, 'categories' | 'groups' | 'subTabs'> & {
  categories: string[];
  groups?: RawGroup[];
  subTabs?: RawTab[];
};

const skillGroups: RawGroup[] = [
  {
    title: 'Handmade & Creative Products',
    icon: 'Gift',
    image: 'https://images.unsplash.com/photo-1572798089532-487718bc9d26',
    items: ['Gifts', 'Handcraft items, Clay products, Bamboo products, etc', 'Pooja items & pooja material', 'Artificial jewellery', 'Handcraft items/Art', 'Other creative small-business products'],
  },
  {
    title: 'Skill-Related Businesses',
    icon: 'Palette',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035',
    items: ['Beauty, makeup, salon & parlour products/items, Mehndi artist', 'Cleaning products', 'Interior & décor items', 'Snacks and similar products', 'T-shirts, cups & printing-related products', 'Flex and printing services and banner', 'Cleaning services / dry cleaning, Laundry worker', 'Other Skill-Related Businesses'],
  },
  {
    title: 'Freelancing / Services (Mistri / Service Provider)',
    icon: 'Wrench',
    image: 'https://images.unsplash.com/photo-1698479603408-1a66a6d9e80f',
    items: ['Vehicle repair workers', 'AC & electronics repair technicians', 'Mobile & laptop repair specialists', 'Laptop cleaning, repairing & maintenance', 'Hair cutting & personal grooming', 'Vehicle washing, PPF, servicing', 'Tailor', 'Construction work freelance (plumber, electrician, carpenter, lohar, house maker mistri, thikedar)'],
  },
  {
    title: 'Tutor / Coaching / Institute',
    icon: 'GraduationCap',
    image: 'https://images.unsplash.com/photo-1698954634383-eba274a1b1c7',
    items: ['Home tutors', 'Coaching centres/ tuter', 'Institutes & skill-development facilities'],
  },
];

const bookingGroups: RawGroup[] = [
  {
    title: 'Tour & Travel',
    icon: 'Plane',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
    items: ['Tour Packages', 'Hotels', 'Rooms & Guest Houses'],
  },
  {
    title: 'Vehicle Booking',
    icon: 'Truck',
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7',
    items: ['Cab, Bus, Truck', 'Delivery, Package & Movers services', 'Courier services'],
  },
  {
    title: 'Events',
    icon: 'PartyPopper',
    image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf',
    items: ['Party, Events & Birthday function booking'],
  },
];

const propertyGroups: RawGroup[] = [
  {
    title: 'Residential',
    icon: 'Home',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
    items: ['Hostel (rent)', 'Guest House (rent)', 'Room (rent)', 'PG (rent)'],
  },
  {
    title: 'Commercial / Other',
    icon: 'Building2',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
    items: ['Shop (rent or sale)', 'Office (rent or sale)', 'Flat (rent or sale)', 'Warehouse (rent or sale)', 'Plot (rent or sale)'],
  },
  {
    title: 'Property Professionals',
    icon: 'HardHat',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e',
    items: ['Construction & Architecture teams', 'Construction Material Shop (Plumber, Electrician, Balu, Cement, Carpenter, Paint, Sariya, Lohar, Steel, Home Decor, etc.)', 'Design teams / Engineers / Mistri / Thikedar', 'Electric shop', 'Paint shop', 'Carpentry shop', 'Office/marketing/professional services for new projects'],
  },
];

const foodGroups: RawGroup[] = [
  {
    title: 'Restaurants, Kitchens & Street Food',
    icon: 'UtensilsCrossed',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
    items: ['Restaurants', 'Cloud Kitchen', 'Kitchens', 'Special Food', 'Mess Food', 'Street Food'],
  },
  {
    title: 'Budget-Based Food Search',
    icon: 'Wallet',
    image: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f',
    items: ['Affordable Food', 'Budget Hotels', 'Budget Restaurants'],
  },
  {
    title: 'Food & Beverage Purchase',
    icon: 'ShoppingBasket',
    image: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2',
    items: ['Food Items Availability', 'Beverage Items Availability'],
  },
  {
    title: 'Homemade & Special Food',
    icon: 'Milk',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9',
    items: ['Homemade Special Food', 'Achar / Pickle', 'Doodh (Milk)', 'Makhan (Butter)', 'Homemade Cakes', 'Chips & Namkeen'],
  },
];

const weddingGroups: RawGroup[] = [
  {
    title: 'Hotel, Banquet Hall & Wedding Venue Booking',
    icon: 'Landmark',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552',
    items: ['Hotel Booking', 'Banquet Hall Booking', 'Wedding Venue Booking'],
  },
  {
    title: 'Pooja Items & Pandit Booking',
    icon: 'Flame',
    image: 'https://images.unsplash.com/photo-1605106702734-205df224ecce',
    items: ['Pooja Items', 'Pandit Booking'],
  },
  {
    title: 'Furniture',
    icon: 'Sofa',
    image: 'https://images.unsplash.com/photo-1567016432779-094069958ea5',
    items: ['Wedding Furniture', 'Furniture Rental for Events'],
  },
  {
    title: 'Wedding Manager & Services',
    icon: 'PartyPopper',
    image: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6',
    items: ['Wedding Manager', 'Wedding Planning Services', 'Studio (Cameraman)', 'Other Wedding-Related Services'],
  },
];

const rentGroups: RawGroup[] = [
  {
    title: 'Vehicle Rent',
    icon: 'Car',
    image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c',
    items: ['Cars', 'Bikes & Scooters', 'Commercial Vehicles'],
  },
  {
    title: 'Property Rent',
    icon: 'Home',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa',
    items: ['Flats & Apartments', 'Shops & Offices', 'Rooms & PG'],
  },
  {
    title: 'Home Products',
    icon: 'Sofa',
    image: 'https://images.unsplash.com/photo-1567016432779-094069958ea5',
    items: ['Furniture Rental', 'Appliances Rental', 'Décor Items Rental'],
  },
  {
    title: 'Gadgets',
    icon: 'Smartphone',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c',
    items: ['Laptops & Computers', 'Cameras', 'Mobile Phones'],
  },
  {
    title: 'Fashion Products',
    icon: 'Shirt',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050',
    items: ['Wedding & Party Wear', 'Costumes', 'Accessories'],
  },
  {
    title: 'Machine Equipment & Tools Rental',
    icon: 'Wrench',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c',
    items: ['Construction Equipment', 'Power Tools', 'Industrial Machines'],
  },
];

const softwareGroups: RawGroup[] = [
  {
    title: 'Web Development',
    icon: 'Code2',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6',
    items: ['Website Design & Development', 'E-commerce Websites', 'WordPress / CMS Development', 'Website Maintenance & Bug Fixing'],
  },
  {
    title: 'App Development',
    icon: 'Smartphone',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c',
    items: ['Android App Development', 'iOS App Development', 'Cross-platform App Development', 'App Maintenance & Updates'],
  },
  {
    title: 'Sales & Marketing',
    icon: 'Megaphone',
    image: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312',
    items: ['Digital Marketing & SEO', 'Social Media Marketing', 'Sales & Lead Generation', 'Content Marketing'],
  },
  {
    title: 'Design (incl. Graphic Designers)',
    icon: 'Palette',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5',
    items: ['Graphic Design', 'Logo & Branding', 'UI/UX Design', 'Print & Packaging Design'],
  },
  {
    title: 'Media',
    icon: 'Film',
    image: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb',
    items: ['Photography', 'Videography', 'Media Production', 'Podcast Production'],
  },
  {
    title: 'Architecture',
    icon: 'Building2',
    image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625',
    items: ['Architectural Design', '3D Modelling & Rendering', 'Interior Design', 'Structural Planning'],
  },
  {
    title: 'Translation',
    icon: 'Languages',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570',
    items: ['Document Translation', 'Language Interpretation', 'Subtitling & Localization', 'Content Translation'],
  },
  {
    title: 'Data Entry & Analytics',
    icon: 'BarChart3',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
    items: ['Data Entry', 'Data Analysis', 'Excel & Spreadsheet Work', 'Business Reporting & Dashboards'],
  },
  {
    title: 'Video Editor',
    icon: 'Clapperboard',
    image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d',
    items: ['Video Editing', 'Motion Graphics', 'Color Grading', 'YouTube / Reels Editing'],
  },
  {
    title: 'Media / Animation',
    icon: 'Wand2',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d',
    items: ['2D Animation', '3D Animation', 'Explainer Videos', 'VFX & Motion Design'],
  },
];

const financingGroups: RawGroup[] = [
  {
    title: 'Loans',
    icon: 'HandCoins',
    image: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc',
    items: ['Personal Loan', 'Home Loan', 'Business Loan', 'Car & Vehicle Loan', 'Gold Loan', 'Education Loan', 'Loan Against Property'],
  },
  {
    title: 'Insurance',
    icon: 'ShieldCheck',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85',
    items: ['Life Insurance', 'Health Insurance', 'Vehicle Insurance', 'General & Property Insurance'],
  },
  {
    title: 'Investment & Trading',
    icon: 'TrendingUp',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3',
    items: ['Mutual Funds', 'Stock Market / Demat Account', 'SIP & Investment Advisory', 'Fixed Deposit & Bonds'],
  },
  {
    title: 'Tax, GST & Accounting Services',
    icon: 'Calculator',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c',
    items: ['Income Tax Filing (CA)', 'GST Registration & Filing', 'Accounting & Bookkeeping', 'Credit Score / CIBIL Services'],
  },
  {
    title: 'Banking & Payment Agents',
    icon: 'Landmark',
    image: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f',
    items: ['Bank Correspondent / Mini Bank', 'Credit Card Services', 'Money Transfer (DMT)', 'ATM / CSP Agent'],
  },
];

const agricultureGroups: RawGroup[] = [
  {
    title: 'Vegetables',
    icon: 'Carrot',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
    items: ['Potato', 'Onion', 'Tomato', 'Cauliflower', 'Cabbage', 'Brinjal', 'Green Chilli', 'Capsicum', 'Peas', 'Spinach', 'Other Vegetables'],
  },
  {
    title: 'Fresh Fruits',
    icon: 'Apple',
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b',
    items: ['Litchi', 'Apple', 'Orange', 'Banana', 'Mango', 'Grapes', 'Watermelon', 'Papaya', 'Pomegranate', 'Other Fruits'],
  },
  {
    title: 'Street Vendor / Pushcart Vendor',
    icon: 'ShoppingCart',
    image: 'https://images.unsplash.com/photo-1525328437458-0c4d4db7cab4',
    items: ['Street Vendor', 'Pushcart (Thela) Vendor', 'Mobile Fruit & Vegetable Cart'],
  },
  {
    title: 'Tractor & Farming Machine Rent',
    icon: 'Tractor',
    image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9',
    items: ['Tractor Rent', 'Harvester Rent', 'Rotavator Rent', 'Plough / Cultivator Rent', 'Other Farming Machine Rent'],
  },
  {
    title: 'Tata Ace / Mini Truck Service',
    icon: 'Truck',
    image: 'https://images.unsplash.com/photo-1720236178658-ef1edfa8ac68',
    items: ['Tata Ace Mini Truck', 'Goods Loading & Transport', 'Farm-to-Market Delivery'],
  },
  {
    title: 'Pesticides Shop',
    icon: 'SprayCan',
    image: 'https://images.unsplash.com/photo-1593999094742-4f5280054b23',
    items: ['Insecticides', 'Fungicides', 'Herbicides / Weedicides', 'Bio-Pesticides', 'Fertilizers', 'Plant Growth Regulators'],
  },
];

const clinicGroups: RawGroup[] = [
  {
    title: 'Doctor Discovery by Specialisation',
    icon: 'Stethoscope',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d',
    items: ['Cardiologist / Heart Specialist', 'Kidney Specialist', 'Dermatologist', 'ENT Specialist', 'Orthopedic', 'Neurologist', 'Pediatrician', 'General Physician', 'Other Specialists'],
  },
  {
    title: 'Disease-based Treatment Search',
    icon: 'Search',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d',
    items: ['Hospitals Offering Treatment', 'Comparative & Affordable Options'],
  },
  {
    title: 'Hospital Information',
    icon: 'Building2',
    image: 'https://images.unsplash.com/photo-1587351021355-a479a299d2f9',
    items: ['Hospital Details & Facilities', 'Emergency Services'],
  },
  {
    title: 'Diagnostics & Physiotherapy',
    icon: 'Activity',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514',
    items: ['Physiotherapy', 'X-Ray', 'Radiology', 'Pathology Lab', 'Other Healthcare-Related Services'],
  },
];

const educationGroups: RawGroup[] = [
  {
    title: 'Coaching (incl. IT Coaching)',
    icon: 'BookOpen',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644',
    items: ['Academic Coaching (School/College)', 'IT & Programming Coaching', 'Competitive Exam Coaching', 'Personality Development Coaching'],
  },
  {
    title: 'Courses',
    icon: 'BookMarked',
    image: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc',
    items: ['Certificate Courses', 'Online Courses', 'Skill-based Short Courses', 'Diploma Courses'],
  },
  {
    title: 'Institutes',
    icon: 'School',
    image: 'https://images.unsplash.com/photo-1562774053-701939374585',
    items: ['Educational Institutes', 'Vocational Training Institutes', 'Technical Institutes', 'Skill Development Centres'],
  },
  {
    title: 'Home Tutors',
    icon: 'UserCheck',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
    items: ['School Subject Tutors', 'Language Tutors', 'Music & Art Tutors', 'Exam Preparation Tutors'],
  },
  {
    title: 'Skill Development Coaching',
    icon: 'Hammer',
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837',
    items: ['Computer & Digital Skills', 'Communication & Soft Skills', 'Vocational Skill Training', 'Career Counselling'],
  },
  {
    title: 'Sports & Hobbies Class',
    icon: 'Trophy',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
    items: ['Sports Coaching', 'Dance & Music Classes', 'Art & Craft Classes', 'Fitness & Yoga Classes'],
  },
  {
    title: 'Other Services / Products',
    icon: 'Layers',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7',
    items: [
      'Educational Consultancy',
      'Study Material & Books',
      'Used Books / Second-hand Books',
      'Stationery & Book Shop',
      'Admission Guidance',
      'Other Educational Services',
    ],
  },
];

const shoppingGroups: RawGroup[] = [
  {
    title: 'Grocery Items & Daily Use',
    icon: 'ShoppingBasket',
    image: 'https://images.unsplash.com/photo-1584568694489-f71bdbac55e2',
    items: ['Grocery Items & Daily Use'],
  },
  {
    title: 'Hardware',
    icon: 'Hammer',
    image: 'https://images.unsplash.com/photo-1741992556910-7ab0bb21e0a6',
    items: ['Hardware'],
  },
  {
    title: 'Electronics',
    icon: 'Cpu',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c',
    items: ['Electronics'],
  },
  {
    title: 'Fashion & Clothing',
    icon: 'Shirt',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050',
    items: ['Fashion & Clothing'],
  },
  {
    title: 'Construction Materials',
    icon: 'HardHat',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e',
    items: ['Construction Materials'],
  },
  {
    title: 'Mobile',
    icon: 'Smartphone',
    image: 'https://images.unsplash.com/photo-1549421263-6064833b071b',
    items: ['Mobile'],
  },
  {
    title: 'Beauty Products',
    icon: 'Flower2',
    image: 'https://images.unsplash.com/photo-1566812335496-af416725bc1d',
    items: ['Beauty Products'],
  },
  {
    title: 'Furniture',
    icon: 'Sofa',
    image: 'https://images.unsplash.com/photo-1567016432779-094069958ea5',
    items: ['Furniture'],
  },
  {
    title: 'Machine and Tools Shop',
    icon: 'Wrench',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c',
    items: ['Machine and Tools Shop'],
  },
  {
    title: 'Other Services / Products',
    icon: 'Layers',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7',
    items: ['Other Services / Products'],
  },
];

const manufacturingGroups: RawGroup[] = [
  {
    title: 'Food Processing & Packaged Foods',
    icon: 'Cookie',
    image: 'https://images.unsplash.com/photo-1547573854-74d2a71d0826',
    items: ['Pickles, Papad & Snacks', 'Bakery & Confectionery', 'Spices & Masala Powder', 'Packaged & Homemade Foods'],
  },
  {
    title: 'Handicrafts & Handmade Décor',
    icon: 'Palette',
    image: 'https://images.unsplash.com/photo-1509281373149-e957c6296406',
    items: ['Handicrafts', 'Pottery & Clay Products', 'Bamboo & Cane Products', 'Handmade Decor Items'],
  },
  {
    title: 'Textile & Garment Manufacturing',
    icon: 'Shirt',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea',
    items: ['Tailoring & Stitching Units', 'Embroidery & Zari Work', 'Garment Manufacturing', 'Handloom & Weaving'],
  },
  {
    title: 'Soap, Candle & Cosmetics Making',
    icon: 'Sparkles',
    image: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214',
    items: ['Handmade Soap', 'Candle Making', 'Cosmetics & Skincare Products', 'Essential Oils & Perfumes'],
  },
  {
    title: 'Wood, Metal & Fabrication Units',
    icon: 'Hammer',
    image: 'https://images.unsplash.com/photo-1601058268499-e52658b8bb88',
    items: ['Furniture & Woodwork', 'Metal Fabrication & Welding', 'Small Machine Parts', 'Plastic & Rubber Products'],
  },
  {
    title: 'Packaging, Printing & Pooja Products',
    icon: 'Package',
    image: 'https://images.unsplash.com/photo-1607166452427-7e4477079cb9',
    items: ['Packaging Services', 'Printing & Labeling', 'Agarbatti & Incense Manufacturing', 'Pooja Product Manufacturing'],
  },
];

const sportsFitnessGymGroups: RawGroup[] = [
  {
    title: 'Sports Academy',
    icon: 'Trophy',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211',
    items: ['Coaches & Trainers', 'Cricket Academy', 'Basketball Academy', 'Badminton Academy', 'Volleyball Academy'],
  },
  {
    title: 'Fitness',
    icon: 'HeartPulse',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
    items: ['Yoga Trainer', 'Police Physical Training', 'Govt Exam Physical Training', 'Karate Academy', 'Taekwondo Academy'],
  },
  {
    title: 'Gym',
    icon: 'Dumbbell',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48',
    items: ['Gym Equipment & Items', 'Exercise & Workout Plans', 'Gym Trainer'],
  },
];

const raw: RawCloude[] = [
  {
    name: 'Shopping Cloude',
    slug: 'shopping',
    icon: 'ShoppingBag',
    description: 'Everyday shopping across grocery, electronics, fashion and more.',
    categories: shoppingGroups.flatMap((g) => g.items),
    groups: shoppingGroups,
    sidebarBrowse: true,
    subTabs: [
      { name: 'Grocery & Daily Use', anchor: 'Grocery Items & Daily Use' },
      { name: 'Hardware', anchor: 'Hardware' },
      { name: 'Electronics', anchor: 'Electronics' },
      { name: 'Fashion & Clothing', anchor: 'Fashion & Clothing' },
      { name: 'Construction Materials', anchor: 'Construction Materials' },
      { name: 'Mobile', anchor: 'Mobile' },
      { name: 'Beauty Products', anchor: 'Beauty Products' },
      { name: 'Furniture', anchor: 'Furniture' },
      { name: 'Machine & Tools Shop', anchor: 'Machine and Tools Shop' },
      { name: 'Other Services / Products', anchor: 'Other Services / Products' },
    ],
    sellerCount: '52+',
  },
  {
    name: 'Food Cloude',
    slug: 'food',
    icon: 'UtensilsCrossed',
    description: 'Restaurants, food discovery, and budget-based filtering.',
    categories: [...foodGroups.flatMap((g) => g.items), 'Other Services / Products'],
    groups: foodGroups,
    sidebarBrowse: true,
    subTabs: [
      { name: 'Restaurants & Kitchens', anchor: 'Restaurants, Kitchens & Street Food' },
      { name: 'Budget-Based Search', anchor: 'Budget-Based Food Search' },
      { name: 'Food & Beverage Purchase', anchor: 'Food & Beverage Purchase' },
      { name: 'Homemade & Special Food', anchor: 'Homemade & Special Food' },
      { name: 'Other Services / Products', anchor: 'other' },
    ],
    sellerCount: '86+',
  },
  {
    name: 'Skill & Servicing Cloude',
    slug: 'skill',
    icon: 'Sparkles',
    description: 'Handmade & creative products, skill-based businesses, freelancing services and tutoring.',
    categories: [...skillGroups.flatMap((g) => g.items), 'Other Business', 'Other Services / Products'],
    groups: skillGroups,
    sidebarBrowse: true,
    subTabs: [
      { name: 'Creative Handmade Small Business', anchor: 'Handmade & Creative Products' },
      { name: 'Skill Jobs / Business', anchor: 'Skill-Related Businesses' },
      { name: 'Skilled Workers', anchor: 'Freelancing / Services (Mistri / Service Provider)' },
      { name: 'Other Business', anchor: 'other' },
      { name: 'Other Services / Products', anchor: 'other' },
    ],
    sellerCount: '178+',
  },
  {
    name: 'Jobs & Freelancing Cloude',
    slug: 'software',
    icon: 'Code2',
    description: 'Digital and professional freelancing services.',
    categories: [...softwareGroups.flatMap((g) => g.items), 'Other Services / Products'],
    groups: softwareGroups,
    sidebarBrowse: true,
    jobBoard: true,
    sellerCount: '64+',
  },
  {
    name: 'Financing Cloude',
    slug: 'financing',
    icon: 'BadgeIndianRupee',
    description: 'Loans, insurance and other financial services.',
    categories: [...financingGroups.flatMap((g) => g.items), 'Other Services / Products'],
    groups: financingGroups,
    sidebarBrowse: true,
    jobPosts: true,
    subTabs: [
      { name: 'Loans', anchor: 'Loans' },
      { name: 'Insurance', anchor: 'Insurance' },
      { name: 'Investment & Trading', anchor: 'Investment & Trading' },
      { name: 'Tax, GST & Accounting', anchor: 'Tax, GST & Accounting Services' },
      { name: 'Banking & Payment Agents', anchor: 'Banking & Payment Agents' },
      { name: 'Other Services / Products', anchor: 'other' },
    ],
    sellerCount: '38+',
  },
  {
    name: 'Booking Cloude',
    slug: 'booking',
    icon: 'CalendarCheck',
    description: 'Travel, vehicle, and event booking services.',
    categories: [...bookingGroups.flatMap((g) => g.items), 'Other Services / Products'],
    groups: bookingGroups,
    sidebarBrowse: true,
    subTabs: [
      { name: 'Tour & Travel', anchor: 'Tour & Travel' },
      { name: 'Vehicle Booking', anchor: 'Vehicle Booking' },
      { name: 'Events', anchor: 'Events' },
      { name: 'Other Services / Products', anchor: 'other' },
    ],
    sellerCount: '92+',
  },
  {
    name: 'Wedding Cloude',
    slug: 'wedding',
    icon: 'Heart',
    description: 'Everything for planning a wedding, from venues to pandits.',
    categories: [...weddingGroups.flatMap((g) => g.items), 'Other Services / Products'],
    groups: weddingGroups,
    sidebarBrowse: true,
    subTabs: [
      { name: 'Venue Booking', anchor: 'Hotel, Banquet Hall & Wedding Venue Booking' },
      { name: 'Pooja & Pandit', anchor: 'Pooja Items & Pandit Booking' },
      { name: 'Furniture', anchor: 'Furniture' },
      { name: 'Wedding Manager & Services', anchor: 'Wedding Manager & Services' },
      { name: 'Other Services / Products', anchor: 'other' },
    ],
    sellerCount: '73+',
  },
  {
    name: 'Property Cloude',
    slug: 'property',
    icon: 'Home',
    description: 'Renting, buying, and property-related professional services.',
    categories: [...propertyGroups.flatMap((g) => g.items), 'Other Services / Products'],
    groups: propertyGroups,
    sidebarBrowse: true,
    subTabs: [
      { name: 'Residential', anchor: 'Residential' },
      { name: 'Commercial / Other', anchor: 'Commercial / Other' },
      { name: 'Property Professionals', anchor: 'Property Professionals' },
      { name: 'Other Services / Products', anchor: 'other' },
    ],
    sellerCount: '134+',
  },
  {
    name: 'Rent Cloude',
    slug: 'rent',
    icon: 'KeyRound',
    description: 'General rental marketplace across categories.',
    categories: [...rentGroups.flatMap((g) => g.items), 'Other Services / Products'],
    groups: rentGroups,
    sidebarBrowse: true,
    subTabs: [
      { name: 'Vehicle Rent', anchor: 'Vehicle Rent' },
      { name: 'Property Rent', anchor: 'Property Rent' },
      { name: 'Home Products', anchor: 'Home Products' },
      { name: 'Gadgets', anchor: 'Gadgets' },
      { name: 'Fashion Products', anchor: 'Fashion Products' },
      { name: 'Machine Equipment & Tools', anchor: 'Machine Equipment & Tools Rental' },
      { name: 'Other Services / Products', anchor: 'other' },
    ],
    sellerCount: '58+',
  },
  {
    name: 'Mini Factory / Manufacturing Cloude',
    slug: 'manufacturing',
    icon: 'Factory',
    description: 'Small-scale manufacturing and homemade-product businesses.',
    categories: [...manufacturingGroups.flatMap((g) => g.items), 'Other Services / Products'],
    groups: manufacturingGroups,
    sidebarBrowse: true,
    subTabs: [
      { name: 'Food Processing', anchor: 'Food Processing & Packaged Foods' },
      { name: 'Handicrafts & Décor', anchor: 'Handicrafts & Handmade Décor' },
      { name: 'Textile & Garments', anchor: 'Textile & Garment Manufacturing' },
      { name: 'Soap, Candle & Cosmetics', anchor: 'Soap, Candle & Cosmetics Making' },
      { name: 'Wood, Metal & Fabrication', anchor: 'Wood, Metal & Fabrication Units' },
      { name: 'Packaging & Pooja Products', anchor: 'Packaging, Printing & Pooja Products' },
      { name: 'Other Services / Products', anchor: 'other' },
    ],
    sellerCount: '21+',
  },
  {
    name: 'Education Cloude',
    slug: 'education',
    icon: 'GraduationCap',
    description: 'Coaching, courses, institutes and home tutors.',
    categories: educationGroups.flatMap((g) => g.items),
    groups: educationGroups,
    sidebarBrowse: true,
    subTabs: [
      { name: 'Coaching', anchor: 'Coaching (incl. IT Coaching)' },
      { name: 'Courses', anchor: 'Courses' },
      { name: 'Institutes', anchor: 'Institutes' },
      { name: 'Home Tutors', anchor: 'Home Tutors' },
      { name: 'Skill Development', anchor: 'Skill Development Coaching' },
      { name: 'Sports & Hobbies', anchor: 'Sports & Hobbies Class' },
      { name: 'Other Services / Products', anchor: 'Other Services / Products' },
    ],
    sellerCount: '47+',
  },
  {
    name: 'Agriculture & Farmer Cloude',
    slug: 'agriculture',
    icon: 'Leaf',
    description: 'Farming inputs, fresh vegetables and fruits for farmers and buyers.',
    categories: [...agricultureGroups.flatMap((g) => g.items), 'Agri-Input Store', 'Other Services / Products'],
    groups: agricultureGroups,
    sidebarBrowse: true,
    subTabs: [
      { name: 'Vegetables', anchor: 'Vegetables' },
      { name: 'Fresh Fruits', anchor: 'Fresh Fruits' },
      { name: 'Street Vendor / Pushcart', anchor: 'Street Vendor / Pushcart Vendor' },
      { name: 'Tractor & Machine Rent', anchor: 'Tractor & Farming Machine Rent' },
      { name: 'Mini Truck Service', anchor: 'Tata Ace / Mini Truck Service' },
      { name: 'Pesticides Shop', anchor: 'Pesticides Shop' },
      { name: 'Other Services / Products', anchor: 'other' },
    ],
    sellerCount: '51+',
  },
  {
    name: 'Clinic & Doctors Cloude',
    slug: 'clinic-doctors',
    icon: 'Stethoscope',
    description: 'Healthcare discovery — doctors, hospitals and diagnostics.',
    categories: [...clinicGroups.flatMap((g) => g.items), 'Other Services / Products'],
    groups: clinicGroups,
    sidebarBrowse: true,
    subTabs: [
      { name: 'Doctor Discovery', anchor: 'Doctor Discovery by Specialisation' },
      { name: 'Disease-based Search', anchor: 'Disease-based Treatment Search' },
      { name: 'Hospital Information', anchor: 'Hospital Information' },
      { name: 'Diagnostics & Physiotherapy', anchor: 'Diagnostics & Physiotherapy' },
      { name: 'Other Services / Products', anchor: 'other' },
    ],
    sellerCount: '40+',
  },
  {
    name: 'Sports & fitness & gym Cloude',
    slug: 'sports-fitness-gym',
    icon: 'Dumbbell',
    description: 'Sports academies, fitness training and gym services.',
    categories: [...sportsFitnessGymGroups.flatMap((g) => g.items), 'Other Services / Products'],
    groups: sportsFitnessGymGroups,
    sidebarBrowse: true,
    subTabs: [
      { name: 'Sports Academy', anchor: 'Sports Academy' },
      { name: 'Fitness', anchor: 'Fitness' },
      { name: 'Gym', anchor: 'Gym' },
      { name: 'Other Services / Products', anchor: 'other' },
    ],
    sellerCount: '18+',
  },
];

export const cloudes: Cloude[] = raw.map((c) => ({
  ...c,
  categories: c.categories.map((name) => ({ name, slug: slugify(name) })),
  groups: c.groups?.map((g) => ({
    ...g,
    slug: slugify(g.title),
    items: g.items.map((name) => ({ name, slug: slugify(name) })),
  })),
  subTabs: c.subTabs?.map((tab) => ({
    name: tab.name,
    slug: slugify(tab.name),
    anchor: tab.anchor === 'other' ? 'other-categories' : tab.anchor ? slugify(tab.anchor) : undefined,
  })),
}));

export function getCloudeBySlug(slug: string) {
  return cloudes.find((c) => c.slug === slug);
}
