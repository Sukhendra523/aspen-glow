import React, { useState } from "react";
import {
  createTheme,
  ThemeProvider,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Drawer,
  Link,
} from "@mui/material";
import {
  Phone,
  LocationOn,
  AutoAwesome,
  ContentCut,
  ColorLens,
  Star,
  Menu as MenuIcon,
  WhatsApp,
} from "@mui/icons-material";
const logo = process.env.PUBLIC_URL + "/logo.png";

// --- MUI Theme Configuration ---
// Creates a custom theme to match the brand's aesthetic.
const theme = createTheme({
  palette: {
    primary: {
      main: "#d81b60", // A shade of pink
    },
    secondary: {
      main: "#880e4f", // A deeper pink/purple
    },
    background: {
      default: "#FEFBF6", // Creamy background
      paper: "#ffffff",
    },
    text: {
      primary: "#333333",
      secondary: "#555555",
    },
  },
  typography: {
    fontFamily: "'Lato', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontFamily: "'Playfair Display', 'Georgia', serif",
      fontWeight: 700,
    },
    h2: {
      fontFamily: "'Playfair Display', 'Georgia', serif",
      fontWeight: 700,
    },
    h3: {
      fontFamily: "'Playfair Display', 'Georgia', serif",
      fontWeight: 700,
    },
    h4: {
      fontFamily: "'Playfair Display', 'Georgia', serif",
      fontWeight: 400,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "50px",
          textTransform: "none",
          padding: "10px 24px",
        },
      },
    },
  },
});

// --- Helper Data ---
const packages = [
  {
    icon: <AutoAwesome sx={{ color: "primary.main" }} />,
    title: "Essential Glow",
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
      "D-Tan Treatment",
      "Customized Facial",
      "Half Leg & Full Hand Waxing",
      "Threading",
    ],
  },
  {
    icon: <AutoAwesome sx={{ color: "primary.main" }} />,
    title: "Diamond Indulgence",
    price: "₹1499",
    items: [
      "Customized Facial",
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
      "Customized Facial & Bleach",
      "Full Hand & Full Leg Premium Rica Wax",
      "Professional Haircut",
    ],
  },
  // {
  //   icon: <AutoAwesome sx={{ color: "primary.main" }} />,
  //   title: "Ultimate Pamper",
  //   price: "₹2999",
  //   items: ["Everything in Royal Treatment, plus:", "Full Body Bleach"],
  // },
];

const makeupServices = [
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

const hairServices = [
  { name: "Step Cut", price: "₹350" },
  { name: "Layer Cut", price: "₹250" },
  { name: "V-Shape Cut", price: "₹200" },
  { name: "U-Shape Cut", price: "₹150" },
  { name: "Baby Step Cut", price: "₹100" },
];

// --- Components ---

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navLinks = ["Home", "Services", "Contact"];

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: "center", width: 250 }}>
      <List>
        {navLinks.map((item) => (
          <ListItem key={item} component="a" href={`#${item.toLowerCase()}`}>
            <ListItemText primary={item} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(10px)",
        boxShadow: "sm",
      }}
      elevation={0}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Box
            sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 2 }}
          >
            <img
              src={logo}
              alt="Aspen Glow Logo"
              style={{ height: "45px", width: "auto" }}
            />
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                color: "text.primary",
                fontFamily: "'Playfair Display', serif",
              }}
            >
              Aspen Glow
            </Typography>
          </Box>
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            {navLinks.map((item) => (
              <Button
                key={item}
                component="a"
                href={`#${item.toLowerCase()}`}
                sx={{ color: "text.primary" }}
              >
                {item}
              </Button>
            ))}
          </Box>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ display: { md: "none" }, color: "primary.main" }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </Container>
      <Drawer anchor="right" open={drawerOpen} onClose={handleDrawerToggle}>
        {drawer}
      </Drawer>
    </AppBar>
  );
};

const Hero = () => {
  // The URL for the hosted logo image

  return (
    <Box id="home" component="section" sx={{ py: { xs: 8, md: 12 } }}>
      <Container maxWidth="md" sx={{ textAlign: "center" }}>
        <Box mb={4}>
          <img
            src={logo}
            alt="Aspen Glow by Shilpi Logo"
            style={{
              maxWidth: "250px",
              width: "100%",
              height: "auto",
              margin: "0 auto",
            }}
          />
        </Box>
        <Typography
          variant="h4"
          component="h2"
          sx={{ mt: 4, mb: 2, fontWeight: "light" }}
        >
          Bringing the Salon Experience at DevSai Sports Home
        </Typography>
        <Typography
          variant="body1"
          sx={{ mb: 4, maxWidth: "700px", mx: "auto", color: "text.secondary" }}
        >
          Hello! I am a professionally trained beautician offering a wide range
          of services exclusively for our society.
        </Typography>
        <Button variant="contained" size="large" href="#contact">
          Book an Appointment
        </Button>
      </Container>
    </Box>
  );
};

