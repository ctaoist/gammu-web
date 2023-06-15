import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useSWR, { SWRConfig, useSWRConfig } from "swr";

import { Footer } from "../components/footer";
import { WS } from "../services/ws";
import { getToken, setLogStatus, checkLogStatus } from "../services/login";
import { clearLog as apiClearLog } from "../services/sms";

import {
  alpha,
  Paper,
  ThemeProvider,
  Box,
  Divider,
  Typography,
  Container,
  Grid,
  CssBaseline,
  Stack,
  TextField,
  Button,
  AppBar,
  Tabs,
  Tab,
  InputAdornment,
  InputLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Select,
  MenuItem,
  ListItemText,
  ListItem,
  styled,
} from "@mui/material";

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
    <Box>
      <Container maxWidth="sm">
        <Box sx={{ width: "100%", mr: 1 }}>
          <ListItem>
            <ListItemText primary={t("Language")} />
            <Select
              label={t("Language")}
              size="small"
              labelId="label-lang-select"
              value={lang}
              onChange={(e) => changeLanguage(e.target.value as string)}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="zh">中文</MenuItem>
            </Select>
          </ListItem>
          <Divider />
          <ListItem sx={{ justifyContent: "flex-end" }}>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={viewLog}>
                {t("View Log")}
              </Button>
              <Button
                variant="outlined"
                disabled={clearFlag}
                onClick={clearLog}
              >
                {t("Clear Log")}
              </Button>
            </Stack>
          </ListItem>
          <Divider />
          <ListItem sx={{ justifyContent: "flex-end" }}>
            <Button variant="outlined" onClick={logout}>
              {t("Logout")}
            </Button>
          </ListItem>
        </Box>
      </Container>
      <Footer />
    </Box>
  );
};

export default SettingPage;
