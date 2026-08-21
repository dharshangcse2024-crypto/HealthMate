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
      <DialogContent className="max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary-dark text-xl mb-2">
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
