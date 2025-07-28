import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Drawer,
} from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import logo from "../assets/logo.png";

const navLinks = ["Home", "Services", "Contact"];

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

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
          <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 2 }}>
            <img src={logo} alt="Aspen Glow Logo" style={{ height: "45px", width: "auto" }} />
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1, color: "text.primary", fontFamily: "'Playfair Display', serif" }}
            >
              Aspen Glow
            </Typography>
          </Box>
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            {navLinks.map((item) => (
              <Button key={item} component="a" href={`#${item.toLowerCase()}`} sx={{ color: "text.primary" }}>
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

export default Navbar;
