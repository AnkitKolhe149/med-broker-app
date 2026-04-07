import * as LucideIcons from 'lucide-react';

export default function AppIcon({
  name,
  size = 18,
  strokeWidth = 1.5,
  ...props
}) {
  const Icon = LucideIcons[name];
  if (!Icon) return null;
  return <Icon size={size} strokeWidth={strokeWidth} {...props} />;
}
