import { SettingPage } from './setting'
import { SMSPage } from './sms'
import { SMSChatPage } from './sms_chat'
import {LoginPage} from './login'

export const routers = [
  {
    label: "SMS",
    link: "/sms",
    ele: SMSPage,
  },
  {
    label: "Settings",
    link: "/setting",
    ele: SettingPage,
  },
  {
    label: "Login",
    link: "/",
    ele: LoginPage,
  },
  {
    label: "SMS Chat",
    link: "/sms_chat",
    ele: SMSChatPage,
  }
];

export const getRouterLinkByLabel = (label: string): string => {
  for (let r of routers) {
    if (r.label === label) {
      return r.link;
    }
  }
  return "/"
}

export const getRouterLabelByLink = (link: string): string => {
  for (let r of routers) {
    if (r.link === link) {
      return r.label;
    }
  }
  return "SMS"
}