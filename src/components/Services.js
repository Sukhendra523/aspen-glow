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
import {
  AutoAwesome,
  Cake,
  ColorLens,
  ContentCut,
  FaceRetouchingNatural,
  Star,
} from "@mui/icons-material";
import ServiceCard from "./ServiceCard";
import {
  packages as defaultPackages,
  makeupServices as defaultMakeupServices,
  hairServices as defaultHairServices,
  bridalServices as defaultBridalServices,
} from "../constants/services";
import { formatInrPrice } from "../constants/serviceCatalogue";

const ICON_MAP = {
  AutoAwesome,
  ColorLens,
  Star,
  FaceRetouchingNatural,
  Cake,
  ContentCut,
};

function renderServiceIcon(iconName, iconUrl = "") {
  if (iconUrl && typeof iconUrl === "string" && iconUrl.trim()) {
    return (
      <Box
        component="img"
        src={iconUrl.trim()}
        alt=""
        sx={{ width: 28, height: 28, objectFit: "contain" }}
      />
    );
  }
  const IconComponent = ICON_MAP[iconName] || AutoAwesome;
  return <IconComponent sx={{ color: "primary.main" }} />;
}

function mapDbServiceToCard(service) {
  const inclusions = Array.isArray(service.inclusions)
    ? service.inclusions
    : [];
  const items =
    inclusions.length > 0
      ? inclusions
      : service.description
      ? [service.description]
      : [];
  return {
    icon: renderServiceIcon(service.icon_name, service.icon_url),
    title: service.name,
    price: formatInrPrice(service.price_inr, service.price_label),
    items,
  };
}

function mapDbPackageToCard(pkg) {
  const items = Array.isArray(pkg.items)
    ? pkg.items
    : pkg.description
    ? [pkg.description]
    : [];
  return {
    icon: renderServiceIcon(pkg.icon_name, pkg.icon_url),
    title: pkg.name,
    price: formatInrPrice(pkg.price_inr),
    items,
  };
}

function mapDbBundleToCard(bundle) {
  const packageItems = Array.isArray(bundle.items) ? bundle.items : [];
  const items = [
    ...(bundle.description ? [bundle.description] : []),
    ...packageItems.map((pkgName) => `Includes Package: ${pkgName}`),
  ];
  return {
    icon: renderServiceIcon(bundle.icon_name, bundle.icon_url),
    title: bundle.name,
    price: formatInrPrice(bundle.price_inr),
    items,
  };
}

const Services = ({
  publishedServices = null,
  publishedPackages = null,
  publishedBundles = null,
}) => {
  const activeServices = Array.isArray(publishedServices)
    ? publishedServices.filter((s) => s.status === "published")
    : [];
  const activePackages = Array.isArray(publishedPackages)
    ? publishedPackages.filter((p) => p.status === "published")
    : [];
  const activeBundles = Array.isArray(publishedBundles)
    ? publishedBundles.filter((b) => b.status === "published")
    : [];

  const hasDbServices = activeServices.length > 0;
  const hasDbPackages = activePackages.length > 0;
  const bundleList = activeBundles.map(mapDbBundleToCard);

  const makeupList = hasDbServices
    ? activeServices
        .filter((s) => s.category === "Makeup & Styling")
        .map(mapDbServiceToCard)
    : defaultMakeupServices;

  const bridalList = hasDbServices
    ? activeServices
        .filter((s) => s.category === "Bridal & Pre-Bridal")
        .map(mapDbServiceToCard)
    : defaultBridalServices;

  const packageList = hasDbPackages
    ? activePackages.map(mapDbPackageToCard)
    : defaultPackages;

  const hairList = hasDbServices
    ? activeServices
        .filter((s) => s.category === "Hair Services")
        .map((s) => ({
          name: s.name,
          price: formatInrPrice(s.price_inr, s.price_label),
        }))
    : defaultHairServices;

  const mehndiService = hasDbServices
    ? activeServices.find((s) => s.category === "Mehndi Artistry")
    : null;

  const mehndiDescription =
    mehndiService?.description ||
    "Intricate and beautiful Mehndi designs for all occasions. Bookings now open! Please contact for custom designs and pricing.";

  const mehndiPriceLine = mehndiService
    ? `𓏧♡ ${formatInrPrice(
        mehndiService.price_inr,
        mehndiService.price_label || "Starting from just"
      )}. ♡𓏧`
    : "𓏧♡ Starting from just ₹99. ♡𓏧";

  return (
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
            fontSize: { xs: "1rem", sm: "1.7rem", md: "2.125rem" },
            fontWeight: 600,
          }}
        >
          💄 Makeup &amp; Styling for Every Occasion 💄
        </Typography>
        <Grid container spacing={4} justifyContent="center" mb={8}>
          {makeupList.map((service) => (
            <Grid size={{ xs: 12, sm: 6, md: 5 }} key={service.title}>
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
          👰 Bridal &amp; Pre-Bridal Services 👰
        </Typography>
        <Grid container spacing={4} justifyContent="center" mb={8}>
          {bridalList.map((service) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={service.title}>
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
          {packageList.map((pkg) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={pkg.title}>
              <ServiceCard {...pkg} />
            </Grid>
          ))}
        </Grid>

        {bundleList.length > 0 && (
          <>
            <Typography
              variant="h3"
              textAlign="center"
              mb={4}
              sx={{
                fontSize: { xs: "1.3rem", sm: "1.7rem", md: "2.125rem" },
                fontWeight: 600,
              }}
            >
              🎁 Special Promotional Bundles 🎁
            </Typography>
            <Grid container spacing={4} mb={8} justifyContent="center">
              {bundleList.map((bundle) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={bundle.title}>
                  <ServiceCard {...bundle} />
                </Grid>
              ))}
            </Grid>
          </>
        )}

        <Grid container spacing={4} justifyContent="center">
          <Grid size={{ xs: 12, md: 6 }} sx={{ height: "290px"}}>
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
              sx={{
                p: 2,
                height:"100%",
                borderTop: "4px solid",
                borderColor: "primary.light",
              }}
            >
              <List>
                {hairList.map((service) => (
                  <ListItem
                    key={service.name}
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
          <Grid size={{ xs: 12, md: 6 }} sx={{ height : '290px'}}>
            <Typography
              variant="h3"
              textAlign="center"
              mb={4}
              sx={{
                fontSize: { xs: "1.3rem", sm: "1.7rem", md: "2.125rem" },
                fontWeight: 600,
              }}
            >
              ꧁🌸 Mehndi Artistry 🪷꧂
            </Typography>
            <Card
              sx={{
                p:2,
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
                <ColorLens
                  sx={{ fontSize: 48, color: "primary.main", mb: 2 }}
                />
                <Typography>{mehndiDescription}</Typography>
                <Typography
                  variant="h5"
                  sx={{
                    mt: 2,
                    fontWeight: "bold",
                    fontSize: { xs: "1.rem", sm: "1.7rem", md: "2.125rem" },
                  }}
                >
                  {mehndiPriceLine}
                </Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Services;
