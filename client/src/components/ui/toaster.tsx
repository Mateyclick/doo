
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastActionElement,
  type ToastProps,
} from "@/components/ui/toast"

export function Toaster() {
  const { toast } = useToast()

  return (
    <ToastProvider>
      {toast._toasts?.map(function ({ id, title, description, action, ...props }: {
        id: string;
        title?: React.ReactNode;
        description?: React.ReactNode;
        action?: ToastActionElement;
        [key: string]: any;
      }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
