import React from "react";
import { Card, CardContent, Box, Typography, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { Star } from "@mui/icons-material";

const ServiceCard = ({ icon, title, price, items }) => (
  <Card sx={{ height: "100%", display: "flex", flexDirection: "column", borderTop: "4px solid", borderColor: "primary.light", transition: "transform 0.3s", "&:hover": { transform: "translateY(-8px)" } }}>
    <CardContent sx={{ flexGrow: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Box sx={{ bgcolor: "#fce4ec", p: 1.5, borderRadius: "50%", mr: 2, display: "flex" }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h6" component="h3" fontWeight="bold">
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontFamily: "'Playfair Display', serif", color: "primary.main" }}>
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

export default ServiceCard;
