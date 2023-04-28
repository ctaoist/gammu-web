import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Footer } from '../components/footer';
import { SMSItem } from '../components/sms_item';
import { DelSMS } from '../components/del_sms';
import { SMSMessage, getPhoneInfo, getSMSAbstract } from '../services/sms';
import { Global } from '../services/global';
import { WS } from '../services/ws';
import { checkLogStatus } from '../services/login';

import { AppBar, Box, Button, Toolbar, ListItem, Divider, ListItemText, IconButton, Typography, Container, TableContainer, TableCell, TableBody, Table, TableRow, Paper } from '@mui/material';
import TextsmsIcon from '@mui/icons-material/Textsms';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

export const SMSPage = () => {
  checkLogStatus();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const [getSmsListFlag, setGetSmsListFlag] = useState(false);
  const location = useLocation();
  const [smsList, setSmsList] = useState<SMSMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [moreLabel, setMoreLabel] = useState("Load More");
  const [page, setPage] = useState(0);

  if (WS != null) {
    WS.onmessage = (ev) => {
      let data = JSON.parse(ev.data);
      if (data.type === "heartbeat") { return; }
      console.log(data);
      setSmsList(preSmsList => {
        let m: SMSMessage = data.msg;
        let pos = preSmsList.map(e => e.number).indexOf(m.number);
        if (pos < 0) {
          preSmsList.pop();
        } else {
          preSmsList.splice(pos, 1);
        }
        return [m].concat(preSmsList);
      })
    };
  }

  const handleScroll = () => {
    if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || isLoading || Global.no_more_flag)
      return;

    setPage(prePage => { return prePage + 1 });
  };

  useEffect(() => {
    setIsLoading(true);
    setMoreLabel("Loading...");
    getSMSAbstract(page).then(resp => {
      setIsLoading(false);
      if (resp.data.length < 20) { setMoreLabel("No More"); Global.no_more_flag = true; } else { setMoreLabel("Load More"); }
      setSmsList(smsList.concat(resp.data));
    });
  }, [page]);

  useEffect(() => {
    Global.no_more_flag = false;
    getSMSAbstract(page).then(resp => {
      setSmsList(resp.data);
      location.state && location.state.smsScrollTo && window.scrollTo(0, location.state.smsScrollTo);
    });
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []); // empty array, only run once

  const newSms = () => {
    navigate('/sms_chat', { state: { newSms: true, smsScrollTo: document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop } })
  };

  return (<Box>
    <Container maxWidth="sm" sx={{ pb: 7 }}>
      <AppBar sx={{ position: 'fixed', left: 'auto', right: 'auto', backgroundColor: 'white', width: '100%', maxWidth: "sm" }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'black' }}>{t('SMS')}</Typography>
          <IconButton color="primary" aria-label="back to supper" onClick={newSms}><AddCircleOutlineIcon /></IconButton>
        </Toolbar>
      </AppBar>
      <TableContainer component={Paper} sx={{ pt: 8 }}>
        <Table aria-label="simple table">
          <TableBody>
            {smsList.map((sms: SMSMessage) => (
              <TableRow key={sms.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell><SMSItem sms={sms} /></TableCell>
                <TableCell><DelSMS number={sms.number} sms={{ smsList: smsList, set: setSmsList }} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Footer />
    </Container>
  </Box >
  );
}

export default SMSPage;
