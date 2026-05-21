export function formatCurrency(value = 0) {
  return Number(value).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

export function formatNumber(value = 0) {
  return Number(value).toLocaleString('en-US');
}

export function getInitials(name = '') {
  return name
    ?.split(' ')
    ?.map((word) => word.charAt(0))
    ?.join('')
    ?.slice(0, 2)
    ?.toUpperCase();
}

export function getAvatar(name = '') {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=random`;
}

export function getAILevel(score = 0) {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Great';
  if (score >= 60) return 'Good';

  return 'Needs Attention';
}

export function getPipelineHealth(value = 0) {
  if (value >= 1000000) return 'Strong';
  if (value >= 500000) return 'Healthy';

  return 'Growing';
}