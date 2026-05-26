import React from "react";
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField } from "@mui/material";
import { Download, FilterList, Save } from "@mui/icons-material";

const EnterpriseToolbar = ({
  search,
  setSearch,
  role,
  setRole,
  onExport,
  viewName,
  setViewName,
  onSaveView,
  children
}) => (
  <Stack spacing={1.5}>
    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Role</InputLabel>
          <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
            <MenuItem value="Admin">Admin</MenuItem>
            <MenuItem value="Sales">Sales</MenuItem>
            <MenuItem value="Production">Production</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      <Stack direction="row" spacing={1}>
        <Button startIcon={<FilterList />} variant="outlined">Advanced Filters</Button>
        <Button startIcon={<Download />} variant="outlined" onClick={onExport}>Export CSV</Button>
      </Stack>
    </Stack>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
      <TextField
        size="small"
        label="Saved view name"
        value={viewName}
        onChange={(e) => setViewName(e.target.value)}
        sx={{ maxWidth: 260 }}
      />
      <Button startIcon={<Save />} variant="outlined" onClick={onSaveView}>Save View</Button>
      <Box sx={{ flex: 1 }} />
      {children}
    </Stack>
  </Stack>
);

export default EnterpriseToolbar;
