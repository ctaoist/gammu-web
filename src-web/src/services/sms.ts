import { getToken } from '../services/login';

export interface SMSMessage {
  id: string
  self_number: string
  number: string
  text: string
  sent?: boolean
  time: string
}

export const getPhoneInfo = (): Promise<any> => {
  return fetch(`/api/get_phone_info?token=${getToken()}`)
    .then(resp => resp.json()) // 多出来一步
    .catch(error => {
      console.error(error);
    });
}

export const getSMSAbstract = (page: number): Promise<any> => {
  return fetch(`/api/get_abstract?token=${getToken()}&page=${page}`)
    .then(resp => resp.json())
    .catch(error => {
      console.error(error);
      window.location.href = "/";
    });
}

export const getSMSListByNumber = (page: number, number: string): Promise<any> => {
  return fetch(`/api/get_messages?token=${getToken()}&page=${page}&number=${encodeURIComponent(number)}`)
    .then(resp => resp.json())
    .catch(error => {
      console.error(error);
      window.location.href = "/";
    });
}

export const sendSMS = (number: string, text: string): Promise<any> => {
  return fetch(`/api/send_sms?token=${getToken()}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ number: number, text: text })
  })
    .then(resp => resp.json())
    .catch(error => {
      console.error(error);
    });
}

export const delSMS = (number: string): Promise<any> => {
  return fetch(`/api/delete_sms?token=${getToken()}&number=${number}`)
    .then(resp => resp.json())
    .catch(error => {
      console.error(error);
    });
}