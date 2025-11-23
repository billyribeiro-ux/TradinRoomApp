interface AvatarLike {
  avatar_url?: string | null;
  display_name?: string | null;
  email?: string | null;
}

export function getBestAvatarUrl(user: AvatarLike): string {
  return user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || user?.email || 'User')}&background=random`;
}

export function getUserInitials(user: AvatarLike): string {
  const name = user?.display_name || user?.email || 'User';
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
}
