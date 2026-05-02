import api from './api';

export const chatService = {
  sendMessage: (message, vitals = {}) => {
    return api.post('/v1/frontend-chat/send', {
      message,
      weight: vitals.weight || null,
      height: vitals.height || null,
      age: vitals.age || null
    });
  },
  
  clearSession: () => {
    return api.delete('/v1/frontend-chat/session');
  }
};
