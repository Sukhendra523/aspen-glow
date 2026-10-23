import React from "react";
import { Box, Container, Typography, Button } from "@mui/material";
import defaultLogo from "../assets/logo.png";
import {
  DEFAULT_BRAND_SETTINGS,
  getSafeExternalUrl,
} from "../constants/defaultSettings";

const Hero = ({ brand = DEFAULT_BRAND_SETTINGS }) => {
  const safeBrand = { ...DEFAULT_BRAND_SETTINGS, ...(brand || {}) };
  const logoSrc = getSafeExternalUrl(safeBrand.logo_url) || defaultLogo;

  return (
    <Box id="home" component="section" sx={{ py: { xs: 8, md: 12 } }}>
      <Container maxWidth="md" sx={{ textAlign: "center" }}>
        <Box mb={4}>
          <img
            src={logoSrc}
            alt={`${safeBrand.brand_name} Logo`}
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
          {safeBrand.tagline}
        </Typography>
        <Typography
          variant="body1"
          sx={{ mb: 4, maxWidth: "700px", mx: "auto", color: "text.secondary" }}
        >
          {safeBrand.hero_description}
        </Typography>
        <Button variant="contained" size="large" href="#contact">
          Book an Appointment
        </Button>
      </Container>
    </Box>
  );
};

export default Hero;
