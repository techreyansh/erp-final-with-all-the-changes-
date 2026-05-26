// Import the actual functions from the utils
const path = require('path');

// Simulate the actual backward planning calculation
const GAZETTED_HOLIDAYS = [
  '2025-01-26', '2025-02-27', '2025-03-31', '2025-04-06',
  '2025-04-14', '2025-04-18', '2025-05-01', '2025-06-07',
  '2025-08-15', '2025-10-02', '2025-10-21', '2025-11-05',
  '2025-12-25'
];

const isSunday = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getDay() === 0;
};

const formatDateForComparison = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isGazettedHoliday = (date) => {
  const dateStr = typeof date === 'string' ? date : formatDateForComparison(date);
  const isHoliday = GAZETTED_HOLIDAYS.includes(dateStr);
  console.log(`  Checking ${dateStr}: ${isHoliday ? 'HOLIDAY ❌' : 'Not holiday'}`);
  return isHoliday;
};

const isRestrictedDate = (date) => {
  const sun = isSunday(date);
  const hol = isGazettedHoliday(date);
  return sun || hol;
};

const subtractWorkingDays = (fromDate, workingDays) => {
  const date = new Date(fromDate);
  date.setHours(0, 0, 0, 0);
  
  console.log(`\nSubtracting ${workingDays} working days from ${formatDateForComparison(date)}:`);
  
  let daysSubtracted = 0;
  
  while (daysSubtracted < workingDays) {
    date.setDate(date.getDate() - 1);
    const dateStr = formatDateForComparison(date);
    const isRestricted = isRestrictedDate(date);
    
    if (!isRestricted) {
      daysSubtracted++;
      console.log(`  ${dateStr} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()]}) - Working day #${daysSubtracted} ✓`);
    } else {
      const reason = isSunday(date) ? 'Sunday' : 'Holiday';
      console.log(`  ${dateStr} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()]}) - ${reason}, SKIP ❌`);
    }
  }
  
  return date;
};

const calculateStageDueDates = (dispatchDate, orderType = 'POWER_CORD', useWorkingDays = true) => {
  const D = new Date(dispatchDate);
  D.setHours(23, 59, 59, 999);
  
  console.log('\n=== CALCULATING STAGE DUE DATES ===');
  console.log(`Dispatch Date: ${formatDateForComparison(D)}`);
  console.log(`Order Type: ${orderType}`);
  console.log(`Use Working Days: ${useWorkingDays}`);
  
  const subtractDays = (date, days) => {
    if (useWorkingDays) {
      const workingDate = subtractWorkingDays(date, days);
      workingDate.setHours(23, 59, 59, 999);
      return workingDate.toISOString();
    } else {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() - days);
      newDate.setHours(23, 59, 59, 999);
      return newDate.toISOString();
    }
  };
  
  const fgSectionDueDate = subtractDays(D, 1);
  const mouldingDueDate = subtractDays(D, 2);
  const store2DueDate = subtractDays(D, 3);
  const cableProductionDueDate = subtractDays(D, 4);
  const store1DueDate = subtractDays(D, 5);
  
  return {
    DispatchDate: D.toISOString(),
    FGSectionDueDate: fgSectionDueDate,
    MouldingDueDate: mouldingDueDate,
    Store2DueDate: store2DueDate,
    CableProductionDueDate: cableProductionDueDate,
    Store1DueDate: store1DueDate,
    useWorkingDays: useWorkingDays
  };
};

// Test with Oct 7, 2025
console.log('\n' + '='.repeat(60));
console.log('TESTING: Dispatch Date = October 7, 2025');
console.log('='.repeat(60));

const result = calculateStageDueDates('2025-10-07', 'POWER_CORD', true);

console.log('\n=== FINAL RESULTS ===\n');
Object.keys(result).forEach(key => {
  if (key !== 'useWorkingDays') {
    const date = new Date(result[key]);
    console.log(`${key.padEnd(25)}: ${formatDateForComparison(date)} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()]})`);
  }
});

console.log('\n✅ Store 1 Due Date should be: 2025-09-30 (Tue)');
console.log(`${result.Store1DueDate.includes('2025-09-30') ? '✓ CORRECT' : '❌ WRONG - Got: ' + result.Store1DueDate}`);
