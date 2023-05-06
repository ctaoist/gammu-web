import { useEffect, useState, useRef } from 'react';
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";

import { getSMSListByNumber, SMSMessage, sendSMS } from '../services/sms';
import { ChatItem } from '../components/chat_item';
import { DelSMS } from '../components/del_sms';
import { Global } from '../services/global';
import { checkLogStatus } from '../services/login';
import { WS } from '../services/ws';

import { AppBar, Toolbar, Box, Button, CssBaseline, IconButton, List, ListItem, FormGroup, Stack, Container, TextField, Typography, TableBody, Paper, Chip, Divider } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import MenuIcon from '@mui/icons-material/Menu';

export const SMSChatPage = () => {
  checkLogStatus();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [msgs, setMsgs] = useState<SMSMessage[]>([]);
  const [text, setText] = useState('');
  const [page, setPage] = useState(0);
  // const pageRef = useRef<number>(page);
  const [number, setNumber] = useState(location.state?.number || '');
  const [loadMore, setLoadMore] = useState(false);
  const [moreLabel, setMoreLabel] = useState("Load More");
  const [isLoading, setIsLoading] = useState(false);
  const [newFlag, setNewFlag] = useState(location.state?.newSms || false); // New SMS Flag
  const loc = location.state?.smsScrollTo || 0;

  const fetchSMSList = async (p: number): Promise<boolean> => {
    let resp = await getSMSListByNumber(p, number);
    if (resp.retCode !== 0) { return false; }
    if (resp.data.length < 20) { setMoreLabel("No More"); Global.no_more_flag = true; } else { setMoreLabel("Load More"); }
    if (p == 0) { setMsgs(resp.data) } else { setMsgs(resp.data.concat(msgs)) };
    return true;
  }

  if (WS != null) {
    WS.onmessage = (ev) => {
      let data = JSON.parse(ev.data);
      if (data.type === "heartbeat") { return; }
      console.log(data);
      if (newFlag) {
        setNumber(data.msg.number);
        setNewFlag(false);
      }
      setMsgs(preMsgs => { return preMsgs.concat([data.msg]) });
      window.scrollTo(0, document.body.scrollHeight); // scroll to bottom
    };
  }

  const handleScroll = () => {
    if (document.documentElement.scrollTop !== 0 || isLoading || Global.no_more_flag) { return; }

    setPage(prePage => { return prePage + 1; });
  };

  useEffect(() => {
    setIsLoading(true);
    setMoreLabel("Loading...");
    fetchSMSList(page).then((success: boolean) => {
      setIsLoading(false);
      // need rebind to access the newest page state var
      // window.addEventListener("scroll", handleScroll);
      // return () => window.removeEventListener("scroll", handleScroll);
    })
  }, [page]);

  useEffect(() => {
    Global.no_more_flag = false;
    setMsgs([]);
    fetchSMSList(0).then((success: boolean) => {
      success && window.scrollTo(0, document.body.scrollHeight); // scroll to bottom
    });
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const backTo = () => {
    navigate("/sms", { state: { smsScrollTo: loc } });
  };

  const sentSMSClicked = () => {
    sendSMS(number, text).then(resp => {
      if (resp.retCode !== 0) {
        console.log(resp.errorMsg)
      } else {
        setText('')
      }
    });
  };

  return (<Box>
    <Container maxWidth="sm">
      <CssBaseline />
      <AppBar sx={{ position: 'fixed', left: 'auto', right: 'auto', width: '100%', maxWidth: "sm", backgroundColor: 'white' }}>
        <Toolbar>
          <IconButton color="primary" aria-label="back to supper" onClick={backTo}><ArrowBackIcon /></IconButton>
          <Typography variant='h6' sx={{ display: 'inline', color: 'black', flexGrow: 1 }}>{number}</Typography>
          {!newFlag && <DelSMS number={number} loc={loc} />}
        </Toolbar>
      </AppBar>
      {newFlag &&
        <TextField inputProps={{ pattern: "[+\d]" }} required label={t('Addressee')} sx={{ width: '100%', pt: 12 }} value={number} variant="outlined" onChange={(e) => setNumber(e.target.value)} />}
      {!newFlag && <Divider sx={{ width: '100%', pt: 12 }}><Chip label={t(moreLabel)} /></Divider>}
      <List sx={{ mb: 5, display: 'flow-root', minHeight: 10 }}>
        {msgs.map((sms: SMSMessage) => (
          <ChatItem sms={sms} key={sms.id} />
        ))}
      </List>
      <Stack direction="row" sx={{ position: 'fixed', bottom: 0, width: '100%', maxWidth: "sm" }} spacing={1}>
        <TextField hiddenLabel sx={{ width: '100%', backgroundColor: 'white' }} multiline maxRows={4} value={text} onChange={(e) => setText(e.target.value)} />
        <IconButton color="primary" aria-label="send sms" onClick={sentSMSClicked}><SendIcon /></IconButton>
      </Stack>
      {/* <Stack direction="row" sx={{ position: 'fixed', bottom: 0, width: '100%', maxWidth: "sm" }} spacing={1}>
        <TextField hiddenLabel sx={{ width: '100%' }} multiline maxRows={4} value={text} onChange={(e) => setText(e.target.value)} />
        <IconButton color="primary" aria-label="send sms" onClick={sentSMSClicked}><SendIcon /></IconButton>
      </Stack> */}
    </Container>
  </Box>)
}

export default SMSChatPage;