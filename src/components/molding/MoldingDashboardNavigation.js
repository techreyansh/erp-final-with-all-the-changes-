import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Alert,
  useTheme,
  alpha,
  Stack,
  Divider,
  Container,
  Fade,
  Button,
} from "@mui/material";
import {
  Engineering as MoldIcon,
  Inventory as PowerCordIcon,
  Schedule as PlanningIcon,
  Build as ProductionIcon,
  PlayArrow as PlayIcon,
  Insights as InsightsIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";

// Import components
import KPICard from "../common/KPICard";

// Dashboard Component
const MoldingDashboardNavigation = () => {
  const theme = useTheme();

  const kpiCards = [
    {
      title: "Power Cord Master",
      description: "Manage power cord specifications (2-pin, 3-pin, 6A, 16A variants).",
      value: "24",
      subtitle: "Active Products",
      icon: <PowerCordIcon />,
      progress: 85,
      trend: "+12%",
      trendUp: true,
      variant: "default",
      color: "warning",
    },
    {
      title: "Production Planning",
      description: "Optimize cutting, assembly, and molding workflows with batch scheduling.",
      value: "3",
      subtitle: "Active Plans",
      icon: <PlanningIcon />,
      progress: 72,
      trend: "+8%",
      trendUp: true,
      variant: "gradient",
      color: "secondary",
    },
    {
      title: "Production Management",
      description: "Real-time monitoring of assembly lines and molding machines.",
      value: "97%",
      subtitle: "Overall Efficiency",
      icon: <ProductionIcon />,
      progress: 97,
      trend: "+3%",
      trendUp: true,
      variant: "default",
      color: "success",
    },
    {
      title: "Machine Monitoring",
      description: "Track 4 assembly lines and 6 molding machines with live status.",
      value: "8/10",
      subtitle: "Running",
      icon: <MoldIcon />,
      progress: 80,
      trend: "+15%",
      trendUp: true,
      variant: "gradient",
      color: "info",
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Dashboard Header */}
      <Box sx={{ mb: { xs: 4, sm: 5, md: 6 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
          <Box>
            <Typography 
              variant="h3" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.secondary.main})`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 1,
                fontSize: { xs: '1.75rem', sm: '2.125rem', md: '2.5rem' },
              }}
            >
              Production Dashboard
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 400,
              }}
            >
              Real-time insights and analytics for your injection molding operations
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<InsightsIcon />}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1.5,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: theme.shadows[8],
              backgroundColor: theme.palette.warning.main,
              '&:hover': {
                backgroundColor: theme.palette.warning.dark,
              },
            }}
          >
            View Analytics
          </Button>
        </Stack>
      </Box>
      
      {/* KPI Cards Grid Layout */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: { xs: 3, sm: 4, md: 5 },
          mb: { xs: 4, sm: 5, md: 8 },
          alignItems: 'stretch',
        }}
      >
        {kpiCards.map((card, index) => (
          <Fade in timeout={600 + (index * 200)} key={index}>
            <Box>
              <KPICard
                title={card.title}
                description={card.description}
                value={card.value}
                subtitle={card.subtitle}
                icon={card.icon}
                progress={card.progress}
                trend={card.trend}
                trendUp={card.trendUp}
                variant={card.variant}
                color={card.color}
              />
            </Box>
          </Fade>
        ))}
      </Box>

      {/* Process Flow Section */}
      <Fade in timeout={1000}>
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden',
            position: "relative",
          }}
        >
          {/* Section Header */}
          <Box 
            sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent sx={{ py: 3 }}>
              <Stack direction="row" alignItems="center" spacing={3}>
                <Box 
                  sx={{ 
                    p: 2, 
                    borderRadius: 3,
                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.main,
                  }}
                >
                  <AssignmentIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700, 
                      color: theme.palette.warning.main,
                      fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                      mb: 0.5,
                    }}
                  >
                    Power Cord Manufacturing Process
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Complete power cord manufacturing workflow from material inward to finished products
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Box>

          <CardContent sx={{ p: { xs: 4, sm: 5, md: 6 } }}>
            {/* Process Steps */}
            <Box sx={{ 
              display: "flex", 
              alignItems: "center", 
              gap: { xs: 3, sm: 4, md: 6 }, 
              flexWrap: "wrap", 
              justifyContent: "center",
            }}>
              {[
                { step: 1, label: "Material Inward", color: "#ff6f00", description: "Receive cables & raw materials" },
                { step: 2, label: "Wire Cut", color: "#ff8f00", description: "Cut cables to specific lengths" },
                { step: 3, label: "Assembly", color: "#ffa000", description: "Stripping, pin insertion, terminals" },
                { step: 4, label: "Molding", color: "#ffb300", description: "Inner, outer & grommet molding" },
                { step: 5, label: "Packaging", color: "#ffc107", description: "Final testing & packaging" },
              ].map((process, index) => (
                <Stack key={index} direction="column" alignItems="center" spacing={2}>
                  <Box 
                    sx={{ 
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: { xs: 80, sm: 90, md: 100 }, 
                        height: { xs: 80, sm: 90, md: 100 }, 
                        borderRadius: "50%", 
                        background: `linear-gradient(135deg, ${process.color} 0%, ${alpha(process.color, 0.8)} 100%)`,
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        color: "white",
                        boxShadow: `0 8px 32px ${alpha(process.color, 0.3)}`,
                        border: `3px solid ${alpha(process.color, 0.2)}`,
                        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        cursor: "pointer",
                        "&:hover": {
                          transform: "scale(1.1) translateY(-4px)",
                          boxShadow: `0 16px 40px ${alpha(process.color, 0.4)}`,
                        },
                      }}
                    >
                      <Typography 
                        variant="h3" 
                        sx={{ 
                          fontWeight: 800,
                          fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                        }}
                      >
                        {process.step}
                      </Typography>
                    </Box>
                    
                    {/* Connection Line */}
                    {index < 4 && (
                      <Box 
                        sx={{ 
                          position: "absolute",
                          top: "50%",
                          right: { xs: -20, sm: -24, md: -30 },
                          width: { xs: 40, sm: 48, md: 60 },
                          height: 3,
                          background: `linear-gradient(90deg, ${process.color}, ${alpha(process.color, 0.3)})`,
                          borderRadius: 2,
                          zIndex: 1,
                          display: { xs: 'none', sm: 'block' },
                        }}
                      />
                    )}
                  </Box>
                  
                  <Box sx={{ textAlign: "center", maxWidth: 120 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700,
                        color: process.color,
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        mb: 0.5,
                      }}
                    >
                      {process.label}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        lineHeight: 1.3,
                        display: "block",
                      }}
                    >
                      {process.description}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Box>
            
            <Divider sx={{ my: 5 }} />
            
            {/* Production Example */}
            <Alert 
              severity="warning" 
              sx={{ 
                borderRadius: 3,
                backgroundColor: alpha(theme.palette.warning.main, 0.05),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                '& .MuiAlert-icon': {
                  color: theme.palette.warning.main,
                },
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Production Example: 3-Pin Power Cord Order
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  lineHeight: 1.6,
                  '& strong': { fontWeight: 600 },
                }}
              >
                <strong>Order:</strong> 10,000 pieces × 16A × 3-pin molded power cords
                <br />
                <strong>Process:</strong> Injection molding cycle: 25s | Clamping force: 180T | Material: ABS+PC blend
                <br />
                <strong>Output:</strong> Expected production rate: 144 pieces/hour | Total time: ~70 hours
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Fade>
    </Container>
  );
};

export default MoldingDashboardNavigation;

