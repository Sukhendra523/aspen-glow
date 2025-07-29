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
    price: "₹1199",
    items: ["Light Party Makeup", "Hairstyle", "Saree Draping"],
  },
  {
    icon: <ColorLens sx={{ color: "primary.main" }} />,
    title: "Glamour Pro Makeup",
    price: "₹1999",
    items: ["Full Party Makeup", "Hairstyle", "Saree Draping"],
  },
];

export const bridalServices = [
  {
    icon: <Cake sx={{ color: "primary.main" }} />,
    title: "Haldi / Mehndi Makeup",
    price: "₹1,499",
    items: [
      "A radiant look for your pre-wedding ceremonies.",
      "Includes: Makeup, Hairstyling & Lehnga/Saree Draping.",
    ],
  },
  {
    icon: <FaceRetouchingNatural sx={{ color: "primary.main" }} />,
    title: "Engagement Makeup",
    price: "₹3,999",
    items: [
      "A flawless and captivating look for your special day.",
      "Includes: Makeup, Hairstyling & Lehnga Draping.",
    ],
  },
  {
    icon: <Star sx={{ color: "primary.main" }} />,
    title: "HD Bridal Makeup",
    price: "₹8,999",
    items: [
      "The perfect, long-lasting look for your wedding day.",
      "Includes: Complete HD Bridal Makeup, Hairstyling, a complimentary Light Cleanup session, and perfect Lehnga Draping.",
    ],
  },
];

export const packages = [
  {
    icon: <AutoAwesome sx={{ color: "primary.main" }} />,
    title: "Basic Glow",
    price: "₹799",
    items: [
      "Facial Cleanup",
      "Full Hand Waxing",
      "Threading (Eyebrows & Upper Lip)",
    ],
  },
  {
    icon: <Star sx={{ color: "primary.main" }} />,
    title: "Radiant Refresh",
    price: "₹1099",
    items: [
      "D-Tan Treatment Facial",
      "Half Leg & Full Hand Waxing",
      "Threading",
    ],
  },
  {
    icon: <AutoAwesome sx={{ color: "primary.main" }} />,
    title: "Diamond Glow",
    price: "₹1499",
    items: [
      "Facial",
      "Skin Brightening Bleach",
      "Full Hand & Full Leg Waxing",
      "Threading",
    ],
  },
  {
    icon: <Star sx={{ color: "primary.main" }} />,
    title: "Royal Treatment",
    price: "₹1999",
    items: [
      "Facial & Bleach",
      "Full Hand & Full Leg Premium Rica Wax",
      "Threading",
      "Haircut",
    ],
  },
];

export const hairServices = [
  { name: "Step Cut", price: "₹350" },
  { name: "Layer Cut", price: "₹250" },
  { name: "V-Shape Cut", price: "₹200" },
  { name: "U-Shape Cut", price: "₹150" },
  { name: "Baby Cut", price: "₹100" },
];
