import React, { useEffect, useState } from "react";
import i18next from "i18next";
import { useTranslation } from "react-i18next";
import useSWR, { SWRConfig, useSWRConfig } from "swr";
import { Route, Routes, useNavigate } from "react-router-dom";

import { routers, getRouterLinkByLabel, getRouterLabelByLink } from "../pages/_routers";

import { AppBar, Toolbar, BottomNavigation, BottomNavigationAction, Paper, List } from "@mui/material";

export const Footer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState(getRouterLabelByLink(document.location.pathname));

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
      <BottomNavigation
        showLabels
        value={tab}
        onChange={(event, newValue) => {
          setTab(newValue);
          navigate(getRouterLinkByLabel(newValue));
        }}
      >
        {routers.slice(0,2).map(({ label, link }) => (
          <BottomNavigationAction key={label} label={t(label)} value={label} />
        ))}
      </BottomNavigation>
    </Paper>)
}

export default Footer