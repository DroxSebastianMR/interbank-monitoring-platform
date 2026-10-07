export const isValidEmail = (email: string): boolean => {
  const normalized = email.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(normalized);
};

export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};
