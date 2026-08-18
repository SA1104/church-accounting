export const validatePassword = (password) => {
  if (!password) return '비밀번호를 입력해주세요.';
  if (password.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다.';
  // Add other common password validation rules here if needed
  return null;
};
