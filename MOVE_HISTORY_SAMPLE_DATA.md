# Move History Sample Data for Google Sheet

## Column Name
`moveHistory`

## Data Format
The `moveHistory` column should contain JSON data (as a string) with move history information including quantity, date, remaining quantity, and details.

## Sample Data Examples

### Example 1: Single Entry (Object)
```json
{"date":"2025-01-15","quantity":1000,"remaining":5,"details":"Moved 1000 pcs to FG Section, 5 pcs remaining in Molding"}
```

### Example 2: Multiple Entries (Array)
```json
[{"date":"2025-01-15","quantity":1000,"remaining":5,"details":"First move: 1000 pcs to FG"},{"date":"2025-01-16","quantity":500,"remaining":3,"details":"Second move: 500 pcs to FG"}]
```

### Example 3: Simple Entry (Minimal Data)
```json
{"date":"2025-01-15","quantity":1000,"remaining":5}
```

### Example 4: Entry with Different Field Names
```json
{"Date":"15/01/2025","Quantity":1000,"Remaining":5,"Details":"Batch split completed"}
```

### Example 5: Multiple Moves with Full Details
```json
[{"date":"2025-01-15","quantity":1000,"remaining":5,"details":"Initial split: 1000 pcs moved to FG Section from Batch #9"},{"date":"2025-01-20","quantity":200,"remaining":3,"details":"Additional move: 200 pcs moved to FG Section"},{"date":"2025-01-25","quantity":100,"remaining":2,"details":"Final move: 100 pcs moved to FG Section"}]
```

## Field Descriptions

- **date** (or **Date**): The date when the move occurred. Format can be: "2025-01-15", "15/01/2025", "Jan 15, 2025", etc.
- **quantity** (or **Quantity** or **qty**): The quantity moved to FG Section (in pcs)
- **remaining** (or **Remaining**): The remaining quantity left in Molding (in pcs)
- **details** (or **Details**): Additional details about the move (optional)

## How to Add to Google Sheet

1. Open your Google Sheet (Dispatches sheet)
2. Find the row for the batch you want to add move history to
3. In the `moveHistory` column, paste one of the JSON examples above
4. Make sure the JSON is valid (proper quotes, brackets, etc.)

## Example Row in Google Sheet

| DispatchUniqueId | BatchNumber | BatchSize | moveHistory |
|------------------|-------------|-----------|-------------|
| DISP-12345678-042 | 9 | 1005 | `{"date":"2025-01-15","quantity":1000,"remaining":5,"details":"Moved 1000 pcs to FG Section"}` |

## Notes

- The data can be a single object `{...}` or an array of objects `[{...}, {...}]`
- All field names are case-insensitive (date/Date, quantity/Quantity, etc.)
- The `details` field is optional
- The `remaining` field is optional but recommended for tracking
- Date format is flexible - the UI will display it as provided

