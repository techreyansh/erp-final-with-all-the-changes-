import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Factory,
  AttachMoney,
  TrendingUp,
  LocalShipping,
  People,
  Warning,
  Security,
} from '@mui/icons-material';

const MODULES = [
  {
    title: 'Factory Operations Overview',
    description: 'Live production status, machine utilization, output vs target, and downtime metrics.',
    icon: Factory,
  },
  {
    title: 'Financial Intelligence Panel',
    description: 'Revenue, expenses, cash flow, AR/AP, and profit margin trends in one view.',
    icon: AttachMoney,
  },
  {
    title: 'Sales & Revenue Analytics',
    description: 'Performance by region, conversion rates, pipeline health, and forecasting.',
    icon: TrendingUp,
  },
  {
    title: 'Vendor & Supply Chain Monitoring',
    description: 'Vendor performance, delivery reliability, procurement trends, and inventory health.',
    icon: LocalShipping,
  },
  {
    title: 'Workforce Performance Insights',
    description: 'Attendance, productivity, department metrics, overtime, and attrition overview.',
    icon: People,
  },
  {
    title: 'Risk & Alert Center',
    description: 'Critical alerts, financial risks, production bottlenecks, and compliance flags.',
    icon: Warning,
  },
  {
    title: 'Master Control Panel',
    description: 'System-wide controls, audit trail, approvals override, and emergency access.',
    icon: Security,
  },
];

const ModuleCard = ({ title, description, icon: Icon, index }) => {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80 + index * 50);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        p: 2.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1), transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease, border-color 0.2s ease',
        '&:hover': {
          boxShadow: `0 12px 24px -8px ${alpha(theme.palette.common.black, 0.08)}, 0 4px 12px -4px ${alpha(theme.palette.common.black, 0.04)}`,
          borderColor: alpha(theme.palette.primary.main, 0.2),
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          }}
        >
          <Icon sx={{ fontSize: 24, color: 'primary.main' }} />
        </Box>
        <Chip label="Coming Soon" size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
      </Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ letterSpacing: '-0.01em', mb: 0.75 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
        {description}
      </Typography>
    </Paper>
  );
};

const CEOExecutiveDashboard = () => {
  const theme = useTheme();
  const [heroMounted, setHeroMounted] = useState(false);
  const [progressMounted, setProgressMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroMounted(true), 50);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setProgressMounted(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 8,
      }}
    >
      {/* Hero */}
      <Box
        sx={{
          background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.primary.main, 0.01)} 40%, transparent 100%)`,
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '40%',
            maxWidth: 360,
            height: '100%',
            background: `radial-gradient(ellipse at 100% 30%, ${alpha(theme.palette.primary.main, 0.06)} 0%, transparent 60%)`,
            pointerEvents: 'none',
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap' }}>
            <Box
              sx={{
                opacity: heroMounted ? 1 : 0,
                transform: heroMounted ? 'translateY(0)' : 'translateY(12px)',
                transition: 'opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1), transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                flex: '1 1 320px',
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.15,
                  color: 'text.primary',
                  mb: 1,
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                }}
              >
                Executive Dashboard
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  color: 'primary.main',
                  mb: 2,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                }}
              >
                Command Center – Coming Soon
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520, lineHeight: 1.6 }}>
                Strategic intelligence hub for company-wide visibility and decision-making.
              </Typography>
            </Box>
            <Box
              sx={{
                flexShrink: 0,
                opacity: heroMounted ? 1 : 0,
                transition: 'opacity 0.5s ease 0.2s',
              }}
            >
              <img
                src={process.env.PUBLIC_URL + '/reyansh-logo.png'}
                alt=""
                onError={(e) => { e.target.style.display = 'none'; }}
                style={{
                  maxHeight: 48,
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, mt: 4 }}>
        {/* Primary message */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.primary.main, 0.03),
            opacity: heroMounted ? 1 : 0,
            transform: heroMounted ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.45s ease 0.15s, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.15s',
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', mb: 1.5, lineHeight: 1.6 }}>
            We're building a comprehensive CEO command center with real-time analytics, performance intelligence, financial insights, and strategic reporting.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1, lineHeight: 1.6 }}>
            The structure below shows the control panels that will be available.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            In the meantime, use the navigation menu to access operational modules.
          </Typography>
        </Paper>

        {/* Control panel preview grid */}
        <Typography
          variant="overline"
          sx={{
            display: 'block',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: 'text.secondary',
            mb: 2,
          }}
        >
          Upcoming control panels
        </Typography>
        <Grid container spacing={2} sx={{ mb: 5 }}>
          {MODULES.map((mod, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <ModuleCard title={mod.title} description={mod.description} icon={mod.icon} index={i} />
            </Grid>
          ))}
        </Grid>

        {/* Progress indicator */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            opacity: progressMounted ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
              Executive Analytics Engine – In Development
            </Typography>
          </Box>
          <Box
            sx={{
              height: 6,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: '30%',
                borderRadius: 1,
                bgcolor: 'primary.main',
                animation: 'executive-progress 2.5s cubic-bezier(0.22, 1, 0.36, 1) infinite',
                '@media (prefers-reduced-motion: reduce)': {
                  animation: 'none',
                  width: '40%',
                },
              }}
            />
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default CEOExecutiveDashboard;
