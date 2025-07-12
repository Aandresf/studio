"use client";

import * as React from "react";
import { CheckCircle2, XCircle, ClipboardCopyIcon } from "lucide-react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

// --- Types ---
type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  duration?: number; // in milliseconds
  icon?: React.ReactNode;
};

type Toast = Omit<ToasterToast, "id">;

// --- State Management ---
const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 1000000;

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

interface State {
  toasts: ToasterToast[];
}

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case "DISMISS_TOAST":
      const { toastId } = action;
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? { ...t, open: false }
            : t
        ),
      };
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state;
  }
};

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) return;
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: "REMOVE_TOAST", toastId: toastId });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, timeout);
};

// --- Hook and Public Functions ---
let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

function toast(props: Toast) {
  const id = genId();
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  if (props.duration) {
    const timeout = setTimeout(() => {
      dismiss();
    }, props.duration);
    toastTimeouts.set(id, timeout);
  }

  return { id, dismiss };
}

// --- Helper Components and Functions ---
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1 ml-4 text-current rounded-md hover:bg-white/20 focus:outline-none">
      <ClipboardCopyIcon className={cn("h-5 w-5", copied && "text-green-400")} />
    </button>
  );
};

const ErrorDescription = ({ text }: { text: string }) => (
  <div className="flex items-center justify-between w-full">
    <p className="text-sm font-medium break-all">{text}</p>
    <CopyButton text={text} />
  </div>
);

function toastSuccess(title: string, description: string) {
  toast({
    title: title,
    description: description,
    duration: 5000,
    variant: "success",
    icon: <CheckCircle2 className="h-6 w-6" />,
  });
}

function toastError(title: string, description: string) {
  toast({
    title: title,
    description: <ErrorDescription text={description} />,
    duration: 5000,
    variant: "destructive",
    icon: <XCircle className="h-6 w-6" />,
  });
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast, toastSuccess, toastError };
