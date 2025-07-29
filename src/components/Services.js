import React from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { ContentCut, ColorLens } from "@mui/icons-material";
import ServiceCard from "./ServiceCard";
import {
  packages,
  makeupServices,
  hairServices,
  bridalServices,
} from "../constants/services";

const Services = () => (
  <Box id="services" component="section" sx={{ py: 8, bgcolor: "#f9f9f9" }}>
    <Container maxWidth="lg">
      <Box textAlign="center" mb={8}>
        <Typography
          variant="h2"
          component="h2"
          sx={{
            fontSize: { xs: "1.7rem", sm: "2.5rem", md: "3rem" },
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          ✨ Our Exclusive Services ✨
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          fontWeight="light"
          sx={{ fontSize: { xs: "1rem", sm: "1.25rem", md: "1.5rem" } }}
        >
          Tailored packages to make you shine.
        </Typography>
      </Box>

      {/* Makeup & Styling */}
      <Typography
        variant="h3"
        textAlign="center"
        mb={4}
        sx={{
          fontSize: { xs: "1.2rem", sm: "1.7rem", md: "2.125rem" },
          fontWeight: 600,
        }}
      >
        💄 Makeup & Styling for Every Occasion 💄
      </Typography>
      <Grid container spacing={4} justifyContent="center" mb={8}>
        {makeupServices.map((service, index) => (
          <Grid item key={index} xs={12} sm={6} md={5}>
            <ServiceCard {...service} />
          </Grid>
        ))}
      </Grid>

      {/* Bridal & Pre-Bridal */}
      <Typography
        variant="h3"
        textAlign="center"
        mb={4}
        sx={{
          fontSize: { xs: "1.3rem", sm: "1.7rem", md: "2.125rem" },
          fontWeight: 600,
        }}
      >
        👰 Bridal & Pre-Bridal Services 👰
      </Typography>
      <Grid container spacing={4} justifyContent="center" mb={8}>
        {bridalServices.map((service, index) => (
          <Grid item key={index} xs={12} sm={6} md={4}>
            <ServiceCard {...service} />
          </Grid>
        ))}
      </Grid>

      <Typography
        variant="h3"
        textAlign="center"
        mb={4}
        sx={{
          fontSize: { xs: "1.3rem", sm: "1.7rem", md: "2.125rem" },
          fontWeight: 600,
        }}
      >
        👑 Exclusive Beauty Packages 👑
      </Typography>
      <Grid container spacing={4} mb={8} justifyContent="center">
        {packages.map((pkg, index) => (
          <Grid item key={index} xs={12} sm={6} md={4}>
            <ServiceCard {...pkg} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={6}>
          <Typography
            variant="h3"
            textAlign="center"
            mb={4}
            sx={{
              fontSize: { xs: "1.3rem", sm: "1.7rem", md: "2.125rem" },
              fontWeight: 600,
            }}
          >
            ✂️ À La Carte Hair Services ✂️
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
          <Typography
            variant="h3"
            textAlign="center"
            mb={4}
            sx={{
              fontSize: { xs: "1.3rem", sm: "1.7rem", md: "2.125rem" },
              fontWeight: 600,
            }}
          >
            ꧁🌸🌷🪷 Mehndi Artistry 🪷🌷🌸꧂
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
              <Typography
                variant="h5"
                sx={{
                  mt: 2,
                  fontWeight: "bold",
                  fontSize: { xs: "1.rem", sm: "1.7rem", md: "2.125rem" },
                }}
              >
                𓏧♡ Starting from just ₹99. ♡𓏧
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Container>
  </Box>
);

export default Services;
