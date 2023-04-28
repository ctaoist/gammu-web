import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";
import zh from "../locales/zh_cn.json";

const resources = {
  en: { translation: en },
  zh: { translation: zh },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  interpolation: {
    escapeValue: false,
  },
});

// 往 localStorage 里写
export const setLanguage = (lang: string) => {
  localStorage.setItem("language", lang);
};

export const getLanguage = () => {
  return localStorage.getItem("language") || "en";
};