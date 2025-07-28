import React from "react";
import { Box, Container, Typography, Button } from "@mui/material";
import logo from "../assets/logo.png";

const Hero = () => (
  <Box id="home" component="section" sx={{ py: { xs: 8, md: 12 } }}>
    <Container maxWidth="md" sx={{ textAlign: "center" }}>
      <Box mb={4}>
        <img src={logo} alt="Aspen Glow by Shilpi Logo" style={{ maxWidth: "250px", width: "100%", height: "auto", margin: "0 auto" }} />
      </Box>
      <Typography variant="h4" component="h2" sx={{ mt: 4, mb: 2, fontWeight: "light" }}>
        Bringing the Salon Experience at DevSai Sports Home
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, maxWidth: "700px", mx: "auto", color: "text.secondary" }}>
        Hello! I am a professionally trained beautician offering a wide range of services exclusively for our society.
      </Typography>
      <Button variant="contained" size="large" href="#contact">
        Book an Appointment
      </Button>
    </Container>
  </Box>
);

export default Hero;
