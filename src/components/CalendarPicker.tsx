import DateTimePicker, { useDefaultStyles } from 'react-native-ui-datepicker'
import { useUniwind } from 'uniwind'

export function CalendarPicker({
  value,
  onChange,
  maximumDate,
}: {
  value: Date
  onChange: (date: Date) => void
  maximumDate?: Date
}) {
  const theme = useUniwind().theme
  const defaultStyles = useDefaultStyles(theme)

  return (
    <DateTimePicker
      mode="single"
      date={value}
      maxDate={maximumDate}
      onChange={({ date }) => {
        if (date) {
          onChange(new Date(date as string | number | Date))
        }
      }}
      styles={{
        ...defaultStyles,
        today: {
          ...defaultStyles.today,
          borderWidth: 1,
          borderColor: '#1A1D26',
        },
      }}
    />
  )
}
