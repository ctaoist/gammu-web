import { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { setToken as setStorageToken, getToken } from '../services/login';
import { Global } from '../services/global';
import { connect as ws_connect } from '../services/ws';
import { getPhoneInfo } from '../services/sms'
import { verifyToken, setLogStatus, checkLogStatus } from '../services/login'

import { Box, Button, Container, Checkbox, TextField, FormGroup, FormControlLabel } from "@mui/material";

export const LoginPage = () => {
  checkLogStatus();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const [token, setToken] = useState(getToken());
  const [connStatus, setConnStatus] = useState(false);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    // console.log(token === '');
  }, []);

  const checkRemember = (e: any) => {
    setRemember(e.target.checked);
  };

  const connect = () => {
    setConnStatus(true);
    Global.token = token;
    if (remember) {
      setStorageToken(token);
    } else {
      setStorageToken('');
    }

    verifyToken().then(resp => {
      if (resp.retCode === 0) {
        setLogStatus(true);
        Global.phoneInfo = { loadFlag: false };
        getPhoneInfo().then(resp => {
          Global.phoneInfo = { loadFlag: true, ...resp.data };
          ws_connect();
          navigate("/sms");
        });
      }
      setConnStatus(false);
    });
  };

  return (<Container maxWidth="sm">
    <Box sx={{ maxWidth: '100%' }}>
      <FormGroup>
        <TextField fullWidth label="Token" variant="standard" value={token} onChange={(e) => setToken(e.target.value)} />
        <FormControlLabel control={<Checkbox defaultChecked={getToken().length > 0} onChange={(e) => checkRemember(e)} />} label={t("Remember it")} />
      </FormGroup>
      <Button sx={{ mt: 2 }} variant="contained" disabled={connStatus} onClick={connect}>{t("Connect")}</Button>
    </Box>
  </Container>
  )
}

export default LoginPage;