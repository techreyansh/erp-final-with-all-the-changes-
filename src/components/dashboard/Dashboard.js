import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Card,
  CardContent,
  Skeleton,
  Stack,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  GroupsOutlined,
  MapOutlined,
  BadgeOutlined,
  InboxOutlined,
} from "@mui/icons-material";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { getAllClients } from "../../services/clientService";
import ScrollReveal from "../common/ScrollReveal";

/** Display placeholder for missing values */
function dash(value) {
  if (value == null || value === "") return "-";
  return String(value);
}

/**
 * Row shape from `getAllClients()` (camelCase) or raw Supabase / sheet row.
 */
function normalizeClientRow(row) {
  if (!row || typeof row !== "object") {
    return { id: "", clientname: null, city: null, state: null, gstin: null };
  }

  if (row.clientName != null || row.clientCode != null) {
    return {
      id: row.id ?? row.clientCode ?? "",
      clientname: row.clientName ?? row.ClientName,
      city: row.city ?? row.City,
      state: row.state ?? row.State,
      gstin: row.gstin ?? row.GSTIN,
    };
  }

  const rec =
    row.record && typeof row.record === "object" && !Array.isArray(row.record)
      ? row.record
      : {};
  const src = { ...rec, ...row };

  const pick = (...keys) => {
    for (let i = 0; i < keys.length; i += 1) {
      const k = keys[i];
      const v = src[k];
      if (v != null && v !== "") return v;
    }
    return null;
  };

  return {
    id: row.id ?? pick("id") ?? "",
    clientname: pick("clientname", "ClientName", "clientName", "CLIENTNAME"),
    city: pick("city", "City"),
    state: pick("state", "State"),
    gstin: pick("gstin", "GSTIN", "Gstin"),
  };
}

/**
 * Executive dashboard — `getAllClients()` runs on every mount (each navigation to Dashboard).
 * Triggers Supabase `GET /rest/v1/clients2` via `db.getTableRows` inside `clientService`.
 */
