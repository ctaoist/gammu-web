import { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { setToken as setStorageToken, getToken } from '../services/login';
import { Global } from '../services/global';
import { connect as ws_connect } from '../services/ws';
import { getPhoneInfo } from '../services/sms'
import { verifyToken, setLogStatus, checkLogStatus } from '../services/login'

export const LoginPage = () => {
  checkLogStatus();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const [token, setToken] = useState(getToken());
  const [connStatus, setConnStatus] = useState(false);
  const [remember, setRemember] = useState(getToken().length > 0);

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

  return (<div className='container'>
    <div className="form-control w-full">
      <label className="label">
        <span className="label-text">Token</span>
      </label>
      <input type="text" value={token} className="input w-full input-bordered" onChange={(e) => setToken(e.target.value)} />
      <label className="label cursor-pointer">
        <span className="label-text">{t("Remember it")}</span>
        <input type="checkbox" defaultChecked={getToken().length > 0} className="checkbox" onChange={(e) => setRemember(e.target.checked)} />
      </label>
    </div>
    <div className="flex justify-end">
      <button className='btn' onClick={connect}>{t("Connect")}</button>
    </div>
  </div>
  );
}

export default LoginPage;