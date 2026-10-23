import React from "react";
import { Box, Container, Typography } from "@mui/material";
import { DEFAULT_BRAND_SETTINGS } from "../constants/defaultSettings";

const Footer = ({ brand = DEFAULT_BRAND_SETTINGS }) => {
  const safeBrand = { ...DEFAULT_BRAND_SETTINGS, ...(brand || {}) };

  return (
    <Box
      component="footer"
      sx={{ bgcolor: "#333", color: "white", py: 4, textAlign: "center" }}
    >
      <Container maxWidth="lg">
        <Typography variant="body1">
          &copy; {new Date().getFullYear()} {safeBrand.brand_name}. All Rights
          Reserved.
        </Typography>
        <Typography variant="body2" sx={{ color: "#aaa", mt: 1 }}>
          Designed with ❤️
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
