export const INCOME_CATEGORIES = ['Salary','Freelance','Investment','Business','Gift','Other Income'];
export const EXPENSE_CATEGORIES = ['Food & Dining','Shopping','Transport','Housing','Healthcare','Entertainment','Education','Travel','Utilities','Insurance','Savings','Other Expense'];
export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export const CATEGORY_COLORS = {
  'Salary': '#6c63ff', 'Freelance': '#38beff', 'Investment': '#22c97a',
  'Business': '#a78bfa', 'Gift': '#f472b6', 'Other Income': '#94a3b8',
  'Food & Dining': '#ff5569', 'Shopping': '#ffb347', 'Transport': '#38beff',
  'Housing': '#6c63ff', 'Healthcare': '#22c97a', 'Entertainment': '#f472b6',
  'Education': '#a78bfa', 'Travel': '#fb923c', 'Utilities': '#94a3b8',
  'Insurance': '#64748b', 'Savings': '#22c97a', 'Other Expense': '#475569',
};

export const formatCurrency = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount || 0);
  } catch { return `$${(amount || 0).toFixed(2)}`; }
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatShortDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const getMonthLabel = (monthStr) => {
  if (!monthStr) return '';
  const [y, m] = monthStr.split('-');
  return new Date(y, m - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export const getMonthOptions = (count = 12) => {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    opts.push({ value: val, label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) });
  }
  return opts;
};

export const getMonthRange = (monthStr) => {
  const [y, m] = monthStr.split('-');
  const start = new Date(y, m - 1, 1).toISOString();
  const end = new Date(y, m, 0, 23, 59, 59).toISOString();
  return { start, end };
};

export const percentChange = (current, previous) => {
  if (!previous) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
};

export const truncate = (str, n = 30) => str?.length > n ? str.slice(0, n) + '…' : str;
