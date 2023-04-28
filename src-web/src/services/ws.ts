import { getToken } from "./login";
// import {WebSocket} from "ws";

export var WS: WebSocket | null;

export const connect = () => {
  WS = new WebSocket(`ws://10.10.10.56:21234/ws?token=${getToken()}`);
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