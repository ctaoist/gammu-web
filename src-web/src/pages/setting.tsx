import { useState } from 'react'
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useSWR, { SWRConfig, useSWRConfig } from "swr";

import { Footer } from '../components/footer'
import { WS } from '../services/ws';
import { setLogStatus, checkLogStatus } from '../services/login';

import {
  alpha, Paper, ThemeProvider, Box, Typography, Container, Grid, CssBaseline, Stack,
  TextField, Button, AppBar, Tabs, Tab, InputAdornment, InputLabel,
  Radio, RadioGroup, FormControlLabel, FormControl,
  Select, MenuItem, ListItemText, ListItem,
  styled
} from "@mui/material";

import { setLanguage, getLanguage } from '../services/i18n';

export const SettingPage = () => {
  checkLogStatus();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate } = useSWRConfig();

  const [lang, setLang] = useState(getLanguage());

  const changeLanguage = (lang: string) => {
    setLang(lang);
    setLanguage(lang);
    mutate("updateLanguage");
  };

  const logout = () => {
    setLogStatus(false);
    WS?.close();
    navigate('/');
  };

  return <Box>
    <Container maxWidth="sm"><Box sx={{ width: "100%", mr: 1 }}>
      <ListItem>
        <ListItemText primary={t("Language")} />
        <Select label={t("Language")} size='small' labelId="label-lang-select" value={lang} onChange={(e) => changeLanguage(e.target.value as string)}>
          <MenuItem value="en">English</MenuItem>
          <MenuItem value="zh">中文</MenuItem>
        </Select>
      </ListItem>
      <ListItem sx={{ justifyContent: 'flex-end' }}><Button variant="outlined" onClick={logout}>{t("Logout")}</Button></ListItem>
    </Box >
    </Container>
    <Footer />
  </Box>
}

export default SettingPage;