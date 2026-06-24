interface Chip {
  id:    string;
  label: string;
}

interface Props {
  chips:    Chip[];
  selected: string;
  onChange: (id: string) => void;
}

export default function FilterChips({ chips, selected, onChange }: Props) {
  return (
    <div className="filter-chips" role="group">
      {chips.map((chip) => (
        <button
          key={chip.id}
          className={`filter-chip${chip.id === selected ? ' filter-chip--active' : ''}`}
          onClick={() => onChange(chip.id)}
          aria-pressed={chip.id === selected}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
