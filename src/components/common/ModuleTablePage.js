import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography
} from "@mui/material";
import { Add, Close, Delete, Edit, FilterList, GetApp, InboxOutlined } from "@mui/icons-material";
import ScrollReveal from "./ScrollReveal";

const columnCellSx = (column) => {
  if (!column?.hideBelow) return {};
  if (column.hideBelow === "md") {
    return { display: { xs: "none", md: "table-cell" } };
  }
  if (column.hideBelow === "sm") {
    return { display: { xs: "none", sm: "table-cell" } };
  }
  return {};
};

const compareValues = (a, b) => {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a ?? "").localeCompare(String(b ?? ""));
};

const ModuleTablePage = ({
  title,
  breadcrumbItems,
  columns,
  data,
  setData,
  formFields,
  idPrefix,
  loading,
  readOnly = false,
  onSaveRow,
  onDeleteRow
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(columns[0]?.key || "id");
  const [sortDirection, setSortDirection] = useState("asc");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const [saving, setSaving] = useState(false);

  const filteredAndSortedData = useMemo(() => {
    const searched = data.filter((row) =>
      columns.some((col) => String(row[col.key] ?? "").toLowerCase().includes(search.toLowerCase()))
    );
    const sorted = [...searched].sort((a, b) => {
      const val = compareValues(a[sortBy], b[sortBy]);
      return sortDirection === "asc" ? val : -val;
    });
    return sorted;
  }, [columns, data, search, sortBy, sortDirection]);

  const paginatedData = filteredAndSortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleSort = (columnKey) => {
    if (sortBy === columnKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(columnKey);
    setSortDirection("asc");
  };

  const resetForm = () => {
    const next = {};
    formFields.forEach((field) => {
      next[field.key] = field.type === "multiselect" ? [] : "";
    });
    setFormValues(next);
    setEditingRow(null);
    setErrors({});
  };

  const handleAdd = () => {
    resetForm();
    setDrawerOpen(true);
  };

  const handleEdit = (row) => {
    const next = {};
    formFields.forEach((field) => {
      next[field.key] = row[field.key] ?? (field.type === "multiselect" ? [] : "");
    });
    setFormValues(next);
    setEditingRow(row);
    setErrors({});
    setDrawerOpen(true);
  };

  const validate = () => {
    const nextErrors = {};
    formFields.forEach((field) => {
      if (field.required) {
        const value = formValues[field.key];
        const emptyArray = Array.isArray(value) && value.length === 0;
        if (value === "" || value == null || emptyArray) nextErrors[field.key] = `${field.label} is required`;
      }
      if (field.type === "email" && formValues[field.key] && !/\S+@\S+\.\S+/.test(formValues[field.key])) {
        nextErrors[field.key] = "Enter a valid email";
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingRow) {
        const rowToSave = { ...editingRow, ...formValues };
        const persisted = onSaveRow ? await onSaveRow(rowToSave) : rowToSave;
        setData((prev) => prev.map((row) => (row.id === editingRow.id ? persisted : row)));
        setToast({ open: true, message: `${title} updated successfully`, severity: "success" });
      } else {
        const newId = `${idPrefix}-${String(data.length + 1).padStart(4, "0")}`;
        const rowToSave = { id: newId, ...formValues };
        const persisted = onSaveRow ? await onSaveRow(rowToSave) : rowToSave;
        setData((prev) => [persisted, ...prev]);
        setToast({ open: true, message: `${title} added successfully`, severity: "success" });
      }
      setDrawerOpen(false);
    } catch (error) {
      setToast({ open: true, message: error?.message || "Failed to save record", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete ${row.id}?`)) return;
    try {
      if (onDeleteRow) await onDeleteRow(row);
      setData((prev) => prev.filter((item) => item.id !== row.id));
      setToast({ open: true, message: `${title} deleted`, severity: "info" });
    } catch (error) {
      setToast({ open: true, message: error?.message || "Failed to delete record", severity: "error" });
    }
  };

  const renderField = (field) => {
    if (field.type === "select") {
      return (
        <FormControl fullWidth error={Boolean(errors[field.key])}>
          <InputLabel>{field.label}</InputLabel>
          <Select
            label={field.label}
            value={formValues[field.key] ?? ""}
            onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
          >
            {field.options.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
          {errors[field.key] && <Typography color="error" variant="caption">{errors[field.key]}</Typography>}
        </FormControl>
      );
    }
    if (field.type === "multiselect") {
      return (
        <FormControl fullWidth error={Boolean(errors[field.key])}>
          <InputLabel>{field.label}</InputLabel>
          <Select
            multiple
            label={field.label}
            value={formValues[field.key] ?? []}
            onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
            renderValue={(selected) => selected.join(", ")}
          >
            {field.options.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
          {errors[field.key] && <Typography color="error" variant="caption">{errors[field.key]}</Typography>}
        </FormControl>
      );
    }
    return (
      <TextField
        fullWidth
        label={field.label}
        type={field.type === "textarea" ? "text" : field.type}
        multiline={field.type === "textarea"}
        minRows={field.type === "textarea" ? 3 : undefined}
        value={formValues[field.key] ?? ""}
        onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
        error={Boolean(errors[field.key])}
        helperText={errors[field.key]}
      />
    );
  };

  const colSpan = columns.length + (readOnly ? 0 : 1);

  return (
    <Stack spacing={3}>
      <ScrollReveal y={12}>
        <Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 0.5, letterSpacing: "-0.02em" }}>
            {title}
          </Typography>
          <Breadcrumbs sx={{ fontSize: 13, "& .MuiLink-root": { lineHeight: 1.5 } }}>
            {breadcrumbItems.map((item) => (
              <Link key={item} color="inherit" underline="hover">
                {item}
              </Link>
            ))}
          </Breadcrumbs>
        </Box>
      </ScrollReveal>

      <ScrollReveal y={14} delay={0.04}>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {!readOnly && (
              <Button startIcon={<Add />} variant="contained" onClick={handleAdd}>
                Add
              </Button>
            )}
            <Button startIcon={<FilterList />} variant="outlined">
              Filter
            </Button>
            <Button startIcon={<GetApp />} variant="outlined">
              Export
            </Button>
          </Stack>
          <TextField
            size="small"
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: { xs: "100%", md: 280 } }}
          />
        </Stack>
      </Paper>
      </ScrollReveal>

      <ScrollReveal y={16} delay={0.06}>
      <TableContainer
        component={Paper}
        elevation={2}
        sx={{
          maxHeight: { xs: 360, sm: 520 },
          borderRadius: 1,
          overflowX: "auto",
          maxWidth: "100%",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Table stickyHeader size="medium" aria-label={`${title} data table`}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.key} sx={{ py: 1.5, ...columnCellSx(column) }}>
                  <TableSortLabel
                    active={sortBy === column.key}
                    direction={sortBy === column.key ? sortDirection : "asc"}
                    onClick={() => handleSort(column.key)}
                  >
                    {column.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              {!readOnly && (
                <TableCell align="right" sx={{ py: 1.5, width: 1, whiteSpace: "nowrap" }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [...Array(Math.min(rowsPerPage, 6))].map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.key} sx={columnCellSx(col)}>
                      <Skeleton variant="text" height={22} sx={{ borderRadius: 0.5 }} />
                    </TableCell>
                  ))}
                  {!readOnly && (
                    <TableCell>
                      <Skeleton variant="rounded" width={72} height={32} sx={{ borderRadius: 1, ml: "auto" }} />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} align="center" sx={{ py: 6, borderBottom: "none" }}>
                  <Stack alignItems="center" spacing={1.5}>
                    <InboxOutlined sx={{ fontSize: 48, color: "text.disabled", opacity: 0.85 }} aria-hidden />
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                      No data available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add a record or adjust your search to see rows here.
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={(theme) => ({
                    "&:nth-of-type(even)": {
                      bgcolor: theme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.08)" : theme.palette.grey[50],
                    },
                  })}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} sx={{ py: 1.75, ...columnCellSx(column) }}>
                      {column.type === "status" ? (
                        <Chip
                          size="small"
                          label={row[column.key]}
                          color={column.getColor?.(row[column.key]) || "default"}
                        />
                      ) : Array.isArray(row[column.key]) ? (
                        row[column.key].join(", ")
                      ) : (
                        row[column.key]
                      )}
                    </TableCell>
                  ))}
                  {!readOnly && (
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <Stack
                        direction="row"
                        spacing={0.25}
                        justifyContent="flex-end"
                        className="module-row-actions"
                        sx={{
                          opacity: { xs: 1, md: 0 },
                          transition: "opacity 0.18s ease",
                          ".MuiTableRow-root:hover &": { opacity: 1 },
                        }}
                      >
                        <IconButton size="small" onClick={() => handleEdit(row)} aria-label="Edit row">
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(row)} aria-label="Delete row">
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </ScrollReveal>

      <ScrollReveal y={10} delay={0.05}>
      <Paper elevation={1}>
        <TablePagination
          component="div"
          count={filteredAndSortedData.length}
          page={page}
          onPageChange={(_, next) => setPage(next)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Paper>
      </ScrollReveal>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => !saving && setDrawerOpen(false)}
        transitionDuration={{ enter: 240, exit: 200 }}
        ModalProps={{
          sx: {
            "& .MuiBackdrop-root": {
              transition: "opacity 0.2s ease",
            },
          },
        }}
      >
        <Box
          component="aside"
          sx={{
            width: { xs: "100vw", sm: 420 },
            maxWidth: "100%",
            p: 3,
            height: "100%",
            overflow: "auto",
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              {editingRow ? `Edit ${title}` : `Add ${title}`}
            </Typography>
            <IconButton onClick={() => !saving && setDrawerOpen(false)} aria-label="Close drawer" disabled={saving}>
              <Close />
            </IconButton>
          </Stack>
          <Grid container spacing={2}>
            {formFields.map((field) => (
              <Grid item xs={12} key={field.key}>
                {renderField(field)}
              </Grid>
            ))}
          </Grid>
          <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
            <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ minWidth: 120 }}>
              {saving ? <CircularProgress size={20} color="inherit" aria-label="Saving" /> : "Save"}
            </Button>
            <Button variant="outlined" onClick={() => !saving && setDrawerOpen(false)} disabled={saving}>
              Cancel
            </Button>
          </Stack>
        </Box>
      </Drawer>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={toast.severity} onClose={() => setToast((prev) => ({ ...prev, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
};

export default ModuleTablePage;
