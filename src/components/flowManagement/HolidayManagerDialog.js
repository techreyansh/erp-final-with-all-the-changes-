import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Chip, Stack, alpha } from '@mui/material';
import { EventBusy, CheckCircle, CalendarMonth } from '@mui/icons-material';
import { DateCalendar, PickersDay } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { loadOverrides, getOverrideForDate, setOverride } from '../../services/companyCalendarService';
import { isSunday, isGazettedHoliday } from '../../utils/dateRestrictions';

const toKey = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const HolidayManagerDialog = ({ open, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [version, setVersion] = useState(0); // trigger re-render after save

  useEffect(() => { if (open) loadOverrides(true); }, [open]);

  // Custom day component for MUI v6 slots API
  const CustomDay = (props) => {
    const { day, onClick, sx, selected: _selected, ...other } = props;
    const date = day; // Date object (AdapterDateFns)
    const key = toKey(date);
    const override = getOverrideForDate(key);
    const baseSunday = isSunday(date);
    const baseHoliday = isGazettedHoliday(key);

    let bg = undefined;
    // Display colors per requested simple UX:
    // - Click on working day => set holiday (company exclude) = BLUE
    // - Click on base holiday => set normal (company include) = CLEAR (no highlight)
    // - Click again on that same day => set holiday override = PINK
    if (override === 'exclude' && (baseSunday || baseHoliday)) bg = 'rgba(255, 128, 171, 0.35)'; // pink on base holiday
    else if (override === 'exclude') bg = 'rgba(33, 150, 243, 0.25)'; // blue on normal day
    else if (override === 'include') bg = undefined; // treat as normal, no highlight
    else if (baseSunday || baseHoliday) bg = 'rgba(255, 193, 7, 0.25)'; // base holiday

    // Subtle border for today
    const isToday = (() => {
      const now = new Date();
      return now.getFullYear() === date.getFullYear() && now.getMonth() === date.getMonth() && now.getDate() === date.getDate();
    })();

    return (
      <PickersDay
        {...other}
        day={day}
        selected={false} // disable default dark-blue selection
        onClick={(e) => { onClick?.(e); cycleOverride(date); }}
        sx={{
          backgroundColor: bg,
          borderRadius: 2,
          border: isToday ? '1px dashed rgba(25,118,210,0.4)' : '1px solid transparent',
          '&:hover': { filter: 'brightness(0.96)' },
          ...sx
        }}
      />
    );
  };

  const cycleOverride = async (date) => {
    const key = toKey(date);
    const current = getOverrideForDate(key);
    const base = isSunday(date) || isGazettedHoliday(key);
    let next;
    if (!base) {
      // Working day: toggle exclude <-> clear
      next = current === 'exclude' ? null : 'exclude';
    } else {
      // Base holiday: toggle include <-> exclude
      next = current === 'include' ? 'exclude' : 'include';
    }
    await setOverride(key, next);
    setVersion((v) => v + 1);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CalendarMonth color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Company Holiday Manager</Typography>
        <Typography variant="body2" sx={{ ml: 'auto', color: 'text.secondary' }}>Click a date to toggle</Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 1.5 }}>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'start' }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateCalendar
              value={currentDate}
              onChange={(d) => {
                const val = d?.toDate?.() || d;
                setCurrentDate(val);
              }}
              slots={{ day: CustomDay }}
              onSelectedSectionsChange={() => {}}
              onMonthChange={() => setVersion((v) => v + 1)}
              onYearChange={() => setVersion((v) => v + 1)}
              sx={{
                '& .MuiPickersCalendarHeader-root': {
                  px: 1.5, py: 0.5
                },
                '& .MuiDayCalendar-weekContainer': { mx: 0.5 },
                '& .MuiDayCalendar-weekDayLabel': { fontWeight: 600, color: 'text.secondary' },
              }}
            />
          </LocalizationProvider>
          <Box sx={{ minWidth: 320 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Legend</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip icon={<EventBusy />} label="Holiday (company)" sx={{ backgroundColor: alpha('#2196f3', 0.15) }} />
              <Chip icon={<EventBusy />} label="Holiday on base holiday" sx={{ backgroundColor: alpha('#ff80ab', 0.25) }} />
              <Chip icon={<CheckCircle />} label="Base Holiday/Sunday" sx={{ backgroundColor: alpha('#ffc107', 0.25) }} />
            </Stack>
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              Working day: click to mark holiday (blue), click again to clear. Base holiday/Sunday: first click makes it normal, second click forces holiday (pink). Overrides persist in CompanyCalendar.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
};

export default HolidayManagerDialog;

