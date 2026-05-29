type FieldErrorProps = {
  error?: { message?: string }
}

export function FieldErrorMessage({ error }: FieldErrorProps) {
  if (!error?.message) {
    return null
  }

  return (
    <p className="text-sm text-destructive" role="alert">
      {error.message}
    </p>
  )
}
