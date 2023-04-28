import { Global } from './global';
import { WS, connect as ws_connect } from './ws';

export const setToken = (token: string) => {
  localStorage.setItem("token", token);
};

export const getToken = (): string => {
  return Global.token || localStorage.getItem("token") || "";
};

export const setLogStatus = (status: boolean) => {
  localStorage.setItem("logStatus", String(status));
}

export const getLogStatus = (): boolean => {
  return (localStorage.getItem("logStatus") || "false") === "true"
}

export const checkLogStatus = () => {
  let status = getLogStatus();
  if (!status && window.location.pathname !== "/") {
    window.location.href = "/";
    return
  }
  if (window.location.pathname === "/" && status) {
    if (WS == null) { ws_connect(); }
    window.location.href = "/sms";
  }
  status && WS == null && ws_connect();
}

export const verifyToken = () => {
  return fetch(`/api/verify_token?token=${getToken()}`)
    .then(resp => resp.json())
    .catch(error => console.error(error));
}