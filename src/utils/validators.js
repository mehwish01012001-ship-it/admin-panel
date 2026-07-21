export const validateEmail = (value) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(value);
};

export const validateRequired = (value) => value?.toString().trim().length > 0;

export const validateMinLength = (value, length) => value?.toString().trim().length >= length;
