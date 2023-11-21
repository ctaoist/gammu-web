import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useSWR, { SWRConfig, useSWRConfig } from "swr";

import { Footer } from "../components/footer";
import { WS } from "../services/ws";
import { getToken, setLogStatus, checkLogStatus } from "../services/login";
import { clearLog as apiClearLog } from "../services/sms";

import { setLanguage, getLanguage } from "../services/i18n";

export const SettingPage = () => {
  checkLogStatus();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate } = useSWRConfig();

  const [lang, setLang] = useState(getLanguage());
  const [clearFlag, setClearFlag] = useState(false); // clear log button disabled status

  const changeLanguage = (lang: string) => {
    setLang(lang);
    setLanguage(lang);
    mutate("updateLanguage");
  };

  const viewLog = () => {
    window.open(`/log?token=${getToken()}`);
  };

  const clearLog = () => {
    setClearFlag(true);
    apiClearLog().then(() => setClearFlag(false));
  };

  const logout = () => {
    setLogStatus(false);
    WS?.close();
    navigate("/");
  };

  return (
    <div className="container mx-auto">
      <div className="box">
        <ul className="list-none mt-2">
          <li className="flex justify-between">
            {t("Language")}
            <select className="select select-bordered" onChange={(e) => changeLanguage(e.target.value as string)}>
              <option value="en">English</option>
              <option value="zh">中文</option>
            </select>
          </li>
          <div className="divider"></div>
          <li className="flex justify-end">
            <button className="btn btn-outline" onClick={viewLog}>{t("View Log")}</button>
            <button className="btn btn-outline ml-4" onClick={clearLog}>{t("Clear Log")}</button>
          </li>
          <div className="divider"></div>
          <li className="flex justify-end">
            <button className="btn btn-outline" onClick={logout}>{t("Logout")}</button>
          </li>
        </ul>
      </div>
      <Footer />
    </div>
  );
};

export default SettingPage;
