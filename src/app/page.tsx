import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Home() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Input placeholder="Hello" />
      <Button disabled>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Primary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="teritary">Teritary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="muted">Muted</Button>
    </div>
  )
}
