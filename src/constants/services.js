import {
  AutoAwesome,
  ColorLens,
  Star,
  FaceRetouchingNatural, // For Bridal
  Cake, // For Haldi/Mehndi
} from "@mui/icons-material";

export const makeupServices = [
  {
    icon: <ColorLens sx={{ color: "primary.main" }} />,
    title: "Light Party Makeup",
    price: "₹1,499",
    items: [
      "Includes: Professional Makeup, Elegant Hairstyle & Saree Draping.",
    ],
  },
  {
    icon: <ColorLens sx={{ color: "primary.main" }} />,
    title: "Glamour Pro Makeup",
    price: "₹1,999",
    items: [
      "Includes: Full Party Makeup, Hairstyle & Saree/Lehenga Draping.",
    ],
  },
];

export const bridalServices = [
  {
    icon: <Cake sx={{ color: "primary.main" }} />,
    title: "Haldi / Mehndi Makeup",
    price: "₹2,499",
    items: [
      "A radiant look for your pre-wedding ceremonies.",
      "Includes: Makeup, Hairstyling & Lehnga/Saree Draping.",
    ],
  },
  {
    icon: <FaceRetouchingNatural sx={{ color: "primary.main" }} />,
    title: "Engagement Makeup",
    price: "₹2,999",
    items: ["Includes: Makeup, Hairstyling & Lehnga Draping."],
  },
  {
    icon: <Star sx={{ color: "primary.main" }} />,
    title: "HD Bridal Makeup",
    price: "₹14,999",
    items: [
      "Includes: Complete HD Bridal Makeup, Hairstyling, a complimentary Light Cleanup session, and perfect Lehnga Draping.",
    ],
  },
];

export const packages = [
  {
    icon: <AutoAwesome sx={{ color: "primary.main" }} />,
    title: "Basic Glow",
    price: "₹799",
    tagline: "SAVE MORE | LOOK BEAUTIFUL",
    card_color: "#4e1014",
    items: [
      "Facial Cleanup",
      "Full Hand Waxing",
      "Threading forehead/Upper lips",
    ],
  },
  {
    icon: <Star sx={{ color: "primary.main" }} />,
    title: "Radiant Care",
    price: "₹1,099",
    tagline: "RADIATE BEAUTY | THIS FESTIVE SEASON",
    card_color: "#261326",
    items: [
      "D-Tan Facial",
      "Half Leg Waxing",
      "Full Hand Waxing",
      "Threading forehead/Upper lips",
    ],
  },
  {
    icon: <AutoAwesome sx={{ color: "primary.main" }} />,
    title: "Lotus Glow",
    price: "₹1,499",
    badge_text: "MOST POPULAR",
    tagline: "SHINE LIKE | A LOTUS",
    card_color: "#4f3811",
    items: [
      "Lotus Facial",
      "Skin Brightening Bleach",
      "Full Hand Waxing",
      "Full Leg Waxing",
      "Threading forehead/Upper lips",
    ],
  },
  {
    icon: <Star sx={{ color: "primary.main" }} />,
    title: "Royal Pamper",
    price: "₹2,099",
    tagline: "FEEL ROYAL | BE ROYAL",
    card_color: "#0c3329",
    items: [
      "Bridal O3 facial 10 step",
      "Golden Bleach (face, neck, back)",
      "O3 wax (full hand, half leg)",
      "Threading (forehead, upper lips)",
    ],
  },
];

export const cleanupPackages = [
  {
    icon: <AutoAwesome sx={{ color: "primary.main" }} />,
    title: "Gold cleanup with D-tan pack",
    price: "₹599",
    price_inr: 599,
    items: ["Gold cleanup with D-tan pack"],
  },
  {
    icon: <AutoAwesome sx={{ color: "primary.main" }} />,
    title: "Wine cleaner with D-tan pack",
    price: "₹499",
    price_inr: 499,
    items: ["Wine cleaner with D-tan pack"],
  },
  {
    icon: <AutoAwesome sx={{ color: "primary.main" }} />,
    title: "Clean up VLCC with VLCC bleach",
    price: "₹649",
    price_inr: 649,
    items: ["Clean up VLCC with VLCC bleach"],
  },
  {
    icon: <Star sx={{ color: "primary.main" }} />,
    title: "Korean clean up with D-tan bleach",
    price: "₹699",
    price_inr: 699,
    items: ["Korean clean up with D-tan bleach"],
  },
  {
    icon: <AutoAwesome sx={{ color: "primary.main" }} />,
    title: "Oxy clean up with Oxy bleach",
    price: "₹499",
    price_inr: 499,
    items: ["Oxy clean up with Oxy bleach"],
  },
];

export const festiveLuxePackages = [
  {
    icon: <Star sx={{ color: "primary.main" }} />,
    title: "Bond of Radiance Package",
    price: "₹1,999",
    price_inr: 1999,
    card_color: "#e06d78",
    items: [
      "Bio Aqua facial with oxy bleach (Face Neck Back)",
      "Hydra mask back massaging",
      "Threading forehead and upper lips",
      "Full hand half leg O3 wax",
    ],
  },
  {
    icon: <Star sx={{ color: "primary.main" }} />,
    title: "Sister's Glow Luxe Package",
    price: "₹2,499",
    price_inr: 2499,
    badge_text: "SELF-CARE IS THE BEST GIFT",
    card_color: "#d49b42",
    items: [
      "Hydra boost facial 8 step scrubbing",
      "Back massaging included oxy bleach (Face Neck Back)",
      "Full hand half leg reka waxing",
      "Threading forehead and upper lips",
    ],
  },
  {
    icon: <AutoAwesome sx={{ color: "primary.main" }} />,
    title: "Pure & Fresh Essence Package",
    price: "₹1,299",
    price_inr: 1299,
    card_color: "#df6c5a",
    items: [
      "VLCC facial scrubbing back massaging",
      "VLCC bleach (Face Neck Back)",
      "Threading forehead upper lip",
      "Alo vera wax full hand half leg",
    ],
  },
];

export const hairServices = [
  { name: "Step Cut", price: "₹350", price_inr: 350 },
  { name: "Layer Cut", price: "₹250", price_inr: 250 },
  { name: "V-Shape Cut", price: "₹200", price_inr: 200 },
  { name: "U-Shape Cut", price: "₹150", price_inr: 150 },
  { name: "Baby Cut", price: "₹100", price_inr: 100 },
];
