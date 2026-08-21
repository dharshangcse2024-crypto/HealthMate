import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  label,
  id,
  icon: Icon,
  error,
  containerStyle,
  ...props
}) {
  const inputId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full mb-4" style={containerStyle}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <Icon size={18} />
          </div>
        )}
        <InputPrimitive
          type={type}
          id={inputId}
          data-slot="input"
          className={cn(
            "h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50",
            Icon && "pl-10",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          {...props} 
        />
      </div>
      {error && <div className="text-destructive text-xs mt-1">{error}</div>}
    </div>
  );
}

export { Input }
export default Input;
