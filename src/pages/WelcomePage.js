import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {
  AssignmentTurnedInOutlined,
  BarChartOutlined,
  ChecklistOutlined,
  ContactMailOutlined,
  FactoryOutlined,
  HomeRepairServiceOutlined,
  Inventory2Outlined,
  NotificationsActiveOutlined,
  ReceiptLongOutlined,
  TrendingUpOutlined,
} from "@mui/icons-material";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import ScrollReveal from "../components/common/ScrollReveal";

const MotionBox = motion(Box);

function getDisplayName(user) {
  if (user?.name) return user.name;
  const emailName = user?.email?.split("@")?.[0];
  if (!emailName) return "there";
  return emailName
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getGreeting(date) {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function getRoleBucket(role, roleCode) {
  const normalized = `${role || ""} ${roleCode || ""}`.toUpperCase();
  if (normalized.includes("CEO") || normalized.includes("SUPER_ADMIN")) return "ceo";
  if (
    normalized.includes("MANAGER") ||
    normalized.includes("HOD") ||
    normalized.includes("DIRECTOR") ||
    normalized.includes("COORDINATOR")
  ) {
    return "manager";
  }
  return "employee";
}

const allActions = [
  {
    key: "crm",
    title: "CRM",
    description: "Leads, customers, follow-ups and sales pipeline.",
    path: "/crm/leads",
    icon: ContactMailOutlined,
    audience: ["ceo", "manager"],
  },
  {
    key: "ppc",
    title: "PPC",
    description: "Production planning, work orders and dispatch readiness.",
    path: "/ppc/production-plan",
    icon: FactoryOutlined,
    audience: ["ceo", "manager"],
  },
  {
    key: "inventory",
    title: "Inventory",
    description: "Stock, inward, outward and material availability.",
    path: "/inventory",
    icon: Inventory2Outlined,
    audience: ["ceo", "manager"],
  },
  {
    key: "sales",
    title: "Sales",
    description: "Sales workflow, quotations and order progress.",
    path: "/sales-flow",
    icon: ReceiptLongOutlined,
    audience: ["ceo", "manager"],
  },
  {
    key: "tasks",
    title: "Task Checklist",
    description: "Today’s assigned tasks, proof submission and status.",
    path: "/task-checklist",
    icon: ChecklistOutlined,
    audience: ["ceo", "manager", "employee"],
  },
  {
    key: "reports",
    title: "Reports",
    description: "Operational snapshots and performance summaries.",
    path: "/ppc/reports",
    icon: BarChartOutlined,
    audience: ["ceo", "manager"],
  },
];

function kpisForRole(bucket) {
  if (bucket === "ceo") {
    return [
      { label: "Tasks pending", value: "18", hint: "Across teams", icon: AssignmentTurnedInOutlined },
      { label: "Production status", value: "82%", hint: "Plans on track", icon: FactoryOutlined },
      { label: "Revenue snapshot", value: "Stable", hint: "Orders moving", icon: TrendingUpOutlined },
      { label: "Alerts", value: "4", hint: "Need review", icon: NotificationsActiveOutlined },
    ];
  }
  if (bucket === "manager") {
    return [
      { label: "Team tasks", value: "12", hint: "Open today", icon: AssignmentTurnedInOutlined },
      { label: "Pending approvals", value: "5", hint: "Awaiting action", icon: NotificationsActiveOutlined },
      { label: "Department status", value: "On track", hint: "No major blocker", icon: HomeRepairServiceOutlined },
      { label: "Completed", value: "9", hint: "This shift", icon: ChecklistOutlined },
    ];
  }
  return [
    { label: "Today’s tasks", value: "6", hint: "Assigned to you", icon: ChecklistOutlined },
    { label: "Pending", value: "3", hint: "Need action", icon: AssignmentTurnedInOutlined },
    { label: "Completed", value: "2", hint: "Submitted/approved", icon: TrendingUpOutlined },
    { label: "Personal score", value: "86%", hint: "Current compliance", icon: BarChartOutlined },
  ];
}

function WelcomePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const reduceMotion = useReducedMotion();
  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loader = window.setTimeout(() => setLoading(false), 220);
    const clock = window.setInterval(() => setNow(new Date()), 60000);
    return () => {
      window.clearTimeout(loader);
      window.clearInterval(clock);
    };
  }, []);

  const roleBucket = getRoleBucket(role || user?.role, user?.roleCode);
  const displayName = getDisplayName(user);
  const roleLabel = role || user?.roleCode || "Employee";
  const actions = allActions.filter((action) => action.audience.includes(roleBucket));
  const kpis = useMemo(() => kpisForRole(roleBucket), [roleBucket]);

  const activities =
    roleBucket === "employee"
      ? ["Proof pending for one task", "Checklist generated for today", "Last submission is awaiting review"]
      : ["Production plan updated", "Task approval queue refreshed", "CRM follow-up due today"];

  const alerts =
    roleBucket === "ceo"
      ? ["4 operational alerts require review", "2 approvals are pending from teams"]
      : roleBucket === "manager"
        ? ["5 approvals pending for your department", "1 overdue follow-up needs attention"]
        : ["3 tasks pending today", "Submit proof before the due time"];

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1, sm: 2 }, px: { xs: 0.5, sm: 2 } }}>
      <Stack spacing={3}>
        <ScrollReveal y={12}>
          <Paper
            elevation={2}
            sx={{
              p: { xs: 2.5, md: 3 },
              overflow: "hidden",
              position: "relative",
              bgcolor: "background.paper",
            }}
          >
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: "wrap" }}>
                  <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
                    }}
                  >
                    {getGreeting(now)}, {displayName}
                  </Typography>
                  <Chip label={roleLabel} color="primary" size="small" />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  Welcome to your ERP command center. Review priorities, then jump into the module you need.
                </Typography>
              </Box>

              <Stack spacing={0.5} sx={{ textAlign: { xs: "left", md: "right" } }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>
                  Current time
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {now.toLocaleString(undefined, {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        </ScrollReveal>

        <Grid container spacing={2}>
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <Grid item xs={12} sm={6} lg={3} key={kpi.label}>
                <ScrollReveal delay={index * 0.04} y={10}>
                  <Card variant="outlined" sx={{ height: "100%" }}>
                    <CardContent sx={{ "&:last-child": { pb: 2 } }}>
                      {loading ? (
                        <Stack spacing={1}>
                          <Skeleton width="45%" />
                          <Skeleton width="60%" height={34} />
                          <Skeleton width="55%" />
                        </Stack>
                      ) : (
                        <Stack direction="row" justifyContent="space-between" spacing={2}>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              {kpi.label}
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.75 }}>
                              {kpi.value}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {kpi.hint}
                            </Typography>
                          </Box>
                          <Box sx={{ color: "primary.main", p: 1, borderRadius: 1, bgcolor: "action.hover", height: 44 }}>
                            <Icon />
                          </Box>
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                </ScrollReveal>
              </Grid>
            );
          })}
        </Grid>

        <ScrollReveal y={14}>
          <Box>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5} sx={{ mb: 2 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Quick Actions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Navigate to common ERP modules in one click.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={() => navigate("/task-checklist")}>
                  Go to Tasks
                </Button>
                <Button variant="outlined" onClick={() => navigate("/dashboard")}>
                  Open Dashboard
                </Button>
              </Stack>
            </Stack>

            <Grid container spacing={2}>
              {actions.map((action, index) => {
                const Icon = action.icon;
                const content = (
                  <Card variant="outlined" sx={{ height: "100%" }}>
                    <CardActionArea onClick={() => navigate(action.path)} sx={{ height: "100%", alignItems: "stretch" }}>
                      <CardContent sx={{ height: "100%", minHeight: 150 }}>
                        <Stack spacing={1.5} sx={{ height: "100%" }}>
                          <Box sx={{ color: "primary.main", display: "flex" }}>
                            <Icon sx={{ fontSize: 30 }} />
                          </Box>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                              {action.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {action.description}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                );

                return (
                  <Grid item xs={12} sm={6} lg={4} xl={3} key={action.key}>
                    {reduceMotion ? (
                      <ScrollReveal delay={index * 0.04} y={10}>
                        {content}
                      </ScrollReveal>
                    ) : (
                      <MotionBox
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.16 }}
                        transition={{ duration: 0.32, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ y: -2 }}
                        sx={{ height: "100%" }}
                      >
                        {content}
                      </MotionBox>
                    )}
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </ScrollReveal>

        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <ScrollReveal y={12}>
              <Paper elevation={2} sx={{ p: 2.5, height: "100%" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Recent Activity
                </Typography>
                <Stack divider={<Divider flexItem />} spacing={1}>
                  {activities.map((item) => (
                    <Typography key={item} variant="body2" color="text.secondary" sx={{ py: 1 }}>
                      {item}
                    </Typography>
                  ))}
                </Stack>
              </Paper>
            </ScrollReveal>
          </Grid>
          <Grid item xs={12} md={5}>
            <ScrollReveal y={12} delay={0.04}>
              <Paper elevation={2} sx={{ p: 2.5, height: "100%" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Notifications
                </Typography>
                <Stack spacing={1}>
                  {alerts.map((alert) => (
                    <Alert key={alert} severity={roleBucket === "employee" ? "info" : "warning"} variant="outlined">
                      {alert}
                    </Alert>
                  ))}
                </Stack>
              </Paper>
            </ScrollReveal>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}

export default WelcomePage;
