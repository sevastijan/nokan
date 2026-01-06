import { useEffect } from 'react';

export const useChatTitle = (unreadCount: number) => {
     useEffect(() => {
          const originalTitle = 'NOKAN | Workflow';
          if (unreadCount > 0 && document.visibilityState === 'hidden') {
               document.title = `(${unreadCount}) Nowa wiadomość!`;
          } else {
               document.title = originalTitle;
          }
     }, [unreadCount]);
};
