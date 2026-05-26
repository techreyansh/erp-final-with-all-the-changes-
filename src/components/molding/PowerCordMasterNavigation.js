import React from "react";
import { Container, Box } from "@mui/material";
import PowerCordMaster from "./PowerCordMaster";

const PowerCordMasterNavigation = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box>
        <PowerCordMaster />
      </Box>
    </Container>
  );
};

export default PowerCordMasterNavigation;

