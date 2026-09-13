"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const AccordionContext = React.createContext<{
  openItem: string | null
  setOpenItem: (value: string | null) => void
}>({
  openItem: null,
  setOpenItem: () => {},
})

export const Accordion = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const [openItem, setOpenItem] = React.useState<string | null>(null)

  return (
    <AccordionContext.Provider value={{ openItem, setOpenItem }}>
      <div className={cn("space-y-1", className)}>{children}</div>
    </AccordionContext.Provider>
  )
}

const AccordionItemContext = React.createContext<{ value: string }>({ value: "" })

export const AccordionItem = ({
  children,
  value,
  className,
}: {
  children: React.ReactNode
  value: string
  className?: string
}) => {
  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div className={cn("border-b border-border", className)}>{children}</div>
    </AccordionItemContext.Provider>
  )
}

export const AccordionTrigger = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  const { openItem, setOpenItem } = React.useContext(AccordionContext)
  const { value } = React.useContext(AccordionItemContext)
  
  const isOpen = openItem === value

  return (
    <button
      type="button"
      className={cn(
        "flex w-full flex-1 items-center justify-between py-4 text-left font-medium transition-all hover:underline",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      onClick={() => setOpenItem(isOpen ? null : value)}
      aria-expanded={isOpen}
    >
      {children}
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200 text-muted-foreground",
          isOpen && "rotate-180"
        )}
      />
    </button>
  )
}

export const AccordionContent = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  const { openItem } = React.useContext(AccordionContext)
  const { value } = React.useContext(AccordionItemContext)
  
  const isOpen = openItem === value

  if (!isOpen) return null

  return (
    <div
      className={cn("pb-4 pt-0 text-muted-foreground", className)}
      role="region"
    >
      {children}
    </div>
  )
}
