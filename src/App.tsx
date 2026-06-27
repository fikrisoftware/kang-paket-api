import { TooltipProvider } from './components/ui/tooltip'
import { AppShell } from './components/layout/AppShell'

export default function App(): JSX.Element {
  return (
    <TooltipProvider delayDuration={400}>
      <AppShell />
    </TooltipProvider>
  )
}
