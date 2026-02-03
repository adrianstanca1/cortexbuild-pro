"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Plus, X, FolderKanban, ListTodo, FileQuestion, FileText,
  ClipboardList, Shield, Users, Calendar, FileCheck, Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  onClick?: () => void;
  color: string;
}

const defaultActions: QuickAction[] = [
  { id: "project", label: "New Project", icon: FolderKanban, href: "/projects/new", color: "bg-blue-500" },
  { id: "task", label: "New Task", icon: ListTodo, href: "/tasks?new=true", color: "bg-green-500" },
  { id: "rfi", label: "New RFI", icon: FileQuestion, href: "/rfis?new=true", color: "bg-orange-500" },
  { id: "report", label: "Daily Report", icon: ClipboardList, href: "/daily-reports?new=true", color: "bg-purple-500" },
  { id: "safety", label: "Safety Log", icon: Shield, href: "/safety?new=true", color: "bg-red-500" },
  { id: "meeting", label: "New Meeting", icon: Calendar, href: "/meetings?new=true", color: "bg-cyan-500" }
];

interface FloatingActionButtonProps {
  actions?: QuickAction[];
  position?: "bottom-right" | "bottom-left" | "bottom-center";
}

export function FloatingActionButton({
  actions = defaultActions,
  position = "bottom-right"
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  // Show FAB after scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 100);
    };
    
    // Show immediately if page is already scrolled
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Always show on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsVisible(true);
    }
  }, []);

  const positionClasses = {
    "bottom-right": "right-6 bottom-6",
    "bottom-left": "left-6 bottom-6",
    "bottom-center": "left-1/2 -translate-x-1/2 bottom-6"
  };

  const handleActionClick = (action: QuickAction) => {
    setIsOpen(false);
    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      router.push(action.href);
    }
  };

  return (
    <AnimatePresence>
      {(isVisible || isOpen) && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className={cn("fixed z-50", positionClasses[position])}
        >
          {/* Action items */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-16 right-0 mb-2 space-y-2"
              >
                {actions.map((action, index) => (
                  <motion.button
                    key={action.id}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleActionClick(action)}
                    className="flex items-center gap-3 bg-background shadow-lg rounded-full pl-4 pr-2 py-2 hover:shadow-xl transition-shadow border border-border group whitespace-nowrap"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {action.label}
                    </span>
                    <div className={cn("p-2 rounded-full text-white", action.color)}>
                      <action.icon className="h-4 w-4" />
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main FAB button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-colors",
              isOpen
                ? "bg-muted text-foreground"
                : "bg-primary text-white hover:bg-primary/90"
            )}
          >
            <motion.div
              animate={{ rotate: isOpen ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
            </motion.div>
          </motion.button>

          {/* Backdrop */}
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 -z-10"
              onClick={() => setIsOpen(false)}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