const ServiceCard = ({ icon, title, price, items }) => (
  <Card
    sx={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      borderTop: "4px solid",
      borderColor: "primary.light",
      transition: "transform 0.3s",
      "&:hover": { transform: "translateY(-8px)" },
    }}
  >
    <CardContent sx={{ flexGrow: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Box
          sx={{
            bgcolor: "#fce4ec",
            p: 1.5,
            borderRadius: "50%",
            mr: 2,
            display: "flex",
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h6" component="h3" fontWeight="bold">
            {title}
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontFamily: "'Playfair Display', serif",
              color: "primary.main",
            }}
          >
            {price}
          </Typography>
        </Box>
      </Box>
      <List dense>
        {items.map((item, index) => (
          <ListItem key={index} disableGutters>
            <ListItemIcon sx={{ minWidth: "32px" }}>
              <Star sx={{ fontSize: 16, color: "#ffc107" }} />
            </ListItemIcon>
            <ListItemText primary={item} />
          </ListItem>
        ))}
      </List>
    </CardContent>
  </Card>
);

const Services = () => (
  <Box id="services" component="section" sx={{ py: 8, bgcolor: "#f9f9f9" }}>
    <Container maxWidth="lg">
      <Box textAlign="center" mb={8}>
        <Typography variant="h2" component="h2">
          Our Exclusive Services
        </Typography>
        <Typography variant="h6" color="text.secondary" fontWeight="light">
          Tailored packages to make you shine.
        </Typography>
      </Box>

      <Typography variant="h3" textAlign="center" mb={4}>
        Beauty Packages
      </Typography>
      <Grid container spacing={4} mb={8} justifyContent="center">
        {packages.map((pkg, index) => (
          <Grid item key={index} xs={12} sm={6} md={4}>
            <ServiceCard {...pkg} />
          </Grid>
        ))}
      </Grid>

      <Typography variant="h3" textAlign="center" mb={4}>
        Makeup & Styling
      </Typography>
      <Grid container spacing={4} justifyContent="center" mb={8}>
        {makeupServices.map((service, index) => (
          <Grid item key={index} xs={12} sm={6} md={5}>
            <ServiceCard {...service} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={6}>
          <Typography variant="h3" textAlign="center" mb={4}>
            À La Carte Hair Services
          </Typography>
          <Card
            sx={{ p: 2, borderTop: "4px solid", borderColor: "primary.light" }}
          >
            <List>
              {hairServices.map((service, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <Typography fontWeight="bold">{service.price}</Typography>
                  }
                >
                  <ListItemIcon>
                    <ContentCut sx={{ color: "primary.main" }} />
                  </ListItemIcon>
                  <ListItemText primary={service.name} />
                </ListItem>
              ))}
            </List>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h3" textAlign="center" mb={4}>
            Mehndi Artistry
          </Typography>
          <Card
            sx={{
              p: 3,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              borderTop: "4px solid",
              borderColor: "primary.light",
            }}
          >
            <Box>
              <ColorLens sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
              <Typography>
                Intricate and beautiful Mehndi designs for all occasions.
                Bookings now open! Please contact for custom designs and
                pricing.
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Container>
  </Box>
);

const Contact = () => (
  <Box id="contact" component="section" sx={{ py: 8 }}>
    <Container maxWidth="sm" sx={{ textAlign: "center" }}>
      <Typography variant="h2" component="h2" mb={2}>
        Get in Touch
      </Typography>
      <Typography variant="h6" color="text.secondary" fontWeight="light" mb={4}>
        Appointments are highly recommended. Looking forward to pampering you!
      </Typography>
      <Card
        sx={{
          p: { xs: 3, md: 5 },
          borderTop: "4px solid",
          borderColor: "primary.main",
        }}
      >
        <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Phone sx={{ color: "primary.main" }} />
            <Link
              href="tel:7011413546"
              underline="hover"
              variant="h6"
              color="text.primary"
            >
              7011413546
            </Link>
          </Box>
          <Box display="flex" alignItems="center" gap={1.5}>
            <LocationOn sx={{ color: "primary.main" }} />
            <Typography variant="body1">
              703 Aspen Tower, Dev Sai Sports Home, Greater Noida
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<WhatsApp />}
            href="https://wa.me/917011413546"
            target="_blank"
            sx={{
              mt: 2,
              bgcolor: "#25D366",
              "&:hover": { bgcolor: "#128C7E" },
            }}
          >
            Book on WhatsApp
          </Button>
        </Box>
      </Card>
    </Container>
  </Box>
);

const Footer = () => (
  <Box
    component="footer"
    sx={{ bgcolor: "#333", color: "white", py: 4, textAlign: "center" }}
  >
    <Container maxWidth="lg">
      <Typography variant="body1">
        &copy; {new Date().getFullYear()} Aspen Glow by Shilpi. All Rights
        Reserved.
      </Typography>
      <Typography variant="body2" sx={{ color: "#aaa", mt: 1 }}>
        Designed with ❤️
      </Typography>
    </Container>
  </Box>
);

// Main App Component
export default function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline kickstarts an elegant, consistent, and simple baseline to build upon. */}
      <CssBaseline />
      {/* Google Fonts Import */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Playfair+Display:wght@400;700&display=swap');
          html { scroll-behavior: smooth; }
        `}
      </style>

      <Navbar />
      <main>
        <Hero />
        <Services />
        <Contact />
      </main>
      <Footer />
    </ThemeProvider>
  );
}
