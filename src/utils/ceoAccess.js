export const requireCEORole = (role) => {
  if ((role || '').toUpperCase() !== 'CEO') {
    throw new Error('Access Denied – Insufficient Privileges');
  }

  return true;
};

export const isCEORole = (role) => {
  try {
    requireCEORole(role);
    return true;
  } catch {
    return false;
  }
};
