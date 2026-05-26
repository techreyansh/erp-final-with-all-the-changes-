import React from "react";
import { Container, Box } from "@mui/material";
import ProductionManagement from "./ProductionManagement";

const ProductionManagementNavigation = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box>
        <ProductionManagement />
      </Box>
    </Container>
  );
};

export default ProductionManagementNavigation;

