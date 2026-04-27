import { useToast } from "../state/ToastContext";

export function Toast() {
  const { toast } = useToast();

  return (
    <div className={`toast ${toast.type} ${toast.visible ? "show" : ""}`}>
      {toast.message}
    </div>
  );
}
