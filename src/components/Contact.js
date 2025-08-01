import React from "react";
import { Box, Container, Typography, Card, Link, Button } from "@mui/material";
import { Phone, LocationOn, WhatsApp } from "@mui/icons-material";

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
          <Typography variant="h6">Contact: Shilpi Chauhan</Typography>
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

export default Contact;
