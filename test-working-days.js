// Test the working days calculation
const GAZETTED_HOLIDAYS = [
  '2025-01-26', // Republic Day
  '2025-02-27', // Holi
  '2025-03-31', // Eid al-Fitr
  '2025-04-06', // Ram Navami
  '2025-04-14', // Ambedkar Jayanti
  '2025-04-18', // Good Friday
  '2025-05-01', // Labour Day
  '2025-06-07', // Eid al-Adha
  '2025-08-15', // Independence Day
  '2025-10-02', // Gandhi Jayanti
  '2025-10-21', // Diwali
  '2025-11-05', // Guru Nanak Jayanti
  '2025-12-25', // Christmas Day
];

const isSunday = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getDay() === 0; // 0 = Sunday
};

const formatDateForComparison = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isGazettedHoliday = (date) => {
  const dateStr = typeof date === 'string' ? date : formatDateForComparison(date);
  return GAZETTED_HOLIDAYS.includes(dateStr);
};

const isRestrictedDate = (date) => {
  return isSunday(date) || isGazettedHoliday(date);
};

const subtractWorkingDays = (fromDate, workingDays) => {
  const date = new Date(fromDate);
  date.setHours(0, 0, 0, 0);
  
  let daysSubtracted = 0;
  
  while (daysSubtracted < workingDays) {
    date.setDate(date.getDate() - 1);
    if (!isRestrictedDate(date)) {
      daysSubtracted++;
    }
  }
  
  return date;
};

const formatDate = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return `${date.toISOString().split('T')[0]} (${days[date.getDay()]})`;
};

// Test: Subtract 5 working days from Oct 7, 2025
console.log('\n=== TESTING BACKWARD PLANNING FROM OCT 7, 2025 ===\n');

const dispatchDate = new Date('2025-10-07');
console.log('Dispatch Date (D):', formatDate(dispatchDate));

console.log('\nCalculating backward (skipping Sundays and holidays):');
console.log('-------------------------------------------------------');

for (let i = 1; i <= 5; i++) {
  const dueDate = subtractWorkingDays(dispatchDate, i);
  const dateStr = formatDateForComparison(dueDate);
  const isHoliday = isGazettedHoliday(dueDate);
  const isSun = isSunday(dueDate);
  const status = isHoliday ? '❌ HOLIDAY' : isSun ? '❌ SUNDAY' : '✓';
  
  let stageName = '';
  if (i === 1) stageName = 'FG Section';
  else if (i === 2) stageName = 'Moulding';
  else if (i === 3) stageName = 'Store 2';
  else if (i === 4) stageName = 'Cable Production';
  else if (i === 5) stageName = 'Store 1';
  
  console.log(`D-${i} (${stageName.padEnd(20)}): ${formatDate(dueDate)} ${status}`);
}

console.log('\n=== MANUAL VERIFICATION ===\n');
console.log('Walking back day by day from Oct 7:');
let current = new Date('2025-10-07');
let workingDayCount = 0;

for (let i = 0; i < 10; i++) {
  const dateStr = formatDateForComparison(current);
  const isHoliday = isGazettedHoliday(current);
  const isSun = isSunday(current);
  const isWorking = !isRestrictedDate(current);
  
  let label = i === 0 ? 'D (Dispatch)' : '';
  if (isWorking && i > 0) {
    workingDayCount++;
    label = `D-${workingDayCount}`;
  }
  
  const status = isHoliday ? 'HOLIDAY - SKIP ❌' : isSun ? 'SUNDAY - SKIP ❌' : `Working Day ${label} ✓`;
  
  console.log(`${formatDate(current)}: ${status}`);
  
  current.setDate(current.getDate() - 1);
  if (workingDayCount === 5) break;
}
