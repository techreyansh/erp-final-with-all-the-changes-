import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { InboxOutlined } from '@mui/icons-material';
import taskComplianceService from '../../services/taskComplianceService';

const STATUS_COLOR = {
  pending: 'default',
  submitted: 'info',
  approved: 'success',
  rejected: 'error',
};

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function AdminTaskApprovalPanel() {
  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [department, setDepartment] = useState('All');
  const [taskType, setTaskType] = useState('All');
  const [status, setStatus] = useState('submitted');
  const [rejectionReason, setRejectionReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      await taskComplianceService.generateForDate(todayIso());
      const data = await taskComplianceService.listTaskInstances({
        status: status === 'All' ? null : status,
        department: department === 'All' ? null : department,
        taskType: taskType === 'All' ? null : taskType,
        includeTemplate: true,
      });
      setRows(data);
    } catch (e) {
      console.error(e);
      setError(e?.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [department, taskType, status]);

  useEffect(() => {
    const unsubscribe = taskComplianceService.subscribeToTaskRealtime({
      onTaskChange: () => loadData(),
    });
    return unsubscribe;
  }, [department, taskType, status]);

  const pendingApprovals = useMemo(
    () => rows.filter((r) => r.status === 'submitted').length,
    [rows]
  );

  const toggleSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const bulkApprove = async () => {
    try {
      await Promise.all(selectedIds.map((id) => taskComplianceService.approveTask(id)));
      setSelectedIds([]);
      await loadData();
    } catch (e) {
      setError(e?.message || 'Bulk approve failed');
    }
  };

  const bulkReject = async () => {
    try {
      await Promise.all(
        selectedIds.map((id) => taskComplianceService.rejectTask(id, rejectionReason))
      );
      setSelectedIds([]);
      setRejectionReason('');
      await loadData();
    } catch (e) {
      setError(e?.message || 'Bulk reject failed');
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
          Admin Approval Panel
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Pending approvals: {pendingApprovals}
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper elevation={2} sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Department</InputLabel>
            <Select value={department} label="Department" onChange={(e) => setDepartment(e.target.value)}>
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="CRM">CRM</MenuItem>
              <MenuItem value="PPC">PPC</MenuItem>
              <MenuItem value="Production">Production</MenuItem>
              <MenuItem value="Quality">Quality</MenuItem>
              <MenuItem value="Dispatch">Dispatch</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Task Type</InputLabel>
            <Select value={taskType} label="Task Type" onChange={(e) => setTaskType(e.target.value)}>
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Rejection reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            sx={{ minWidth: 220 }}
          />

          <Button variant="contained" onClick={bulkApprove} disabled={selectedIds.length === 0}>
            Bulk Approve
          </Button>
          <Button variant="outlined" color="error" onClick={bulkReject} disabled={selectedIds.length === 0}>
            Bulk Reject
          </Button>
        </Stack>
      </Paper>

      <TableContainer
        component={Paper}
        elevation={2}
        sx={{
          maxHeight: { xs: 400, sm: 520 },
          borderRadius: 1,
          overflowX: 'auto',
          maxWidth: '100%',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Table size="small" stickyHeader aria-label="Task approvals">
          <TableHead>
            <TableRow>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Select</TableCell>
              <TableCell>Task</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>User</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Department</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Proof</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [0, 1, 2, 3, 4].map((i) => (
                <TableRow key={i}>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Skeleton variant="text" width={24} height={22} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" height={22} sx={{ borderRadius: 0.5 }} />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Skeleton variant="text" height={22} sx={{ borderRadius: 0.5 }} />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Skeleton variant="text" height={22} sx={{ borderRadius: 0.5 }} />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Skeleton variant="text" height={22} sx={{ borderRadius: 0.5 }} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" height={22} sx={{ borderRadius: 0.5 }} />
                  </TableCell>
                  <TableCell align="right">
                    <Skeleton variant="rounded" width={140} height={32} sx={{ borderRadius: 1, ml: 'auto' }} />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, borderBottom: 'none' }}>
                  <Stack alignItems="center" spacing={1.5}>
                    <InboxOutlined sx={{ fontSize: 48, color: 'text.disabled' }} aria-hidden />
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                      No tasks found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Adjust filters or check back when submissions arrive.
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={(theme) => ({
                    '&:nth-of-type(even)': {
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.08)' : theme.palette.grey[50],
                    },
                  })}
                >
                  <TableCell sx={{ py: 1.5, display: { xs: 'none', sm: 'table-cell' } }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => toggleSelection(row.id)}
                      aria-label={`Select task ${row.task_templates?.task_name || row.id}`}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>{row.task_templates?.task_name || '-'}</TableCell>
                  <TableCell sx={{ py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>
                    {row.assigned_to_email || '-'}
                  </TableCell>
                  <TableCell sx={{ py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>
                    {row.task_templates?.department || '-'}
                  </TableCell>
                  <TableCell sx={{ py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>
                    {row.submission_link ? (
                      <a href={row.submission_link} target="_blank" rel="noreferrer">
                        View proof
                      </a>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <Chip size="small" label={row.status} color={STATUS_COLOR[row.status] || 'default'} />
                  </TableCell>
                  <TableCell align="right" sx={{ py: 1.25 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                      className="admin-row-actions"
                      sx={{
                        opacity: { xs: 1, sm: 0 },
                        transition: 'opacity 0.18s ease',
                        '.MuiTableRow-root:hover &': { opacity: 1 },
                      }}
                    >
                      <Button size="small" variant="outlined" onClick={() => taskComplianceService.approveTask(row.id)}>
                        Approve
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => taskComplianceService.rejectTask(row.id, rejectionReason)}
                      >
                        Reject
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
