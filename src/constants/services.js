import { AutoAwesome, Star, ColorLens } from "@mui/icons-material";

export const packages = [
  {
    icon: <AutoAwesome sx={{ color: "primary.main" }} />,
    title: "Essential Glow",
    price: "₹799",
    items: ["Facial Cleanup", "Full Hand Waxing", "Threading (Eyebrows & Upper Lip)"],
  },
  {
    icon: <Star sx={{ color: "primary.main" }} />,
    title: "Radiant Refresh",
    price: "₹1099",
    items: ["D-Tan Treatment", "Customized Facial", "Half Leg & Full Hand Waxing", "Threading"],
  },
  {
    icon: <AutoAwesome sx={{ color: "primary.main" }} />,
    title: "Diamond Indulgence",
    price: "₹1499",
    items: ["Customized Facial", "Skin Brightening Bleach", "Full Hand & Full Leg Waxing", "Threading"],
  },
  {
    icon: <Star sx={{ color: "primary.main" }} />,
    title: "Royal Treatment",
    price: "₹1999",
    items: ["Customized Facial & Bleach", "Full Hand & Full Leg Premium Rica Wax", "Professional Haircut"],
  },
];

export const makeupServices = [
  {
    icon: <ColorLens sx={{ color: "primary.main" }} />,
    title: "Elegant Affair",
    price: "₹1199",
    items: ["Light Party Makeup", "Professional Hairstyle", "Saree Draping"],
  },
  {
    icon: <ColorLens sx={{ color: "primary.main" }} />,
    title: "Glamour Pro",
    price: "₹1999",
    items: ["Full Party Makeup", "Advanced Hairstyle"],
  },
];

export const hairServices = [
  { name: "Step Cut", price: "₹350" },
  { name: "Layer Cut", price: "₹250" },
  { name: "V-Shape Cut", price: "₹200" },
  { name: "U-Shape Cut", price: "₹150" },
  { name: "Baby Cut", price: "₹100" },
];
