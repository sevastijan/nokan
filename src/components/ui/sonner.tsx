"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-slate-800 group-[.toaster]:text-slate-100 group-[.toaster]:border-slate-700/50 group-[.toaster]:shadow-2xl group-[.toaster]:shadow-black/40 group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-slate-400",
          actionButton:
            "group-[.toast]:bg-purple-600 group-[.toast]:text-white group-[.toast]:rounded-lg group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-slate-700 group-[.toast]:text-slate-300 group-[.toast]:rounded-lg",
          success:
            "group-[.toaster]:border-emerald-500/30 group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-slate-800 group-[.toaster]:to-emerald-950/30",
          error:
            "group-[.toaster]:border-red-500/30 group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-slate-800 group-[.toaster]:to-red-950/30",
          warning:
            "group-[.toaster]:border-amber-500/30 group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-slate-800 group-[.toaster]:to-amber-950/30",
          info:
            "group-[.toaster]:border-purple-500/30 group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-slate-800 group-[.toaster]:to-purple-950/30",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
