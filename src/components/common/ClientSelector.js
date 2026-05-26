import React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

const ClientSelector = ({ options, value, onChange, loading, disabled }) => (
  <Autocomplete
    options={options}
    value={value || null}
    onChange={(_, newValue) => onChange(newValue)}
    loading={loading}
    disabled={disabled}
    renderInput={(params) => (
      <TextField
        {...params}
        label="Select Client Code"
        variant="outlined"
        fullWidth
        InputProps={{
          ...params.InputProps,
          endAdornment: (
            <>
              {loading ? (
                <span style={{ marginRight: 8 }}>Loading...</span>
              ) : null}
              {params.InputProps.endAdornment}
            </>
          ),
        }}
      />
    )}
    isOptionEqualToValue={(option, val) => option === val}
  />
);

export default ClientSelector;
