import React from "react";
import { Box, Container, Typography, Card, Link, Button } from "@mui/material";
import { Phone, LocationOn, WhatsApp, EventAvailable } from "@mui/icons-material";
import {
  DEFAULT_CONTACT_SETTINGS,
  getSafeExternalUrl,
  getSafeTelHref,
  getSafeWhatsAppHref,
} from "../constants/defaultSettings";

const Contact = ({ contact = DEFAULT_CONTACT_SETTINGS }) => {
  const safeContact = { ...DEFAULT_CONTACT_SETTINGS, ...(contact || {}) };
  const safeBookingUrl = getSafeExternalUrl(safeContact.booking_url);

  return (
    <Box id="contact" component="section" sx={{ py: 8 }}>
      <Container maxWidth="sm" sx={{ textAlign: "center" }}>
        <Typography variant="h2" component="h2" mb={2}>
          Get in Touch
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          fontWeight="light"
          mb={4}
        >
          {safeContact.appointment_note}
        </Typography>
        <Card
          sx={{
            p: { xs: 3, md: 5 },
            borderTop: "4px solid",
            borderColor: "primary.main",
          }}
        >
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={3}
          >
            <Typography variant="h6">
              Contact: {safeContact.contact_name}
            </Typography>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Phone sx={{ color: "primary.main" }} />
              <Link
                href={getSafeTelHref(safeContact.phone)}
                underline="hover"
                variant="h6"
                color="text.primary"
              >
                {safeContact.phone}
              </Link>
            </Box>
            <Box display="flex" alignItems="center" gap={1.5}>
              <LocationOn sx={{ color: "primary.main" }} />
              <Typography variant="body1">{safeContact.address}</Typography>
            </Box>
            <Box
              display="flex"
              flexWrap="wrap"
              justifyContent="center"
              gap={2}
              mt={2}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<WhatsApp />}
                href={getSafeWhatsAppHref(safeContact.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  bgcolor: "#25D366",
                  "&:hover": { bgcolor: "#128C7E" },
                }}
              >
                Book on WhatsApp
              </Button>
              {safeBookingUrl && (
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  startIcon={<EventAvailable />}
                  href={safeBookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Book Online
                </Button>
              )}
            </Box>

            <Box
              sx={{
                mt: 2,
                pt: 2.5,
                borderTop: "1px dashed",
                borderColor: "divider",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                width: "100%",
              }}
            >
              <Box
                component="img"
                src="/aspen-glow-QR-code.png"
                alt="Scan QR Code to Book or Contact Aspen Glow by Shilpi"
                sx={{
                  width: 148,
                  height: 148,
                  objectFit: "contain",
                  p: 1,
                  bgcolor: "#ffffff",
                  border: "2px solid",
                  borderColor: "primary.main",
                  borderRadius: 2,
                  boxShadow: 1,
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight="bold"
              >
                Scan QR Code to Book Now
              </Typography>
            </Box>
          </Box>
        </Card>
      </Container>
    </Box>
  );
};

export default Contact;
