import { useState } from 'react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertState {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
}

export function useAdminAlert() {
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showAlert = (type: AlertType, title: string, message: string) => {
    setAlert({ visible: true, type, title, message });
  };

  const closeAlert = () => setAlert(previous => ({ ...previous, visible: false }));

  return { alert, showAlert, closeAlert };
}
