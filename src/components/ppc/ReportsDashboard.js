import React from "react";
import { Grid, Paper, Stack, Typography } from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const ReportsDashboard = ({ reportMetrics, leadConversionRate }) => {
  const defectData = [
    { name: "Defect", value: reportMetrics.defectRate },
    { name: "Good", value: 100 - reportMetrics.defectRate }
  ];

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>PPC Reports Dashboard</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 320, boxShadow: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Production vs Target</Typography>
            <ResponsiveContainer width="100%" height="88%">
              <BarChart data={reportMetrics.productionVsTarget}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="target" fill="#94A3B8" />
                <Bar dataKey="production" fill="#0D9488" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 320, boxShadow: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Defect Rate</Typography>
            <ResponsiveContainer width="100%" height="78%">
              <PieChart>
                <Pie data={defectData} dataKey="value" outerRadius={70} label>
                  <Cell fill="#DC2626" />
                  <Cell fill="#059669" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Typography variant="body2" color="text.secondary" align="center">
              Current Defect Rate: {reportMetrics.defectRate}%
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 320, boxShadow: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Machine Utilization</Typography>
            <ResponsiveContainer width="100%" height="88%">
              <BarChart data={reportMetrics.machineUtilization}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="machine" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="utilization" fill="#0284C7" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 320, boxShadow: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Lead Conversion Rate</Typography>
            <Typography variant="h3" color="primary.main" sx={{ fontWeight: 700, mt: 6, textAlign: "center" }}>
              {leadConversionRate}%
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              Derived from CRM leads to won deals
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default ReportsDashboard;
