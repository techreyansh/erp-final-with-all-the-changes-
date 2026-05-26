import React from "react";
import { Container, Box } from "@mui/material";
import MoldingProductionPlanning from "./MoldingProductionPlanning";

const ProductionPlanningNavigation = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box>
        <MoldingProductionPlanning />
      </Box>
    </Container>
  );
};

export default ProductionPlanningNavigation;

