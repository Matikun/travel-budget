type SectionEmptyStateProps = {
  message: string
}

export function SectionEmptyState({ message }: SectionEmptyStateProps) {
  return (
    <p
      className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-foreground/75"
      role="status"
    >
      {message}
    </p>
  )
}
