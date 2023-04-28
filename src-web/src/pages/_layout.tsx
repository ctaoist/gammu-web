import React, { useEffect, useState } from "react";
import i18next from "i18next";
import { useTranslation } from "react-i18next";
import useSWR, { SWRConfig, useSWRConfig } from "swr";
import { Route, Routes } from "react-router-dom";

import { AppBar, Toolbar, BottomNavigation, BottomNavigationAction, Paper, List } from "@mui/material";

import { routers, getRouterLinkByLabel, getRouterLabelByLink } from "./_routers";
import { getLanguage } from '../services/i18n';
import { WS } from '../services/ws';

const Layout = () => {
  const { t } = useTranslation();
  const { data: language } = useSWR("updateLanguage", getLanguage);

  useEffect(() => {
    if (language) {
      i18next.changeLanguage(language);
    }
  }, [language]);

  return (<SWRConfig value={{}}>
    <Routes>
      {routers.map(({ label, link, ele: Ele }) => (
        <Route key={label} path={link} element={<Ele />} />
      ))}
    </Routes>
  </SWRConfig >)
}

export default Layout;