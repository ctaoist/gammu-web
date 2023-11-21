import { useEffect, useState, useRef, ChangeEvent } from 'react';
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";

import { getSMSListByNumber, SMSMessage, sendSMS } from '../services/sms';
import { DelSMS } from '../components/del_sms';
import { parseTime } from '../services/utils';
import { checkLogStatus } from '../services/login';
import { WS } from '../services/ws';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export const SMSChatPage = () => {
  checkLogStatus();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [msgs, setMsgs] = useState<SMSMessage[]>([]);
  const [text, setText] = useState('');
  const initTextHeight = 48;
  const [textHeight, setTextHeight] = useState(initTextHeight + 'px');
  const [page, setPage] = useState(0);
  // const pageRef = useRef<number>(page);
  const [number, setNumber] = useState(location.state?.number || '');
  const [moreLabel, setMoreLabel] = useState("Load More");
  const [noMoreFlag, setNoMoreFlag] = useState(true); // have no more msgs
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [newFlag, setNewFlag] = useState(location.state?.newSms || false); // New SMS Flag
  const loc = location.state?.smsScrollTo || 0;

  const fetchSMSList = async (p: number): Promise<boolean> => {
    let resp = await getSMSListByNumber(p, number);
    if (resp.retCode !== 0) { return false; }
    if (p == 0) {
      setMsgs(resp.data);
      window.scrollTo(0, document.body.scrollHeight); // scroll to bottom
    } else { setMsgs(resp.data.concat(msgs)) };
    if (resp.data.length < 20) { setMoreLabel("No More"); setNoMoreFlag(true); } else { setNoMoreFlag(false); setMoreLabel("Load More"); }
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
    if (document.documentElement.scrollTop !== 0 || isLoading || noMoreFlag) { return; }

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

  const textChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    let h = e.target.scrollHeight;
    if (h < initTextHeight) { setTextHeight(48 + 'px') }
    if (h > initTextHeight) { setTextHeight(h + 4 + 'px'); }
  }

  const sentSMSClicked = () => {
    setIsSending(true);
    sendSMS(number, text).then(resp => {
      if (resp.retCode !== 0) {
        console.log(resp.errorMsg);
      } else {
        setText('');
        setTextHeight(48 + 'px');
      }
      setIsSending(false);
    });
  };

  return (
    <div className='container'>
      <div className="navbar bg-base-100 sticky top-0 z-30 flex">
        <nav className='navbar border-2'>
          <div className="flex">
            <a className="btn btn-ghost text-xl" onClick={backTo}><ArrowBackIcon /></a>
          </div>
          <h3 className='text-xl flex-1'>{number}</h3>
          {!newFlag && <DelSMS number={number} loc={loc} />}
        </nav>
      </div>{/* end of navbar */}

      {newFlag && <input type="text" placeholder="Phone Number" className="input input-bordered w-full" />}

      {!newFlag && <div className="divider">{t(moreLabel)}</div>}
      <div className='content-box'>
        {msgs.map((sms: SMSMessage) => (
          // <ChatItem sms={sms} key={sms.id} />
          <div className={`chat chat-${sms.sent ? "end" : 'start'} mb-2`} key={sms.id}>
            <div className={`chat-bubble chat-bubble-${sms.sent ? 'primary' : 'info'}`}>{sms.text}</div>
            <div className="chat-footer opacity-50">{parseTime(sms.time)}</div>
          </div>
        ))}
        {/* <div className="chat chat-start hidden">
          <div className="chat-bubble chat-bubble-primary">Hidden</div>
        </div>
        <div hidden className="chat chat-end hidden">
          <div className="chat-bubble chat-bubble-info">Hidden</div>
        </div> */}
      </div>

      <div className="join sticky z-30 bg-base-100 bottom-0 w-full">
        <textarea className='border-2 px-2 rows-1 join-item w-full' style={{ height: textHeight }} value={text} onChange={(e) => { textChange(e) }}></textarea>
        {!isSending && <button className="btn btn-outline join-item" onClick={sentSMSClicked}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 16 16"><path fill="currentColor" d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576L6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76l7.494-7.493Z" /></svg></button>}
        {isSending && <button className="btn btn-outline join-item disabled">Sending</button>}
      </div>
    </div >
  );
}

export default SMSChatPage;