import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const Modal = ({ isOpen, onClose, title, icon: Icon, children }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose && onClose()}>
      <DialogContent className="w-full h-[100dvh] max-w-none sm:max-w-[500px] sm:w-[95vw] sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-xl overflow-y-auto overflow-x-hidden p-4 sm:p-6 mt-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary-dark text-xl mb-4">
            {Icon && <Icon size={24} />}
            {title && <span>{title}</span>}
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
