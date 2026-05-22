import { Question } from '@/types';

interface Props {
  difficulty: Question['difficulty'];
}

export default function DifficultyBadge({ difficulty }: Props) {
  const map: Record<string, { label: string; cls: string; dotColor: string }> = {
    easy:   { label: 'Easy',     cls: 'badge-easy',   dotColor: '#16A34A' },
    medium: { label: 'Moderate', cls: 'badge-medium', dotColor: '#D97706' },
    hard:   { label: 'Hard',     cls: 'badge-hard',   dotColor: '#DC2626' },
  };
  const c = map[difficulty] || map.easy;
  return (
    <span className={c.cls}>
      <span className="badge-dot" style={{ background: c.dotColor }} />
      {c.label}
    </span>
  );
}
