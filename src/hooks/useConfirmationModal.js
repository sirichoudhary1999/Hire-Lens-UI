import { useRef, useState } from 'react';

export const useConfirmationModal = () => {
  const resolverRef = useRef(null);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: 'Notice',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false
  });

  const closeWith = (result) => {
    const currentResolver = resolverRef.current;
    resolverRef.current = null;
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (currentResolver) {
      currentResolver(result);
    }
  };

  const showAlert = (message, title = 'Notice') => {
    setModalState({
      isOpen: true,
      title,
      message,
      confirmText: 'OK',
      cancelText: 'Cancel',
      showCancel: false
    });

    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  };

  const showConfirm = (
    message,
    {
      title = 'Please Confirm',
      confirmText = 'Confirm',
      cancelText = 'Cancel'
    } = {}
  ) => {
    setModalState({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      showCancel: true
    });

    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  };

  return {
    modalState,
    showAlert,
    showConfirm,
    onConfirm: () => closeWith(true),
    onCancel: () => closeWith(false)
  };
};
