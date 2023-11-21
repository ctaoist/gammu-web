import { getToken } from "./login";
// import {WebSocket} from "ws";

export var WS: WebSocket | null;

export const connect = () => {
  let protocol = window.location.protocol === "https:" ? "wss" : "ws";
  WS = new WebSocket(`${protocol}://${window.location.host}/ws?token=${getToken()}`);
  WS.onopen = () => {
    console.log("websocket connected");
  };
  WS.onclose = () => {
    console.log("websocket closed");
    WS = null;
  };
};

// WS.onclose = () => {
//   WS = new WebSocket("");
// };