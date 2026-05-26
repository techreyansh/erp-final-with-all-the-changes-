import React from "react";
import { Box, Breadcrumbs, Chip, Link, Paper, Stack, Typography } from "@mui/material";

const stageColor = {
  New: "default",
  Negotiation: "warning",
  "Quotation Sent": "info",
  Won: "success",
  Lost: "error"
};

const stages = ["New", "Negotiation", "Quotation Sent", "Won", "Lost"];

const DealsKanban = ({ deals }) => (
  <Stack spacing={2}>
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Deals Pipeline</Typography>
      <Breadcrumbs sx={{ fontSize: 13 }}>
        <Link color="inherit" underline="hover">CRM</Link>
        <Link color="inherit" underline="hover">Deals</Link>
      </Breadcrumbs>
    </Box>
    <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
      {stages.map((stage) => (
        <Paper key={stage} sx={{ p: 1.5, minWidth: 220, flex: 1, boxShadow: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>{stage}</Typography>
          <Stack spacing={1.5}>
            {deals.filter((deal) => deal.stage === stage).map((deal) => (
              <Paper key={deal.id} sx={{ p: 1.25, border: "1px solid", borderColor: "divider" }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{deal.companyName}</Typography>
                <Typography variant="caption" color="text.secondary">Value: INR {deal.dealValue.toLocaleString("en-IN")}</Typography>
                <br />
                <Typography variant="caption" color="text.secondary">Probability: {deal.probability}%</Typography>
                <br />
                <Typography variant="caption" color="text.secondary">Closing: {deal.expectedClosingDate}</Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip size="small" color={stageColor[stage]} label={stage} />
                </Box>
              </Paper>
            ))}
          </Stack>
        </Paper>
      ))}
    </Stack>
  </Stack>
);

export default DealsKanban;
