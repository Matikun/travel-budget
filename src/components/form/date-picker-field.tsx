import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import { FieldErrorMessage } from './field-error'

type DatePickerFieldProps = {
  id: string
  label: string
  value?: Date
  onChange: (date: Date | undefined) => void
  error?: { message?: string }
  placeholder?: string
  disabled?: boolean
}

export function DatePickerField({
  id,
  label,
  value,
  onChange,
  error,
  placeholder = 'Seleccionar fecha',
  disabled,
}: DatePickerFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground',
              error && 'border-destructive',
            )}
            aria-invalid={Boolean(error)}
          >
            <CalendarIcon className="mr-2 size-4" />
            {value
              ? format(value, 'PPP', { locale: es })
              : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            defaultMonth={value}
          />
        </PopoverContent>
      </Popover>
      <FieldErrorMessage error={error} />
    </div>
  )
}