const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [clients, setClients] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;

    console.log("FETCH STARTED");

    setFetchLoading(true);
    setFetchError(null);

    getAllClients()
      .then((data) => {
        if (cancelled) return;
        console.log("FETCH SUCCESS");
        console.log("Dashboard clients payload:", data);
        setClients(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("FETCH ERROR:", err);
        setFetchError(err instanceof Error ? err : new Error(String(err)));
        setClients([]);
      })
      .finally(() => {
        if (!cancelled) setFetchLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = clients.map(normalizeClientRow);

  const kpis = useMemo(() => {
    const withGst = rows.filter((r) => r.gstin != null && String(r.gstin).trim() !== "").length;
    const states = new Set(
      rows.map((r) => (r.state != null ? String(r.state).trim().toLowerCase() : "")).filter(Boolean)
    );
    return {
      total: rows.length,
      withGst,
      stateCount: states.size,
    };
  }, [rows]);

  const kpiList = [
    {
      label: "Total clients",
      value: kpis.total,
      icon: GroupsOutlined,
    },
    {
      label: "With GSTIN",
      value: kpis.withGst,
      icon: BadgeOutlined,
    },
    {
      label: "States",
      value: kpis.stateCount,
      icon: MapOutlined,
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 3, md: 4 }, mb: { xs: 4, md: 8 }, px: { xs: 1.5, sm: 2 } }}>
      {authLoading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Checking access…
        </Alert>
      )}

      {!authLoading && !user && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Not signed in — clients still load for debugging; RLS may return an empty list.
        </Alert>
      )}

      <ScrollReveal y={12}>
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1, flexWrap: "wrap" }}>
            <DashboardIcon sx={{ fontSize: { xs: 32, sm: 40 }, color: "primary.main" }} aria-hidden />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  fontSize: { xs: "1.35rem", sm: "1.5rem", md: "2rem" },
                }}
              >
                Executive Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Clients overview — getAllClients on each Dashboard load (see Network → /rest/v1/clients2)
              </Typography>
            </Box>
          </Box>
        </Paper>
      </ScrollReveal>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {fetchLoading
          ? [0, 1, 2].map((i) => (
              <Grid item xs={12} sm={6} lg={4} key={i}>
                <ScrollReveal delay={i * 0.06} y={10}>
                  <Card variant="outlined" sx={{ borderRadius: 1, height: "100%" }}>
                    <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                      <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />
                      <Skeleton variant="text" width="55%" height={36} />
                    </CardContent>
                  </Card>
                </ScrollReveal>
              </Grid>
            ))
          : kpiList.map((k, i) => {
              const KpiIcon = k.icon;
              const cardInner = (
                <Card variant="outlined" sx={{ borderRadius: 1, height: "100%" }}>
                  <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}
                        >
                          {k.label}
                        </Typography>
                        <Typography variant="h4" component="p" sx={{ fontWeight: 700, mt: 0.5, lineHeight: 1.2 }}>
                          {k.value}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          bgcolor: "action.hover",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <KpiIcon sx={{ fontSize: 28, color: "primary.main" }} aria-hidden />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              );

              return (
                <Grid item xs={12} sm={6} lg={4} key={k.label}>
                  {reduceMotion ? (
                    <ScrollReveal delay={i * 0.08} y={12}>
                      {cardInner}
                    </ScrollReveal>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 14, scale: 0.985 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{
                        duration: 0.35,
                        delay: i * 0.08,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      style={{ height: "100%" }}
                    >
                      {cardInner}
                    </motion.div>
                  )}
                </Grid>
              );
            })}
      </Grid>

      {fetchError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Could not load clients: {fetchError.message || String(fetchError)}
        </Alert>
      )}

      <ScrollReveal y={14} delay={0.05}>
        <Paper elevation={2} sx={{ borderRadius: 1, overflow: "hidden" }}>
          <Box sx={{ px: { xs: 2, sm: 3 }, py: 2, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              Clients
            </Typography>
          </Box>

          {fetchLoading ? (
            <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Client name</TableCell>
                    <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>City</TableCell>
                    <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>State</TableCell>
                    <TableCell sx={{ display: { xs: "table-cell", sm: "table-cell" } }}>GSTIN</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <Skeleton variant="rounded" height={36} sx={{ borderRadius: 1 }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : !fetchError && rows.length === 0 ? (
            <Box sx={{ py: 6, px: 2, textAlign: "center" }}>
              <InboxOutlined sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} aria-hidden />
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                No clients found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Data will appear here once clients are available in the system.
              </Typography>
            </Box>
          ) : !fetchError ? (
            <TableContainer
              sx={{
                maxHeight: 480,
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <Table size="small" stickyHeader aria-label="Clients table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Client name</TableCell>
                    <TableCell sx={{ fontWeight: 600, display: { xs: "none", sm: "table-cell" } }}>City</TableCell>
                    <TableCell sx={{ fontWeight: 600, display: { xs: "none", md: "table-cell" } }}>State</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>GSTIN</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((client, index) => (
                    <TableRow
                      key={
                        client.id
                          ? String(client.id)
                          : `client-row-${index}`
                      }
                      hover
                      sx={(theme) => ({
                        "&:nth-of-type(even)": {
                          bgcolor: theme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.08)" : theme.palette.grey[50],
                        },
                      })}
                    >
                      <TableCell>{dash(client.clientname)}</TableCell>
                      <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>{dash(client.city)}</TableCell>
                      <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{dash(client.state)}</TableCell>
                      <TableCell>{dash(client.gstin)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </Paper>
      </ScrollReveal>

      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        sx={{ mt: 3, textAlign: "center" }}
      >
        Additional analytics and KPIs coming soon.
      </Typography>
    </Container>
  );
};

export default Dashboard;
