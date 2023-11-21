import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Route, Routes, useNavigate } from "react-router-dom";

import { routers, getRouterLinkByLabel, getRouterLabelByLink } from "../pages/_routers";


export const Footer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState(getRouterLabelByLink(document.location.pathname));

  return (
    <div role="tablist" className="tabs tabs-bordered tabs-lg sticky z-30 bg-base-100 bottom-0 border-2">
      {routers.slice(0, 2).map(({ label, link, color }) => (
        <a key={label} className={`tab${tab === label ? " tab-active" : ""}`} onClick={() => {
          setTab(label);
          navigate(link);
        }}>{t(label)}</a>
      ))}
    </div>
  );
}

export default Footer